// Signed tokens for the gate and admin cookies. Web Crypto only, so this runs in middleware too.

export type Claims = { r: "viewer"; p: string; exp: number } | { r: "admin"; exp: number };

const enc = new TextEncoder();

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 32) return s;
  if (process.env.NODE_ENV !== "production") return "dev-only-secret-dev-only-secret-dev-only";
  throw new Error("SESSION_SECRET must be set (32+ characters)");
}

let keyPromise: Promise<CryptoKey> | null = null;
function key() {
  keyPromise ??= crypto.subtle.importKey("raw", enc.encode(secret()), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify",
  ]);
  return keyPromise;
}

function b64url(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function unb64url(s: string): Uint8Array {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

export async function hmacHex(data: string): Promise<string> {
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", await key(), enc.encode(data)));
  return Array.from(sig, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function sign(claims: Claims): Promise<string> {
  const body = b64url(enc.encode(JSON.stringify(claims)));
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", await key(), enc.encode(body)));
  return `${body}.${b64url(sig)}`;
}

export async function verify(token: string | undefined): Promise<Claims | null> {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  try {
    const ok = await crypto.subtle.verify("HMAC", await key(), unb64url(sig) as BufferSource, enc.encode(body));
    if (!ok) return null;
    const claims = JSON.parse(new TextDecoder().decode(unb64url(body))) as Claims;
    return claims.exp > Date.now() ? claims : null;
  } catch {
    return null;
  }
}

export const VIEWER_COOKIE = "ips_pass";
export const ADMIN_COOKIE = "ips_admin";
