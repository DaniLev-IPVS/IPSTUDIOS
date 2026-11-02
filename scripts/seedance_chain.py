"""Chained Seedance pipeline: every section starts on the exact last frame of the previous one.

  prep N          build v2/src/PN.mp4 = last 2 s of the previous final + blocking pair; print prompt
  splice N FILE   align the Seedance output to the previous final's last frame and write the final

Set HERO_MOBILE=1 for the 9:16 set: blocking from clips/mobile, finals in seedance/mobile.
"""
import json, subprocess, sys, os
import numpy as np

REPO = os.environ.get("HERO_REPO", "/Users/daniellipkovich/My Projects/IP VENTURES CODE/IP Studios")
MOBILE = os.environ.get("HERO_MOBILE") == "1"
W = os.environ.get("CHAIN_WORKDIR", "/tmp/seedance-chain")  # sources and downloads
PAIRS = f"{REPO}/docs/hero/blocking/clips/" + ("mobile" if MOBILE else "pairs")
FINAL = f"{REPO}/docs/hero/seedance"
NAMES = ["P1-cover", "P2-world", "P3-proof", "P4-problem", "P5-vision", "P6-team", "P7-contact"]
PRE = 2.0   # seconds of the previous final prepended to each source
FW, FH = (720, 1280) if MOBILE else (1280, 720)

LOOK = ("Use Image 1 only for what each character looks like; do not copy Image 1's composition, framing or character size. "
        "Labels: TUNG TUNG TUNG SAHUR is the tall wooden log with big round eyes, thin wooden arms and legs and a wooden baseball bat; "
        "BALLERINA CAPPUCCINA is the coffee-cup-headed girl in an orange tutu; TRALALERO TRALALA is the small grey-blue shark standing on two legs in blue sneakers; "
        "BRR BRR PATAPIM is the tall moss-and-root creature with a long nose; TIM CHEESE is the grey rat in a pinstripe suit; "
        "COFFEE-CUP NINJA is the takeaway cup ninja with two blades; BANANA GORILLA is the green chimp in a peeled banana; "
        "WATERMELON ZEBRA is the zebra with a watermelon body. ")
KEEP = ("Every character keeps exactly the size, screen position and path of its block figure at every moment. "
        "They move with lively, characterful animation; when standing they breathe, shift weight, glance around and fidget. "
        "")
BG = ("Delete every coloured square, dot and screen in the background completely: behind the characters there is only deep black-to-wine "
      "empty infinite space with a soft red haze and nothing floating in it. The glossy black reflective floor is infinite: it stretches "
      "seamlessly to the horizon in every direction and fades smoothly into the dark haze. Where the floor meets the haze there is no glowing line, "
      "no edge, no rim light and no row of small lights; there are no lights anywhere on or along the floor. ")
END = "Keep the camera motion, the composition and the timing exactly as in Video 1. Cinematic 3D animated film look, no text anywhere."

CASTD = {
 "tung": "TUNG TUNG TUNG SAHUR is the tall wooden log with big round eyes, thin wooden arms and legs and a wooden baseball bat",
 "capp": "BALLERINA CAPPUCCINA is the coffee-cup-headed girl in an orange tutu",
 "trala": "TRALALERO TRALALA is the small grey-blue shark standing on two legs in blue sneakers",
 "pata": "BRR BRR PATAPIM is the tall moss-and-root creature with a long nose",
 "cheese": "TIM CHEESE is the grey rat in a pinstripe suit",
 "ninja": "COFFEE-CUP NINJA is the takeaway cup ninja with two blades",
 "gor": "BANANA GORILLA is the green chimp in a peeled banana",
 "zeb": "WATERMELON ZEBRA is the zebra with a watermelon body",
}
WHO = {1: ["tung"], 2: ["tung", "capp", "trala", "pata"], 3: ["tung", "capp", "trala", "pata", "cheese", "ninja"], 4: ["tung"],
       5: list(CASTD), 6: list(CASTD), 7: list(CASTD)}
B = "https://6hggvldisl97ymdx.public.blob.vercel-storage.com/projects/cmvvp4osz0001k1079l7ijaw4/external-inputs/"
REF = {"tung": B + "1793568839195-crop-tung.jpg", "capp": B + "1793568839729-crop-capp.jpg", "trala": B + "1793568840217-crop-trala.jpg",
       "pata": B + "1793568841828-crop-pata.jpg", "cheese": B + "1793568842421-crop-cheese.jpg", "ninja": B + "1793568843453-crop-ninja.jpg",
       "gor": B + "1793568844394-crop-gor.jpg", "zeb": B + "1793568845890-crop-zeb.jpg"}
if MOBILE:
    # The close-up crop makes Seedance draw Patapim as a giant; padded so he is small in the picture.
    REF["pata"] = B + "1793598170152-pata-small.jpg"
    CASTD["pata"] = "BRR BRR PATAPIM is the moss-and-root creature with a long nose, small in the picture"
def refs(n): return [REF[c] for c in WHO[n]]
def labels(n):
    out = []
    for i, c in enumerate(WHO[n], 1):
        name, desc = CASTD[c].split(" is ", 1)
        out.append(f"{name} is the character in Image {i} ({desc})")
    return "; ".join(out)
WORDS = {1: "one", 4: "four", 6: "six", 8: "eight"}
VOID = ("no coloured rectangles and no line where the floor ends; the glossy black reflective floor is endless, stretching out to the far distance "
        "and melting softly into a deep black-to-wine fog with a gentle red haze, like an infinite void. No glowing horizon line, no ledge, no stage edge, "
        "no small lights, no lamps, no screens")

BEATS = {
 2: ("From 0:02 to 0:17 Tung watches while Ballerina Cappuccina pirouettes in from the left, Brr Brr Patapim lumbers in from the right and "
     "Tralalero Tralala runs in from the bottom of frame, and the camera slowly pulls back. From 0:17 to the end the four stand in a loose line "
     "in the lower half of the frame, idling, the upper half empty.", ""),
 3: ("Tim Cheese walks in from the left holding a blank cream sign, the coffee-cup ninja drops from above and lands, then the whole group walks "
     "off to the left. Tung stays; a flat round pink disc appears under him and lifts him up on a low platform. From 0:14.75 to the end Tung stands "
     "alone on the raised platform, idling.",
     " The only things allowed in the fog are the three huge dark silhouettes that rise far in the background as shadowy giant figures, exactly as in Video 1."),
 4: ("Tung stands alone on his round pink platform the whole time, breathing, shifting his weight and tapping the bat. From 0:15.25 to the end the camera holds "
     "and Tung idles under the spotlight.",
     " This shot is a 3D graph: keep the glowing white wireframe grid on the floor and behind him exactly as in Video 1, fading in after 0:02 and staying "
     "clearly visible to the end. Keep the three glowing laser lines exactly as in Video 1: the line rising from the lower left up to Tung's platform is "
     "hot white; at the platform it splits, the branch climbing upward to the right is hot red, the branch dropping downward is hot white. Keep the lights "
     "dimming to a single soft spotlight on Tung."),
 5: ("The grid and lasers fade away and the lights come back. Tung's platform lowers, slides to the centre and widens into a large round glossy pink "
     "stage. Everyone walks onto the stage from the sides, the banana gorilla and the watermelon zebra arriving from off frame. The stage rises and "
     "slowly rotates with everyone on it while the camera orbits. From 0:19.5 to the end the stage holds still and everyone idles on it.",
     " The round pink stage is the only object standing on the floor."),
 6: ("The camera is wide and far, the characters are small in the frame. From 0:02 to 0:04 they ride the round pink stage down to the floor, then step "
     "off and walk into one evenly spaced line across the frame, and the stage sinks away into the floor. From 0:08.3 to the end they stand in that line, "
     "left to right: watermelon zebra, banana gorilla, Tralalero Tralala, Ballerina Cappuccina, Tung Tung Tung Sahur, coffee-cup ninja, Tim Cheese, "
     "Brr Brr Patapim; their feet near the lower third of the frame, the entire upper half of the frame empty.", ""),
 7: ("From 0:02 to 0:07.4 they break the line and walk off in different directions, scattering across the floor; never line them up again. "
     "From 0:07.4 to the end they are spread out and relaxed: Tung Tung Tung Sahur stands close to the camera on the right side of the frame; Ballerina "
     "Cappuccina and Brr Brr Patapim stand far back on the right; the coffee-cup ninja sits on the floor at the far right edge; Tralalero Tralala bounces on "
     "the spot far back on the left; the banana gorilla sits at the far left edge; the watermelon zebra stands far back on the left; Tim Cheese sits on the "
     "floor in the front left. The centre of the frame and the entire upper half stay empty.", ""),
}

# Mobile restages World, Team and Contact (see scripts/build_mobile_blend.py).
MOBILE_BEATS = {
 2: ("From 0:02 to 0:17 Tung watches while Ballerina Cappuccina pirouettes in from the left, Brr Brr Patapim lumbers in from the right and "
     "Tralalero Tralala runs in from the bottom of frame, and the camera slowly pulls back. From 0:17 to the end the four stand at two depths in the "
     "lower half of the frame, idling: Tung and Brr Brr Patapim further back, Ballerina Cappuccina at the front left and Tralalero Tralala at the front "
     "right; the upper half of the frame empty. Brr Brr Patapim is not a giant: he is only a little taller than Tung, stands beside him at the same "
     "distance from the camera, and the top of his head stays level with Tung's head, below the middle of the frame.", ""),
 6: ("From 0:02 to 0:04 they ride the round pink stage down to the floor, then step off and walk into two staggered rows of four, and the stage sinks "
     "away into the floor. From 0:08.3 to the end they stand in those rows, idling. Back row, left to right: watermelon zebra, Brr Brr Patapim, banana "
     "gorilla, coffee-cup ninja. Front row, left to right: Tralalero Tralala, Ballerina Cappuccina, Tung Tung Tung Sahur, Tim Cheese. All of them in the "
     "lower half of the frame, the entire upper half empty.", ""),
 7: ("From 0:02 every figure is already its finished character; no grey block, statue or unfinished figure is ever visible. "
     "From 0:02 to 0:07.4 they clearly break the two rows: each one turns and walks to a new spot, following its block figure's path, and they "
     "never stand in rows again; nobody leaves the frame. From 0:07.4 to the end they are spread out "
     "and relaxed: Tung Tung Tung Sahur stands closest to the camera, just right of centre at the bottom of the frame; the watermelon zebra, banana gorilla, "
     "Tralalero Tralala and Tim Cheese idle further back along the left edge (Tim Cheese sits on the floor, Tralalero bounces on the spot); Brr Brr Patapim, "
     "Ballerina Cappuccina and the coffee-cup ninja idle further back along the right edge (the ninja sits on the floor). The entire upper half stays empty.", ""),
}
if MOBILE:
    BEATS.update(MOBILE_BEATS)
    BEATS[3] = (BEATS[3][0], BEATS[3][1][:-1] + "; they stay low and far away, their tops below the middle of the frame.")
    BEATS[4] = (BEATS[4][0] + " Tung stays small and far from the camera, exactly the size of the block figure: the top of his head is just below "
                "the middle of the frame, never higher, and everything above the middle of the frame is empty dark space.", BEATS[4][1])
    BEATS[5] = (BEATS[5][0] + " Everyone stays as small as their block figures: the whole group and the stage stay inside the middle band of the frame, "
                "from about a third of the way down to about four fifths of the way down; the top third of the frame is empty dark space.", BEATS[5][1])
    # The portrait blocking shows a lot of dark-red backdrop; without this Seedance turns it into a flat red wall.
    VOID += (". The space behind the characters stays as dark as in the first two seconds, mostly black with only a faint low red glow; "
             "it never becomes a red wall, curtain or backdrop")


def prompt1():
    return ("Edit Video 1 in three ways. First, erase the floating white words (the character name label) and replace them with empty background, so the "
            "result contains no words or letters at all. Second, replace the grey block figure with TUNG TUNG TUNG SAHUR from Image 1 (the tall wooden log "
            "with big round eyes, thin wooden arms and legs and a wooden baseball bat); only this one character appears, never add any other. Use the image "
            "only for what he looks like; do not copy its framing or size. He walks in from far back on the right, crosses toward the centre and walks "
            "forward, then settles just right of centre with his feet near the bottom of the frame and idles to the end: breathing, shifting his weight, "
            "glancing around, tapping the bat. He keeps the exact size, screen position and path of the block figure at every moment: he stays small, "
            "and even when he is closest to the camera the top of his head is just below the middle of the frame, never higher. Third, restyle the "
            "background: " + VOID + ". Keep the camera and the timing exactly as in Video 1. The upper half of the frame stays empty. "
            "Cinematic 3D animated film look.")


def prompt(n):
    beat, extra = BEATS[n]
    return ("Edit Video 1 in four ways. First, Video 1 from 0:00 to 0:02 is already finished footage: keep those two seconds exactly unchanged. "
            "Second, from 0:02 onward erase every floating white word (the character name labels) and replace it with empty background, so the result "
            "contains no words or letters at all. "
            "Third, from 0:02 onward replace each grey block figure with the character its label names, and every character who is already on screen at "
            "0:02 keeps looking exactly as it does there. Labels: " + labels(n) + ". " +
            (f"Exactly {WORDS[len(WHO[n])]} characters appear in this shot, one per block figure; " if len(WHO[n]) > 1 else "Only this one character appears; ") + "never add any other character. Use the images only for what each character looks like; do not copy their "
            "framing or size. " + beat + " Every character keeps the exact size, screen position and path of its block figure at "
            "every moment" + (" (do not enlarge anyone: in this tall frame every head stays in the lower half of the frame, the upper half is "
            "left empty for text)" if MOBILE and n != 7 else "") + ", with lively, characterful animation; when standing they breathe, shift weight, glance around and fidget. "
            "Fourth, from 0:02 onward the background stays exactly as it is from 0:00 to 0:02: " + VOID + "." + extra +
            " Keep the camera motion and the timing exactly as in Video 1. Cinematic 3D animated film look.")

def sh(*a): subprocess.run(a, check=True)

def probe_frames(f):
    out = subprocess.run(["ffprobe", "-v", "error", "-count_frames", "-select_streams", "v", "-show_entries", "stream=nb_read_frames",
                          "-of", "csv=p=0", f], capture_output=True, text=True, check=True).stdout
    return int(out.strip())

def read_frames(f, start=0, count=None):
    vf = f"scale={FW}:{FH},fps=24"
    cmd = ["ffmpeg", "-v", "error", "-i", f, "-vf", vf, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"]
    raw = subprocess.run(cmd, capture_output=True, check=True).stdout
    a = np.frombuffer(raw, np.uint8).reshape(-1, FH, FW, 3)
    return a[start:start + count] if count else a[start:]

def final_path(n): return f"{FINAL}/{'mobile' if MOBILE else 'v2'}/{NAMES[n-1]}.mp4"

def prep(n):
    os.makedirs(f"{W}/src", exist_ok=True)
    out = f"{W}/src/{NAMES[n-1]}.mp4"
    blk = f"{PAIRS}/{NAMES[n-1]}.mp4"
    enc = ["-c:v", "libx264", "-crf", "24", "-maxrate", "1.4M", "-bufsize", "2.8M", "-pix_fmt", "yuv420p", "-r", "24", "-an"]
    if n == 1:
        sh("ffmpeg", "-v", "error", "-y", "-i", blk, "-vf", f"scale={FW}:{FH},fps=24", *enc, out)
    else:
        prev = final_path(n - 1)
        nf = probe_frames(prev)
        sh("ffmpeg", "-v", "error", "-y", "-i", prev, "-i", blk, "-filter_complex",
           f"[0:v]scale={FW}:{FH},fps=24,trim=start_frame={nf-int(PRE*24)},setpts=PTS-STARTPTS[a];"
           f"[1:v]scale={FW}:{FH},fps=24,setpts=PTS-STARTPTS[b];[a][b]concat=n=2:v=1[v]", "-map", "[v]", *enc, out)
    print(out, os.path.getsize(out) / 1e6, "MB", probe_frames(out) / 24, "s")
    if n > 1 or MOBILE:
        text = prompt(n) if n > 1 else prompt1()
        open(f"{W}/src/{NAMES[n-1]}.txt", "w").write(text)
        print(text); print(json.dumps(refs(n)))

def write_video(frames, out):
    os.makedirs(os.path.dirname(out), exist_ok=True)
    p = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{FW}x{FH}", "-r", "24", "-i", "-",
                          "-c:v", "libx264", "-crf", "12", "-preset", "slow", "-pix_fmt", "yuv420p", out], stdin=subprocess.PIPE)
    for fr in frames: p.stdin.write(fr.tobytes())
    p.stdin.close(); p.wait()

def splice(n, f):
    o = read_frames(f)
    if n == 1:
        write_video(o, final_path(1)); print("P1 frames", len(o)); return
    last = read_frames(final_path(n - 1))[-1].astype(np.float32)
    k = int(PRE * 24)
    lo, hi = max(0, k - 18), min(len(o), k + 18)
    err = [float(np.mean(np.abs(o[j].astype(np.float32) - last))) for j in range(lo, hi)]
    j = lo + int(np.argmin(err))
    print(f"best match frame {j} (expected {k-1}), mean abs err {min(err):.2f}; neighbours", [round(e, 1) for e in err])
    body = o[j:].astype(np.float32)
    d = last - body[0]
    N = 14
    for t in range(min(N, len(body))):
        w = 0.5 * (1 + np.cos(np.pi * t / N))   # 1 -> 0, smooth
        body[t] += d * w
    body[0] = last
    write_video(np.clip(body, 0, 255).astype(np.uint8), final_path(n))
    print(NAMES[n-1], "final frames", len(body), "seconds", len(body) / 24)

if __name__ == "__main__":
    cmd, n = sys.argv[1], int(sys.argv[2])
    prep(n) if cmd == "prep" else splice(n, sys.argv[3])
