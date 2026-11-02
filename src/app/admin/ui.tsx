"use client";

import { useActionState, useState, useTransition } from "react";
import { adminLogin, createPassAction, removePass, toggleRevoke, type Created } from "./actions";

export function AdminLogin() {
  const [error, action, pending] = useActionState(adminLogin, null);
  return (
    <form action={action} className="admin-card admin-login">
      <h1 className="admin-h">Admin</h1>
      <input className="admin-input" type="password" name="password" placeholder="Admin password" autoComplete="current-password" autoFocus required />
      <button className="admin-btn" disabled={pending}>{pending ? "Checking…" : "Sign in"}</button>
      {error && <p className="admin-err">{error}</p>}
    </form>
  );
}

function Copy({ text, label = "Copy" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="admin-chip"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setDone(true);
        setTimeout(() => setDone(false), 1400);
      }}
    >
      {done ? "Copied" : label}
    </button>
  );
}

export function CreatePass({ origin }: { origin: string }) {
  const [state, action, pending] = useActionState<Created, FormData>(createPassAction, null);
  const made = state && "password" in state ? state : null;
  const link = made ? `${origin}/?k=${made.token}` : "";
  const invite = made ? `You're invited to IP Studios.\n\n${link}\nPassword: ${made.password}` : "";

  return (
    <>
      <form action={action} className="admin-form">
        <input className="admin-input" name="label" placeholder="Who it's for (e.g. Jane Doe, Acme Capital)" required maxLength={80} />
        <input className="admin-input" name="password" placeholder="Password (leave blank to generate one)" autoComplete="off" />
        <button className="admin-btn" disabled={pending}>{pending ? "Making…" : "Create link"}</button>
      </form>
      {state && "error" in state && <p className="admin-err">{state.error}</p>}
      {made && (
        <div className="admin-made">
          <p className="admin-made-h">Link for {made.label}</p>
          <div className="admin-kv"><span>Link</span><code>{link}</code><Copy text={link} /></div>
          <div className="admin-kv"><span>Password</span><code>{made.password}</code><Copy text={made.password} /></div>
          <div className="admin-made-foot">
            <Copy text={invite} label="Copy invite message" />
            <span className="admin-note">The password is shown only now; it is stored hashed.</span>
          </div>
        </div>
      )}
    </>
  );
}

const when = (t: number | null) =>
  t ? new Date(t).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "never";

export function PassRow(p: {
  id: string; label: string; link: string; createdAt: number; lastUsedAt: number | null; uses: number; revoked: boolean;
}) {
  const [pending, start] = useTransition();
  return (
    <li className={`admin-row ${p.revoked ? "is-off" : ""}`}>
      <div className="admin-row-main">
        <p className="admin-row-h">{p.label} {p.revoked && <span className="admin-tag">Revoked</span>}</p>
        <p className="admin-row-meta">Made {when(p.createdAt)} · {p.uses} {p.uses === 1 ? "entry" : "entries"} · last {when(p.lastUsedAt)}</p>
      </div>
      <div className="admin-row-act">
        <Copy text={p.link} label="Copy link" />
        <button className="admin-chip" disabled={pending} onClick={() => start(() => toggleRevoke(p.id, !p.revoked))}>
          {p.revoked ? "Restore" : "Revoke"}
        </button>
        <button
          className="admin-chip admin-chip-danger"
          disabled={pending}
          onClick={() => confirm(`Delete the link for ${p.label}? This can't be undone.`) && start(() => removePass(p.id))}
        >
          Delete
        </button>
      </div>
    </li>
  );
}
