import "server-only";
import { promises as fs } from "fs";
import path from "path";
import { neon } from "@neondatabase/serverless";

// Key-value store for passes. Production uses Neon Postgres (DATABASE_URL) through two small
// tables that mimic the handful of Redis commands the gate needs. Local dev without DATABASE_URL
// falls back to a JSON file in .data/ so the gate can be tried offline.

type Cmd = (string | number)[];

const dbUrl = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;

let ready: Promise<unknown> | null = null;
function db() {
  const sql = neon(dbUrl!);
  ready ??= sql
    .transaction([
      sql`CREATE TABLE IF NOT EXISTS ips_kv (k text PRIMARY KEY, v text NOT NULL, exp timestamptz)`,
      sql`CREATE TABLE IF NOT EXISTS ips_set (k text NOT NULL, m text NOT NULL, PRIMARY KEY (k, m))`,
    ])
    .catch((e) => {
      ready = null;
      throw e;
    });
  return { sql, ready };
}

async function pg<T>(cmd: Cmd): Promise<T> {
  const { sql, ready } = db();
  await ready;
  const [op, k, ...a] = cmd.map(String);
  switch (op) {
    case "GET": {
      const rows = await sql`SELECT v FROM ips_kv WHERE k = ${k} AND (exp IS NULL OR exp > now())`;
      return (rows[0]?.v ?? null) as T;
    }
    case "SET":
      await sql`INSERT INTO ips_kv (k, v) VALUES (${k}, ${a[0]})
        ON CONFLICT (k) DO UPDATE SET v = EXCLUDED.v, exp = NULL`;
      return "OK" as T;
    case "DEL": {
      const [x, y] = await sql.transaction([
        sql`DELETE FROM ips_kv WHERE k = ${k} RETURNING k`,
        sql`DELETE FROM ips_set WHERE k = ${k} RETURNING k`,
      ]);
      return Number(x.length + y.length > 0) as T;
    }
    case "INCR": {
      const rows = await sql`INSERT INTO ips_kv (k, v) VALUES (${k}, '1')
        ON CONFLICT (k) DO UPDATE SET
          v = CASE WHEN ips_kv.exp IS NOT NULL AND ips_kv.exp <= now() THEN '1' ELSE (ips_kv.v::bigint + 1)::text END,
          exp = CASE WHEN ips_kv.exp IS NOT NULL AND ips_kv.exp <= now() THEN NULL ELSE ips_kv.exp END
        RETURNING v`;
      return Number(rows[0].v) as T;
    }
    case "EXPIRE":
      await sql`UPDATE ips_kv SET exp = now() + make_interval(secs => ${Number(a[0])}) WHERE k = ${k}`;
      return 1 as T;
    case "SADD":
      for (const m of a) await sql`INSERT INTO ips_set (k, m) VALUES (${k}, ${m}) ON CONFLICT DO NOTHING`;
      return 1 as T;
    case "SREM":
      await sql`DELETE FROM ips_set WHERE k = ${k} AND m = ANY(${a})`;
      return 1 as T;
    case "SMEMBERS": {
      const rows = await sql`SELECT m FROM ips_set WHERE k = ${k}`;
      return rows.map((r) => r.m as string) as T;
    }
    default:
      throw new Error(`store: ${op} not supported`);
  }
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
  return Boolean(dbUrl) || process.env.NODE_ENV !== "production";
}

export function kv<T = unknown>(cmd: Cmd): Promise<T> {
  if (dbUrl) return pg<T>(cmd);
  if (process.env.NODE_ENV !== "production") return dev<T>(cmd);
  throw new Error("No store configured: set DATABASE_URL (Neon) on this Vercel project");
}
