"use client";

import { useEffect, useRef, useState } from "react";
import Logo from "@/components/Logo";
import desktopManifest from "@/hero/manifest.json";
import mobileManifest from "@/hero/manifest-mobile.json";
import { brand, contactEmail, sections, teamCircles, viralStats } from "@/content";

/*
 * The whole site is one scene. A fixed 16:9 video fills the viewport (object-fit: cover)
 * and the copy sits in front of it.
 *
 *   M1 (cover)  autoplays once on load with scrolling locked.
 *   R1..R7      rest loops: the camera is parked, the characters idle, the copy is up.
 *   M2..M7      motion clips between two rests. One swipe, wheel flick or arrow key plays
 *               the next one at normal speed; another gesture mid-move pauses it.
 *
 * All motion clips live in one file (motion.mp4) back to back; manifest.json holds
 * each clip's offset in frames. The Seedance pairs are chained: the first frame of every
 * pair is the exact last frame of the pair before, so the scene never jumps.
 *
 * Phones get their own 9:16 set (public/hero/m, manifest-mobile.json), filmed with a
 * portrait camera so the copy sits above the characters instead of beside them.
 */

type Seg = { kind: "rest" | "motion"; index: number; start: number; length: number };
type Manifest = typeof desktopManifest;

/** Scroll lengths in viewport heights: per rest, per second of motion, minimum per motion. */
type Pace = { rest: number; lastRest: number; perSecond: number; minMotion: number };
const DESKTOP_PACE: Pace = { rest: 120, lastRest: 100, perSecond: 13, minMotion: 90 };
const MOBILE_PACE: Pace = { rest: 60, lastRest: 70, perSecond: 10, minMotion: 60 };
/** Where a rest is parked: this fraction of the way into its scroll segment. */
const REST_POINT = 0.3;
/** Speed a move plays at once a gesture starts it: 1 is the footage's own speed. */
const PLAY_RATE = 1;

function buildTrack(manifest: Manifest, pace: Pace): { segs: Seg[]; total: number } {
  const segs: Seg[] = [];
  let y = 0;
  for (let i = 0; i < manifest.rest.length; i++) {
    const length = i === manifest.rest.length - 1 ? pace.lastRest : pace.rest;
    segs.push({ kind: "rest", index: i, start: y, length });
    y += length;
    const m = manifest.motion[i + 1];
    if (m) {
      const len = Math.max(pace.minMotion, m.duration * pace.perSecond);
      segs.push({ kind: "motion", index: i + 1, start: y, length: len });
      y += len;
    }
  }
  return { segs, total: y };
}

const smooth = (t: number) => {
  const c = Math.min(1, Math.max(0, t));
  return c * c * (3 - 2 * c);
};

const FPS = 24;
/** Time of the centre of frame `f`, so seeks land on that exact frame. */
const frameTime = (f: number) => (f + 0.5) / FPS;

/** One video set (desktop 16:9 or mobile 9:16) and the scroll track built from it. */
function makeHero(manifest: Manifest, portrait: boolean) {
  const track = buildTrack(manifest, portrait ? MOBILE_PACE : DESKTOP_PACE);
  return {
    manifest,
    portrait,
    /**
     * Fastest a rest loop scrubs to the frame it hands over on, in seconds of footage per
     * second, so leaving a rest is quick but never a jump.
     */
    maxRestRate: 3,
    track,
    motionFirst: (j: number) => frameTime(manifest.motion[j].startFrame),
    motionLast: (j: number) => frameTime(manifest.motion[j].startFrame + manifest.motion[j].frames - 1),
    /** Opacity of the copy for rest `i` at track position `y` (in vh). */
    copyOpacity(i: number, y: number) {
      const rest = track.segs.find((s) => s.kind === "rest" && s.index === i)!;
      const next = track.segs.find((s) => s.kind === "motion" && s.index === i + 1);
      if (y < rest.start) return i === 0 ? 1 : 0;
      const fadeIn = i === 0 ? 1 : smooth((y - rest.start) / (rest.length * 0.14));
      if (!next || y < next.start) return fadeIn;
      return 1 - smooth((y - next.start) / (next.length * 0.18));
    },
  };
}
type Hero = ReturnType<typeof makeHero>;

const DESKTOP = makeHero(desktopManifest, false);
const MOBILE = makeHero(mobileManifest as Manifest, true);
/** Phones in portrait get the 9:16 set; tablets and landscape keep the 16:9 one. */
const PORTRAIT_SET = "(max-aspect-ratio: 2/3)";

type Phase = "intro" | "live";

export default function HeroStage() {
  const motionRef = useRef<HTMLVideoElement>(null);
  const restRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const copyRefs = useRef<(HTMLElement | null)[]>([]);
  const stageRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>("intro");
  const [section, setSection] = useState(0);
  const phaseRef = useRef<Phase>("intro");
  // Rest a nav button is jumping to: the speed cap stands aside until it lands.
  const jumpRef = useRef<number | null>(null);
  // Set by the step loop: send the picture straight to rest k.
  const jumpToRef = useRef<((k: number) => void) | null>(null);
  // Chosen once on load, so the videos never reload mid-scroll.
  const [hero, setHero] = useState<Hero | null>(null);

  useEffect(() => {
    setHero(window.matchMedia(PORTRAIT_SET).matches ? MOBILE : DESKTOP);
  }, []);

  // Fit a box to the same rectangle the cover-fitted video occupies, so copy
  // positioned in frame percentages lines up with the characters.
  useEffect(() => {
    if (!hero) return;
    const ar = hero.portrait ? 9 / 16 : 16 / 9;
    const fit = () => {
      const el = stageRef.current;
      if (!el) return;
      const w = Math.max(window.innerWidth, window.innerHeight * ar);
      const h = w / ar;
      el.style.setProperty("--sw", `${w}px`);
      el.style.setProperty("--sh", `${h}px`);
      el.style.setProperty("--sx", `${(window.innerWidth - w) / 2}px`);
      el.style.setProperty("--sy", `${(window.innerHeight - h) / 2}px`);
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [hero]);

  // Intro: play M1 once with scrolling locked, then hand over to the R1 loop.
  useEffect(() => {
    const v = motionRef.current;
    if (!v || !hero) return;
    const { manifest, motionLast } = hero;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const end = motionLast(0);
    const finish = () => {
      if (phaseRef.current === "live") return;
      phaseRef.current = "live";
      v.pause();
      document.documentElement.style.overflow = "";
      setPhase("live");
    };
    window.scrollTo(0, 0);
    if (reduce) {
      v.currentTime = end;
      finish();
      return;
    }
    document.documentElement.style.overflow = "hidden";
    // Watch every frame so the intro stops exactly on motion 0's last frame.
    let watch = 0;
    const onTime = () => {
      if (v.currentTime >= end - 1.5 / FPS) {
        v.pause();
        v.currentTime = end;
        finish();
        return;
      }
      watch = requestAnimationFrame(onTime);
    };
    watch = requestAnimationFrame(onTime);
    v.addEventListener("ended", finish);
    v.play().catch(finish);
    // Never trap the visitor if the video stalls.
    const guard = window.setTimeout(finish, (manifest.motion[0].duration + 6) * 1000);
    return () => {
      cancelAnimationFrame(watch);
      v.removeEventListener("ended", finish);
      window.clearTimeout(guard);
      document.documentElement.style.overflow = "";
    };
  }, [hero]);

  // Step loop. Two layers show the scene: the motion clip (following `pos`) and the
  // rest loop of the current section. They only ever swap on a frame both show
  // identically, so there is no fade and no jump:
  //   motion j -> rest j     motion settles on its last frame, rest starts at frame 0
  //   motion j -> rest j-1   motion settles on its first frame, rest starts at its peak
  //   rest k  -> motion k+1  rest scrubs to its peak (the pair's last frame), which is
  //                          the first frame of motion k+1
  //   rest k  -> motion k    rest scrubs back to frame 0, next to motion k's last frame
  useEffect(() => {
    if (phase !== "live" || !hero) return;
    const { manifest, track: TRACK, motionFirst, motionLast, copyOpacity } = hero;
    const v = motionRef.current!;
    const rests = restRefs.current;
    let raf = 0;
    let last = performance.now();
    let lastSection = -1;
    // What is on screen, and a pending swap waiting for its target frame to decode.
    let shown: { kind: "rest" | "motion"; index: number } = { kind: "rest", index: 0 };
    let pending: { kind: "rest" | "motion"; index: number } | null = null;
    let current = motionLast(0);
    const copyShown: number[] = [1];

    const restSeg = (k: number) => TRACK.segs.find((s) => s.kind === "rest" && s.index === k)!;
    const layer = (kind: "rest" | "motion", index: number) => {
      v.style.opacity = kind === "motion" ? "1" : "0";
      rests.forEach((r, i) => {
        if (!r) return;
        const on = kind === "rest" && i === index;
        r.style.opacity = on ? "1" : "0";
        if (!on && !r.paused) r.pause();
      });
    };
    const startRest = (k: number, t: number) => {
      const r = rests[k];
      if (!r) return;
      r.currentTime = t;
      pending = { kind: "rest", index: k };
    };

    // The intro ended on motion 0's last frame; rest 0 picks up at its frame 0.
    shown = { kind: "motion", index: 0 };
    startRest(0, frameTime(0));

    // Steps: the page never scrolls. One swipe, wheel flick or arrow key plays the next
    // (or previous) move at normal speed and parks on its rest. Another gesture while a
    // move plays pauses it; the next one carries on, or turns back if it points the other way.
    // `pos` is a position on the track (in vh) that the picture follows, as scroll once did.
    const lastRest = manifest.rest.length - 1;
    const park = (k: number) => restSeg(k).start + restSeg(k).length * REST_POINT;
    const motionSeg = (j: number) => TRACK.segs.find((s) => s.kind === "motion" && s.index === j)!;
    let pos = park(0);
    let at = 0; // rest the picture is parked on, or leaving
    let move: { j: number; dir: 1 | -1; paused: boolean } | null = null;

    const step = (d: 1 | -1) => {
      jumpRef.current = null;
      if (move) {
        if (!move.paused) move.paused = true;
        else {
          move.paused = false;
          move.dir = d;
        }
        return;
      }
      if (at + d < 0 || at + d > lastRest) return;
      const j = d > 0 ? at + 1 : at;
      const m = motionSeg(j);
      pos = d > 0 ? m.start : m.start + m.length - 0.001;
      move = { j, dir: d, paused: false };
    };
    jumpToRef.current = (k: number) => {
      move = null;
      at = k;
      pos = park(k);
      jumpRef.current = k;
    };

    // A wheel or trackpad gesture is a burst of events; count each burst once. A burst
    // ends after a short quiet gap, or when the deltas jump up again after dying down
    // (a fresh flick during a trackpad's momentum tail).
    let wheelLast = 0;
    let wheelSum = 0;
    let wheelAbs = 0;
    let wheelFired = false;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const now = performance.now();
      const d = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1);
      const a = Math.abs(d);
      if (now - wheelLast > 220 || (wheelFired && wheelAbs < 12 && a > Math.max(30, wheelAbs * 4))) {
        wheelSum = 0;
        wheelFired = false;
      }
      wheelLast = now;
      wheelAbs = a;
      if (wheelFired) return;
      wheelSum += d;
      if (Math.abs(wheelSum) > 24) {
        wheelFired = true;
        step(wheelSum > 0 ? 1 : -1);
      }
    };
    let touchY: number | null = null;
    const onTouchStart = (e: TouchEvent) => {
      touchY = e.touches[0]?.clientY ?? null;
    };
    const onTouchMove = (e: TouchEvent) => e.preventDefault();
    const onTouchEnd = (e: TouchEvent) => {
      if (touchY === null) return;
      const dy = touchY - (e.changedTouches[0]?.clientY ?? touchY);
      touchY = null;
      if (Math.abs(dy) > 30) step(dy > 0 ? 1 : -1);
      // A tap on the picture pauses or resumes a move (links and buttons keep working).
      else if (move && !(e.target as Element | null)?.closest?.("a, button")) step(move.dir);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const d = { ArrowDown: 1, PageDown: 1, " ": 1, ArrowUp: -1, PageUp: -1 }[e.key] as 1 | -1 | undefined;
      if (d) {
        e.preventDefault();
        step(e.key === " " && e.shiftKey ? -1 : d);
      } else if (e.key === "Home" || e.key === "End") {
        e.preventDefault();
        jumpToRef.current?.(e.key === "Home" ? 0 : lastRest);
      }
    };
    document.documentElement.style.overflow = "hidden";
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("keydown", onKey);

    const tick = (now: number) => {
      const dt = Math.min(0.25, (now - last) / 1000);
      last = now;

      // Play the move: once the picture is on its clip, walk `pos` across it in real time.
      if (move && !move.paused && !pending && shown.kind === "motion" && shown.index === move.j) {
        const m = motionSeg(move.j);
        pos += (move.dir * m.length * dt * PLAY_RATE) / manifest.motion[move.j].duration;
        if (move.dir > 0 && pos >= m.start + m.length) {
          at = move.j;
          pos = park(at);
          move = null;
        } else if (move.dir < 0 && pos <= m.start) {
          at = move.j - 1;
          pos = park(at);
          move = null;
        }
      }

      const jumping = jumpRef.current !== null;
      if (jumping && !pending && shown.kind === "rest" && shown.index === jumpRef.current) jumpRef.current = null;
      // The clip follows `pos` exactly; only a rest loop scrubbing to its hand-over frame is capped.
      const maxRate = Infinity;
      const maxRestRate = jumping ? Infinity : hero.maxRestRate;

      const y = pos;
      const seg = TRACK.segs.find((s) => y >= s.start && y < s.start + s.length) ?? TRACK.segs[TRACK.segs.length - 1];

      if (pending) {
        // Swap only once the incoming layer has decoded its target frame.
        const el = pending.kind === "motion" ? v : rests[pending.index];
        if (el && !el.seeking && el.readyState >= 2) {
          shown = pending;
          pending = null;
          layer(shown.kind, shown.index);
          if (shown.kind === "rest") rests[shown.index]?.play().catch(() => {});
        }
      } else if (shown.kind === "rest") {
        const k = shown.index;
        const r = rests[k];
        const inOwnRest = seg.kind === "rest" && seg.index === k;
        if (r && !inOwnRest) {
          // Leaving the rest: scrub the idle loop to the frame it shares with the
          // neighbouring motion clip (fast, but through every frame), then hand over.
          const down = seg.start > restSeg(k).start;
          if (!r.paused) r.pause();
          const peak = frameTime(manifest.rest[k].peakFrame);
          const end = frameTime(manifest.rest[k].frames - 1);
          const goal = down ? peak : r.currentTime > peak ? end : frameTime(0);
          const diff = goal - r.currentTime;
          if (Math.abs(diff) < 0.5 / FPS) {
            const j = down ? k + 1 : k;
            current = down ? motionFirst(j) : motionLast(j);
            v.currentTime = current;
            pending = { kind: "motion", index: j };
          } else if (!r.seeking) {
            // Time-based so slow devices catch up as fast as quick ones.
            const step =
              Math.sign(diff) *
              Math.min(Math.abs(diff), dt * maxRestRate, Math.max(dt * 6, Math.abs(diff) * (1 - Math.exp(-dt * 14))));
            r.currentTime = r.currentTime + step;
          }
        }
      } else {
        const j = shown.index;
        let target: number;
        let arrive: number | null = null; // rest to hand over to once the motion lands
        if (seg.kind === "motion" && seg.index === j) {
          const p = Math.min(1, Math.max(0, (y - seg.start) / seg.length));
          target = motionFirst(j) + p * (motionLast(j) - motionFirst(j));
        } else if (seg.start >= restSeg(j).start) {
          // Scroll is past this clip: land on its last frame and hand over to rest j.
          target = motionLast(j);
          arrive = j;
        } else {
          // Scroll is before this clip: land on its first frame and hand back to rest j-1.
          target = motionFirst(j);
          arrive = j - 1;
        }
        const chase = (target - current) * (1 - Math.exp(-dt * 12));
        current += Math.sign(chase) * Math.min(Math.abs(chase), dt * maxRate);
        if (Math.abs(target - current) < 0.004) current = target;
        if (!v.seeking && Math.abs(v.currentTime - current) > 0.01) v.currentTime = current;
        if (arrive !== null && current === target && !v.seeking) {
          startRest(arrive, arrive === j ? frameTime(0) : frameTime(manifest.rest[arrive].peakFrame));
        }
      }

      const sec = seg.kind === "rest" ? seg.index : Math.max(0, seg.index - 1);
      if (sec !== lastSection) {
        lastSection = sec;
        setSection(sec);
      }

      // Copy follows `pos`, but only once the picture has reached its section.
      const onScreen = (i: number) =>
        (shown.kind === "rest" && shown.index === i) ||
        // leaving rest i (its copy fades out as the move starts)
        (shown.kind === "motion" && shown.index === i + 1) ||
        // arriving at rest i: only once the picture is nearly parked
        (shown.kind === "motion" && shown.index === i && current > motionLast(i) - 0.35);
      copyRefs.current.forEach((el, i) => {
        if (!el) return;
        const want = onScreen(i) ? copyOpacity(i, y) : 0;
        const prev = copyShown[i] ?? want;
        const o = prev + (want - prev) * (1 - Math.exp(-dt * 14));
        copyShown[i] = Math.abs(o - want) < 0.005 ? want : o;
        el.style.opacity = String(o);
        el.style.visibility = o < 0.01 ? "hidden" : "visible";
        el.style.setProperty("--enter", String(1 - o));
      });

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("keydown", onKey);
      jumpToRef.current = null;
      document.documentElement.style.overflow = "";
    };
  }, [phase, hero]);

  // On portrait screens that still get the 16:9 set (tablets), the frame is cropped to
  // its centre, so pan the crop toward where the action is in each section.
  useEffect(() => {
    if (!hero || hero.portrait) return;
    const mq = window.matchMedia("(max-aspect-ratio: 4/3), (max-width: 820px)");
    const apply = () => {
      const pos = mq.matches ? `${PORTRAIT_FOCUS[section] ?? 50}% 50%` : "";
      const vids = [motionRef.current, ...restRefs.current];
      vids.forEach((v) => {
        if (v) v.style.objectPosition = pos;
      });
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [section, hero]);

  const goTo = (i: number) => {
    jumpToRef.current?.(i);
  };

  const labels = ["Cover", "The world", "Proof", "The problem", "The vision", "Team", "Contact"];

  return (
    <>
      <div ref={stageRef} className={`stage fixed inset-0 overflow-hidden bg-ink ${hero?.portrait ? "stage-portrait" : ""}`}>
        {hero && (
          <>
        <video
          ref={motionRef}
          className="stage-video"
          src={hero.manifest.motionSrc}
          poster={hero.manifest.poster}
          muted
          playsInline
          preload="auto"
          style={{ opacity: 1 }}
        />
        {hero.manifest.rest.map((r, i) => (
          <video
            key={r.src}
            ref={(el) => {
              restRefs.current[i] = el;
            }}
            className="stage-video"
            src={r.src}
            muted
            loop
            playsInline
            preload={Math.abs(i - section) <= 1 ? "auto" : "metadata"}
            style={{ opacity: 0 }}
          />
        ))}
          </>
        )}
        <div className="stage-vignette" />

        {/* Copy layer. Positions are percentages of the video frame. */}
        <div className="copy-layer">
          {/* 1 Cover */}
          <section
            ref={(el) => {
              copyRefs.current[0] = el;
            }}
            className="copy copy-cover"
            style={{ left: "50%", top: "50%", width: "48%" }}
          >
            <p className={`eyebrow !tracking-[0.9em] ${phase === "intro" ? "rise" : ""}`}>{brand.year}</p>
            <h1 className={`m-0 ${phase === "intro" ? "rise rise-1" : ""}`}>
              <Logo variant="horizontal" className="cover-logo" />
              <span className="sr-only">{brand.name}</span>
            </h1>
            <p className={`display cover-tagline ${phase === "intro" ? "rise rise-2" : ""}`}>{brand.tagline}</p>
            <p className="scroll-hint eyebrow" style={{ opacity: phase === "live" ? 1 : 0 }}>
              Scroll
            </p>
          </section>

          {/* 2 The world */}
          <section
            ref={(el) => {
              copyRefs.current[1] = el;
            }}
            className="copy copy-center copy-world"
            style={{ left: "50%", top: "5%", width: "66%" }}
          >
            <p className="eyebrow">{sections.world.eyebrow}</p>
            <h2 className="display section-title">
              {sections.world.title.join(" ")} <span className="text-accent">{sections.world.accent}</span>
            </h2>
            <p className="sr-only">{sections.world.body}</p>
            <ul className="stat-row">
              {viralStats.map((s) => (
                <li key={s.label}>
                  <span className="display stat-value">
                    {s.value}
                    <span className="text-accent">{s.suffix}</span>
                  </span>
                  <span className="stat-label">{s.label}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* 3 Proof: enters from the right, parks on the right half */}
          <section
            ref={(el) => {
              copyRefs.current[2] = el;
            }}
            className="copy copy-right copy-proof"
            style={{ left: "58%", top: "14%", width: "36%" }}
          >
            <p className="eyebrow">{sections.proof.eyebrow}</p>
            <h2 className="display section-title">
              {sections.proof.title.join(" ")} <span className="text-accent">{sections.proof.accent}</span>
            </h2>
            <p className="display section-sub">{sections.proof.after}</p>
            <p className="section-body">{sections.proof.body}</p>
            <ul className="stat-list">
              {sections.proof.stats.map((s) => (
                <li key={s.label}>
                  <span className="display stat-value">{s.value}</span>
                  <span className="stat-label">{s.label}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* 4 Problem: enters from the left, upper-left third */}
          <section
            ref={(el) => {
              copyRefs.current[3] = el;
            }}
            className="copy copy-left copy-problem"
            style={{ left: "5%", top: "8%", width: "36%" }}
          >
            <p className="eyebrow">{sections.problem.eyebrow}</p>
            <h2 className="display section-title">
              {sections.problem.title.join(" ")} <span className="text-accent">{sections.problem.accent}</span>
            </h2>
            <p className="section-body">{sections.problem.body}</p>
            <ul className="path-list">
              {sections.problem.paths.map((p) => (
                <li key={p.label}>
                  <span className={`path-swatch ${p.tone === "accent" ? "bg-accent" : "bg-cream"}`} />
                  <span>
                    <strong>{p.label}.</strong> {p.note}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* 5 Vision: two columns wrapping the stage */}
          <section
            ref={(el) => {
              copyRefs.current[4] = el;
            }}
            className="copy copy-vision"
            style={{ left: "0%", top: "0%", width: "100%", height: "100%" }}
          >
            <div className="vision-head">
              <p className="eyebrow">{sections.vision.eyebrow}</p>
              <h2 className="display section-title">
                The IP <span className="text-accent">Factory</span>
              </h2>
            </div>
            <div className="vision-col vision-left">
              <p className="eyebrow">{sections.vision.left.heading}</p>
              <ul className="vision-inputs">
                {sections.vision.left.items.map((it) => (
                  <li key={it} className="display">
                    {it}
                  </li>
                ))}
              </ul>
              <p className="section-body">{sections.vision.left.note}</p>
            </div>
            <div className="vision-col vision-right">
              <p className="eyebrow">{sections.vision.right.heading}</p>
              <ul className="vision-outputs">
                {sections.vision.right.items.map((it) => (
                  <li key={it.title}>
                    <span className="display">{it.title}</span>
                    <span className="stat-label">{it.note}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* 6 Team: a circle above each of the six inner characters */}
          <section
            ref={(el) => {
              copyRefs.current[5] = el;
            }}
            className="copy copy-team"
            style={{ left: "0%", top: "0%", width: "100%", height: "100%" }}
          >
            <div className="team-head">
              <p className="eyebrow">{sections.team.eyebrow}</p>
              <h2 className="display section-title">
                {sections.team.title.join(" ")} <span className="text-accent">{sections.team.accent}</span>
              </h2>
            </div>
            <ul className="team-row">
              {teamCircles.map((p, i) => (
                <li key={p.name} className="team-person" style={{ left: `${TEAM_POS[i].x}%`, top: `${TEAM_POS[i].bottom}%` }}>
                  {p.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.photo} alt="" className="team-photo" />
                  ) : (
                    <span className="team-photo team-photo-empty" aria-hidden />
                  )}
                  <span className="display team-name">{p.name}</span>
                  <span className="team-role">{p.role}</span>
                  <span className="team-line">{p.line}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* 7 Contact */}
          <section
            ref={(el) => {
              copyRefs.current[6] = el;
            }}
            className="copy copy-center copy-contact"
            style={{ left: "50%", top: "11%", width: "48%" }}
            id="contact"
          >
            <h2 className="display section-title contact-title">
              {sections.contact.title.join(" ")} <span className="text-accent">{sections.contact.accent}</span>
            </h2>
            <p className="section-body mx-auto max-w-[44ch]">{sections.contact.body}</p>
            <a className="cta" href={`mailto:${contactEmail}`}>
              {sections.contact.cta}
            </a>
            <p className="footer-line">
              <span className="text-accent">IP</span>STUDIOS. ALL RIGHTS RESERVED. {brand.year}
            </p>
          </section>
        </div>
      </div>

      {/* Chrome */}
      <header className="site-header" style={{ opacity: phase === "live" ? 1 : 0 }}>
        <button onClick={() => goTo(0)} aria-label="Back to top" className="text-cream">
          <Logo variant="inline" className="h-9 w-auto" />
        </button>
        <button onClick={() => goTo(6)} className="header-cta">
          Contact
        </button>
      </header>
      <nav className="progress" aria-label="Sections" style={{ opacity: phase === "live" ? 1 : 0 }}>
        {labels.map((l, i) => (
          <button key={l} onClick={() => goTo(i)} aria-label={l} aria-current={section === i} className="progress-dot">
            <span className="progress-label">{l}</span>
          </button>
        ))}
      </nav>
    </>
  );
}

/** Horizontal crop focus per section on portrait screens (percent of the frame width). */
const PORTRAIT_FOCUS = [68, 50, 45, 62, 45, 50, 70];

/**
 * Where each team circle hangs, measured on the chained Seedance Team rest frame: x is the
 * character's centre and `bottom` sits just above its head (percent of the frame).
 * Left to right: watermelon zebra, banana gorilla, Tralalero, Cappuccina, Tung,
 * coffee-cup ninja, Tim Cheese, Brr Brr Patapim. Order matches teamCircles.
 */
const TEAM_POS = [
  { x: 8, bottom: 32.5 },
  { x: 23.4, bottom: 41.5 },
  { x: 36.7, bottom: 52.5 },
  { x: 46.6, bottom: 43 },
  { x: 55.3, bottom: 37.8 },
  { x: 66, bottom: 47 },
  { x: 76.6, bottom: 45.5 },
  { x: 87.5, bottom: 31 },
];
