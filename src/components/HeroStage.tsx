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
 * each clip's offset. The last frame of every rest clip is the first frame of the
 * next motion clip, so the hand-off between the two layers is a short cross-fade.
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
  const [active, setActive] = useState<{ kind: "rest" | "motion"; index: number }>({ kind: "motion", index: 0 });
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
    const end = manifest.motion[0].start + manifest.motion[0].duration;
    const finish = () => {
      if (phaseRef.current === "live") return;
      phaseRef.current = "live";
      v.pause();
      document.documentElement.style.overflow = "";
      setPhase("live");
    };
    window.scrollTo(0, 0);
    if (reduce) {
      v.currentTime = Math.max(0, end - 0.05);
      finish();
      return;
    }
    document.documentElement.style.overflow = "hidden";
    const onTime = () => {
      if (v.currentTime >= end - 0.06) finish();
    };
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("ended", finish);
    v.play().catch(finish);
    // Never trap the visitor if the video stalls.
    const guard = window.setTimeout(finish, (manifest.motion[0].duration + 6) * 1000);
    return () => {
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("ended", finish);
      window.clearTimeout(guard);
      document.documentElement.style.overflow = "";
    };
  }, []);

  // Scroll loop: map scroll to a segment, scrub the motion clip, swap layers, fade copy.
  useEffect(() => {
    if (phase !== "live") return;
    const v = motionRef.current!;
    let raf = 0;
    let current = manifest.motion[0].start + manifest.motion[0].duration - 0.02;
    let lastKey = "";
    let lastSection = -1;

    const tick = () => {
      const vh = window.innerHeight / 100;
      const y = window.scrollY / vh;
      const seg = TRACK.segs.find((s) => y >= s.start && y < s.start + s.length) ?? TRACK.segs[TRACK.segs.length - 1];

      if (seg.kind === "motion") {
        const m = manifest.motion[seg.index];
        const p = Math.min(1, Math.max(0, (y - seg.start) / seg.length));
        const target = m.start + p * (m.duration - 0.04);
        current += (target - current) * 0.18;
        if (Math.abs(target - current) < 0.002) current = target;
        if (!v.seeking && Math.abs(v.currentTime - current) > 0.012) v.currentTime = current;
      }

      const key = `${seg.kind}${seg.index}`;
      if (key !== lastKey) {
        lastKey = key;
        setActive({ kind: seg.kind, index: seg.index });
        restRefs.current.forEach((r, i) => {
          if (!r) return;
          if (seg.kind === "rest" && i === seg.index) {
            r.currentTime = 0;
            r.play().catch(() => {});
          } else if (!r.paused) r.pause();
        });
        if (seg.kind === "rest") {
          // Park the motion layer on the clip boundary so leaving the rest is seamless.
          const m = manifest.motion[seg.index];
          current = m.start + m.duration - 0.02;
          v.currentTime = current;
        }
      }

      const sec = seg.kind === "rest" ? seg.index : Math.max(0, seg.index - 1);
      if (sec !== lastSection) {
        lastSection = sec;
        setSection(sec);
      }

      copyRefs.current.forEach((el, i) => {
        if (!el) return;
        const o = copyOpacity(i, y);
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

  const showRest = phase === "live" && active.kind === "rest";
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
          style={{ opacity: showRest ? 0 : 1 }}
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
            style={{ opacity: showRest && active.index === i ? 1 : 0 }}
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
            style={{ left: "50%", top: "6%", width: "60%" }}
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
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.photo} alt="" className="team-photo" />
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
 * Where each team circle hangs, measured on the Seedance Team rest frame: x is the
 * character's centre and `bottom` sits just above its head (percent of the frame).
 * Left to right: banana gorilla, Tung, Cappuccina, coffee-cup ninja, Tralalero, Tim Cheese.
 */
const TEAM_POS = [
  { x: 23.5, bottom: 30 },
  { x: 35.8, bottom: 25.5 },
  { x: 44.6, bottom: 38 },
  { x: 53.6, bottom: 41 },
  { x: 64.2, bottom: 50 },
  { x: 73.2, bottom: 28 },
];
