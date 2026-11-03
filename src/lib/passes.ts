import "server-only";
import { kv } from "./store";
import { hmacHex } from "./sign";

// A pass is one invite: a private link plus a password, made by the admin for one person.
// Passwords are stored only as a keyed hash (HMAC-SHA256 with SESSION_SECRET), which also lets a
// visitor who types their password on the home page without the link be matched to their pass.

export type Pass = {
  id: string;
  label: string;
  token: string;
  pwHash: string;
  createdAt: number;
  lastUsedAt: number | null;
  uses: number;
  revoked: boolean;
};

const ALPHA = "abcdefghjkmnpqrstuvwxyz23456789";

function random(n: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(n));
  return Array.from(bytes, (b) => ALPHA[b % ALPHA.length]).join("");
}

export function generatePassword(): string {
  return `${random(4)}-${random(4)}-${random(4)}`;
}

const pwKey = async (password: string) => `pw:${await hmacHex(`pw:${password.trim()}`)}`;

export async function getPass(id: string): Promise<Pass | null> {
  const raw = await kv<string | null>(["GET", `pass:${id}`]);
  return raw ? (JSON.parse(raw) as Pass) : null;
}

async function putPass(p: Pass) {
  await kv(["SET", `pass:${p.id}`, JSON.stringify(p)]);
}

export async function listPasses(): Promise<Pass[]> {
  const ids = await kv<string[]>(["SMEMBERS", "passes"]);
  const all = await Promise.all(ids.map(getPass));
  return all.filter((p): p is Pass => p !== null).sort((a, b) => b.createdAt - a.createdAt);
}

export async function createPass(label: string, password: string): Promise<Pass> {
  const key = await pwKey(password);
  if (await kv<string | null>(["GET", key])) throw new Error("That password is already used by another pass");
  const pass: Pass = {
    id: random(10),
    label,
    token: random(16),
    pwHash: key.slice(3),
    createdAt: Date.now(),
    lastUsedAt: null,
    uses: 0,
    revoked: false,
  };
  await putPass(pass);
  await kv(["SET", key, pass.id]);
  await kv(["SET", `tok:${pass.token}`, pass.id]);
  await kv(["SADD", "passes", pass.id]);
  return pass;
}

export async function setRevoked(id: string, revoked: boolean) {
  const p = await getPass(id);
  if (p) await putPass({ ...p, revoked });
}

export async function deletePass(id: string) {
  const p = await getPass(id);
  if (!p) return;
  await kv(["DEL", `pw:${p.pwHash}`]);
  await kv(["DEL", `tok:${p.token}`]);
  await kv(["DEL", `pass:${id}`]);
  await kv(["SREM", "passes", id]);
}

/** The pass this password opens, if any. With a link token, the password must belong to that link. */
export async function checkPassword(password: string, linkToken?: string): Promise<Pass | null> {
  const id = await kv<string | null>(["GET", await pwKey(password)]);
  if (!id) return null;
  if (linkToken) {
    const linked = await kv<string | null>(["GET", `tok:${linkToken}`]);
    if (linked !== id) return null;
  }
  const p = await getPass(id);
  if (!p || p.revoked) return null;
  await putPass({ ...p, uses: p.uses + 1, lastUsedAt: Date.now() });
  return p;
}

/** Counts attempts per key in a fixed window; true once the limit is passed. */
export async function limited(key: string, max: number, windowSec: number): Promise<boolean> {
  const n = await kv<number>(["INCR", `rl:${key}`]);
  if (n === 1) await kv(["EXPIRE", `rl:${key}`, windowSec]);
  return n > max;
}
