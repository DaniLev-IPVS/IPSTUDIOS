#!/usr/bin/env python3
"""Build the web hero video set from the seven section pairs.

Each pair is one motion clip followed by its rest clip (M_i + R_i), rendered and
edited as a single source so the hand-off inside a section is continuous.
Source per pair: docs/hero/seedance/v2/P<i>-*.mp4 (the chained Seedance 2.5 edits, where
the first frame of every pair is the exact last frame of the pair before) if present,
else docs/hero/seedance/P<i>-*.mp4, else the Blender playblast.

Outputs:
  public/hero/motion.mp4   M1..M7 back to back, short GOP so scroll scrubbing seeks fast
  public/hero/r1.mp4..r7   rest loops
  public/hero/poster.jpg   first frame, shown before the video loads
  src/hero/manifest.json   measured offsets and durations, read by the site
"""
import json, pathlib, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SEED = ROOT / "docs/hero/seedance"
SEED2 = SEED / "v2"
BLOCK = ROOT / "docs/hero/blocking/clips/pairs"
OUT = ROOT / "public/hero"
MANIFEST = ROOT / "src/hero/manifest.json"

# name, motion frames, rest frames (24 fps, from the Blender timeline)
PAIRS = [
    ("P1-cover", 144, 120),
    ("P2-world", 360, 120),
    ("P3-proof", 306, 144),
    ("P4-problem", 318, 120),
    ("P5-vision", 421, 120),
    ("P6-team", 152, 159),
    ("P7-contact", 129, 187),
]
VF = "scale=1280:720:flags=lanczos,fps=24,format=yuv420p"


def source(name):
    for d, kind in ((SEED2, "seedance-v2"), (SEED, "seedance"), (BLOCK, "blocking")):
        for ext in (".mp4", ".mov"):
            p = d / (name + ext)
            if p.exists():
                return p, kind
    sys.exit(f"missing pair: {name}")


def frames(p):
    out = subprocess.check_output(["ffprobe", "-v", "error", "-count_frames", "-select_streams", "v",
                                   "-show_entries", "stream=nb_read_frames", "-of", "csv=p=0", str(p)])
    return int(out.strip())


def run(args):
    subprocess.run(["ffmpeg", "-v", "error", "-y", *args], check=True)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    plan = []
    for name, mf, rf in PAIRS:
        p, kind = source(name)
        n = frames(p)
        split = round(n * mf / (mf + rf))  # first rest frame
        plan.append((name, p, kind, n, split))

    inputs = sum([["-i", str(p)] for _, p, _, _, _ in plan], [])
    chains = "".join(f"[{i}:v]{VF},trim=end_frame={s},setpts=PTS-STARTPTS[v{i}];" for i, (_, _, _, _, s) in enumerate(plan))
    concat = "".join(f"[v{i}]" for i in range(len(plan))) + f"concat=n={len(plan)}:v=1:a=0[out]"
    run([*inputs, "-filter_complex", chains + concat, "-map", "[out]", "-an",
         "-c:v", "libx264", "-preset", "slow", "-crf", "23",
         "-x264-params", "keyint=4:min-keyint=1:scenecut=0:bframes=0",
         "-movflags", "+faststart", str(OUT / "motion.mp4")])

    motion, rest, used, f0 = [], [], {}, 0
    for i, (name, p, kind, n, split) in enumerate(plan, 1):
        motion.append({"name": name, "startFrame": f0, "frames": split,
                       "start": round(f0 / 24, 4), "duration": round(split / 24, 4)})
        f0 += split
        # Rest loops play forward then backward (first rest frame .. last frame .. back), so
        # the loop point is seamless. peakFrame is the pair's last frame, which is also the
        # first frame of the next pair's motion clip.
        r = n - split
        run(["-i", str(p), "-filter_complex",
             f"[0:v]{VF},trim=start_frame={split},setpts=PTS-STARTPTS,split[a][b];"
             f"[b]reverse,trim=start_frame=1:end_frame={r - 1},setpts=PTS-STARTPTS[r];[a][r]concat=n=2:v=1:a=0[o]",
             "-map", "[o]", "-an", "-c:v", "libx264", "-preset", "slow", "-crf", "23",
             "-x264-params", "keyint=6:min-keyint=1:scenecut=0:bframes=0",
             "-movflags", "+faststart", str(OUT / f"r{i}.mp4")])
        rest.append({"name": name, "src": f"/hero/r{i}.mp4", "frames": 2 * r - 2, "peakFrame": r - 1,
                     "duration": round((2 * r - 2) / 24, 4)})
        used[name] = kind
    t = f0 / 24

    run(["-i", str(plan[0][1]), "-vf", VF, "-frames:v", "1", "-q:v", "3", str(OUT / "poster.jpg")])
    MANIFEST.write_text(json.dumps({"motionSrc": "/hero/motion.mp4", "poster": "/hero/poster.jpg",
                                    "motion": motion, "rest": rest, "sources": used}, indent=2) + "\n")
    size = sum(f.stat().st_size for f in OUT.glob("*")) / 1e6
    print(f"motion {t:.2f}s, total {size:.1f} MB, sources: {used}")


if __name__ == "__main__":
    main()
