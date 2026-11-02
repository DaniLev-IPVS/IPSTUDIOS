import "server-only";
import { promises as fs } from "fs";
import path from "path";

// Key-value store for passes. Production uses Upstash Redis over REST (provisioned through the
// Vercel Marketplace, which sets KV_REST_API_URL / KV_REST_API_TOKEN). Local dev without those
// falls back to a JSON file in .data/ so the gate can be tried offline.

type Cmd = (string | number)[];

const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

async function redis<T>(cmd: Cmd): Promise<T> {
  const res = await fetch(url!, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(cmd),
    cache: "no-store",
  });
  const json = (await res.json()) as { result?: T; error?: string };
  if (!res.ok || json.error) throw new Error(`Redis ${cmd[0]} failed: ${json.error ?? res.status}`);
  return json.result as T;
}

// --- dev file fallback -------------------------------------------------------------------------

const FILE = path.join(process.cwd(), ".data", "kv.json");
type Dev = { s: Record<string, string>; sets: Record<string, string[]>; exp: Record<string, number> };

async function load(): Promise<Dev> {
  try {
    return JSON.parse(await fs.readFile(FILE, "utf8")) as Dev;
  } catch {
    return { s: {}, sets: {}, exp: {} };
  }
}
async function save(d: Dev) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(d, null, 2));
}

async function dev<T>(cmd: Cmd): Promise<T> {
  const d = await load();
  const [op, k, ...a] = cmd.map(String);
  if (d.exp[k] && d.exp[k] < Date.now()) {
    delete d.s[k];
    delete d.exp[k];
  }
  let out: unknown = null;
  switch (op) {
    case "GET": out = d.s[k] ?? null; break;
    case "SET": d.s[k] = a[0]; out = "OK"; break;
    case "DEL": out = Number(k in d.s || k in d.sets); delete d.s[k]; delete d.sets[k]; break;
    case "INCR": d.s[k] = String(Number(d.s[k] ?? 0) + 1); out = Number(d.s[k]); break;
    case "EXPIRE": d.exp[k] = Date.now() + Number(a[0]) * 1000; out = 1; break;
    case "SADD": d.sets[k] = Array.from(new Set([...(d.sets[k] ?? []), ...a])); out = 1; break;
    case "SREM": d.sets[k] = (d.sets[k] ?? []).filter((m) => !a.includes(m)); out = 1; break;
    case "SMEMBERS": out = d.sets[k] ?? []; break;
    default: throw new Error(`dev store: ${op} not supported`);
  }
  await save(d);
  return out as T;
}

export function storeReady(): boolean {
  return Boolean(url && token) || process.env.NODE_ENV !== "production";
}

export function kv<T = unknown>(cmd: Cmd): Promise<T> {
  if (url && token) return redis<T>(cmd);
  if (process.env.NODE_ENV !== "production") return dev<T>(cmd);
  throw new Error("No store configured: connect Upstash Redis to this Vercel project");
}
