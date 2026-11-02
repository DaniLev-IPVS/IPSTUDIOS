"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { enter } from "@/app/actions";

// "Enter →" pill that opens into a see-through password bar: dots, an eye to reveal, and the
// Enter arrow slid over to the right end. A visitor who already holds a pass goes straight in.

export default function Gate({ linkToken, hasAccess }: { linkToken?: string; hasAccess: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [show, setShow] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const [pending, start] = useTransition();
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) input.current?.focus({ preventScroll: true });
  }, [open]);

  useEffect(() => {
    router.prefetch("/main");
    return () => document.documentElement.classList.remove("gate-leaving");
  }, [router]);

  const go = () => {
    setLeaving(true);
    document.documentElement.classList.add("gate-leaving");
    setTimeout(() => router.push("/main"), 650);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!open) {
      if (hasAccess) return go();
      setOpen(true);
      return;
    }
    if (!value.trim()) {
      setShake((n) => n + 1);
      return;
    }
    start(async () => {
      const r = await enter(value, linkToken);
      if (r.ok) go();
      else {
        setError(r.error);
        setShake((n) => n + 1);
        input.current?.select();
      }
    });
  };

  return (
    <form
      onSubmit={submit}
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) {
          setOpen(false);
          setError("");
        }
      }}
      className="gate-wrap"
    >
      <div
        key={shake}
        className={`gate ${open ? "is-open" : ""} ${shake ? "is-shake" : ""} ${leaving ? "is-leaving" : ""}`}
      >
        <label className="sr-only" htmlFor="gate-pw">Password</label>
        <input
          id="gate-pw"
          ref={input}
          className="gate-input"
          type={show ? "text" : "password"}
          autoComplete="current-password"
          placeholder="Password"
          value={value}
          tabIndex={open ? 0 : -1}
          aria-hidden={!open}
          onChange={(e) => {
            setValue(e.target.value);
            setError("");
          }}
        />
        <button
          type="button"
          className="gate-eye"
          tabIndex={open ? 0 : -1}
          aria-hidden={!open}
          aria-label={show ? "Hide password" : "Show password"}
          aria-pressed={show}
          onClick={() => setShow((s) => !s)}
        >
          {show ? <EyeOff /> : <Eye />}
        </button>
        <button type="submit" className="gate-go" aria-label="Enter" disabled={pending}>
          <span className="gate-go-label">Enter</span>
          {pending ? <span className="gate-spin" /> : <Arrow />}
        </button>
      </div>
      <p className="gate-error" role="status" aria-live="polite">{error}</p>
    </form>
  );
}

const Arrow = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
    <path d="M3 8h9.5M8.5 3.5 13 8l-4.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const Eye = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);
const EyeOff = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M3 3l18 18M10.6 5.1A10.6 10.6 0 0 1 12 5c6.4 0 10 7 10 7a17.6 17.6 0 0 1-3.2 4.1M6.6 6.6C3.7 8.4 2 12 2 12s3.6 7 10 7c1.9 0 3.5-.6 4.9-1.4M9.9 9.9a3 3 0 0 0 4.2 4.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);
