"use client";

import { useEffect, useRef, useState } from "react";
import Logo from "@/components/Logo";
import manifest from "@/hero/manifest.json";
import { brand, contactEmail, sections, teamCircles, viralStats } from "@/content";

/*
 * The whole site is one scene. A fixed 16:9 video fills the viewport (object-fit: cover)
 * and the copy sits in front of it.
 *
 *   M1 (cover)  autoplays once on load with scrolling locked.
 *   R1..R7      rest loops: the camera is parked, the characters idle, the copy is up.
 *   M2..M7      motion clips, scrubbed by scroll between two rests.
 *
 * All motion clips live in one file (motion.mp4) back to back; manifest.json holds
 * each clip's offset in frames. The Seedance pairs are chained: the first frame of every
 * pair is the exact last frame of the pair before, so the scene never jumps.
 */

type Seg = { kind: "rest" | "motion"; index: number; start: number; length: number };

const REST_VH = 120; // scroll length of a rest, in viewport heights
const VH_PER_SECOND = 13; // scroll length per second of motion
const LAST_REST_VH = 100;

function buildTrack(): { segs: Seg[]; total: number } {
  const segs: Seg[] = [];
  let y = 0;
  for (let i = 0; i < manifest.rest.length; i++) {
    const length = i === manifest.rest.length - 1 ? LAST_REST_VH : REST_VH;
    segs.push({ kind: "rest", index: i, start: y, length });
    y += length;
    const m = manifest.motion[i + 1];
    if (m) {
      const len = Math.max(90, m.duration * VH_PER_SECOND);
      segs.push({ kind: "motion", index: i + 1, start: y, length: len });
      y += len;
    }
  }
  return { segs, total: y };
}

const TRACK = buildTrack();
const smooth = (t: number) => {
  const c = Math.min(1, Math.max(0, t));
  return c * c * (3 - 2 * c);
};

const FPS = 24;
/** Time of the centre of frame `f`, so seeks land on that exact frame. */
const frameTime = (f: number) => (f + 0.5) / FPS;
const motionFirst = (j: number) => frameTime(manifest.motion[j].startFrame);
const motionLast = (j: number) => frameTime(manifest.motion[j].startFrame + manifest.motion[j].frames - 1);

/** Opacity of the copy for rest `i` at scroll position `y` (in vh). */
function copyOpacity(i: number, y: number) {
  const rest = TRACK.segs.find((s) => s.kind === "rest" && s.index === i)!;
  const next = TRACK.segs.find((s) => s.kind === "motion" && s.index === i + 1);
  if (y < rest.start) return i === 0 ? 1 : 0;
  const fadeIn = i === 0 ? 1 : smooth((y - rest.start) / (rest.length * 0.14));
  if (!next || y < next.start) return fadeIn;
  return 1 - smooth((y - next.start) / (next.length * 0.18));
}

type Phase = "intro" | "live";

export default function HeroStage() {
  const motionRef = useRef<HTMLVideoElement>(null);
  const restRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const copyRefs = useRef<(HTMLElement | null)[]>([]);
  const stageRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>("intro");
  const [section, setSection] = useState(0);
  const phaseRef = useRef<Phase>("intro");

  // Fit a 16:9 box to the same rectangle the cover-fitted video occupies, so copy
  // positioned in frame percentages lines up with the characters.
  useEffect(() => {
    const fit = () => {
      const el = stageRef.current;
      if (!el) return;
      const w = Math.max(window.innerWidth, (window.innerHeight * 16) / 9);
      const h = (w * 9) / 16;
      el.style.setProperty("--sw", `${w}px`);
      el.style.setProperty("--sh", `${h}px`);
      el.style.setProperty("--sx", `${(window.innerWidth - w) / 2}px`);
      el.style.setProperty("--sy", `${(window.innerHeight - h) / 2}px`);
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  // Intro: play M1 once with scrolling locked, then hand over to the R1 loop.
  useEffect(() => {
    const v = motionRef.current;
    if (!v) return;
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
  }, []);

  // Scroll loop. Two layers show the scene: the motion clip (scrubbed by scroll) and the
  // rest loop of the current section. They only ever swap on a frame both show
  // identically, so there is no fade and no jump:
  //   motion j -> rest j     motion settles on its last frame, rest starts at frame 0
  //   motion j -> rest j-1   motion settles on its first frame, rest starts at its peak
  //   rest k  -> motion k+1  rest scrubs to its peak (the pair's last frame), which is
  //                          the first frame of motion k+1
  //   rest k  -> motion k    rest scrubs back to frame 0, next to motion k's last frame
  useEffect(() => {
    if (phase !== "live") return;
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

    const tick = (now: number) => {
      const dt = Math.min(0.25, (now - last) / 1000);
      last = now;
      const vh = window.innerHeight / 100;
      const y = window.scrollY / vh;
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
            const step = Math.sign(diff) * Math.min(Math.abs(diff), Math.max(dt * 6, Math.abs(diff) * (1 - Math.exp(-dt * 14))));
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
        current += (target - current) * (1 - Math.exp(-dt * 12));
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

      // Copy follows the scroll, but only once the picture has reached its section.
      const onScreen = (i: number) =>
        (shown.kind === "rest" && shown.index === i) ||
        // leaving rest i (its copy fades out with the scroll)
        (shown.kind === "motion" && shown.index === i + 1) ||
        // arriving at rest i: only once the picture is nearly parked
        (shown.kind === "motion" && shown.index === i && current > motionLast(i) - 0.35);
      copyRefs.current.forEach((el, i) => {
        if (!el) return;
        const want = onScreen(i) ? copyOpacity(i, y) : 0;
        const prev = copyShown[i] ?? want;
        const o = prev + (want - prev) * (1 - Math.exp(-dt * 10));
        copyShown[i] = Math.abs(o - want) < 0.005 ? want : o;
        el.style.opacity = String(o);
        el.style.visibility = o < 0.01 ? "hidden" : "visible";
        el.style.setProperty("--enter", String(1 - o));
      });

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  // On portrait screens the 16:9 frame is cropped to its centre, so pan the crop
  // toward where the action is in each section.
  useEffect(() => {
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
  }, [section]);

  const goTo = (i: number) => {
    const rest = TRACK.segs.find((s) => s.kind === "rest" && s.index === i)!;
    const vh = window.innerHeight / 100;
    window.scrollTo({ top: (rest.start + rest.length * 0.3) * vh, behavior: "smooth" });
  };

  const labels = ["Cover", "The world", "Proof", "The problem", "The vision", "Team", "Contact"];

  return (
    <>
      {/* Scroll track */}
      <div aria-hidden style={{ height: `${TRACK.total + 100}vh` }} />

      <div ref={stageRef} className="stage fixed inset-0 overflow-hidden bg-ink">
        <video
          ref={motionRef}
          className="stage-video"
          src={manifest.motionSrc}
          poster={manifest.poster}
          muted
          playsInline
          preload="auto"
          style={{ opacity: 1 }}
        />
        {manifest.rest.map((r, i) => (
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
            className="copy copy-right"
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
            className="copy copy-left"
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
            className="copy copy-center"
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
