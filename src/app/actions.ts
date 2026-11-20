"use server";

import { cookies, headers } from "next/headers";
import { checkPassword, limited } from "@/lib/passes";
import { sign, VIEWER_COOKIE, VIEWER_SESSION_MS } from "@/lib/sign";

async function ip() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

export type EnterResult = { ok: true } | { ok: false; error: string };

export async function enter(password: string, linkToken?: string): Promise<EnterResult> {
  if (!password.trim()) return { ok: false, error: "Enter your password" };
  if (await limited(`enter:${await ip()}`, 12, 600)) return { ok: false, error: "Too many tries. Wait a few minutes." };
  const pass = await checkPassword(password, linkToken || undefined);
  if (!pass) return { ok: false, error: "That password doesn't open this door" };
  // The password opens the site for 30 minutes from now. Within that window a refresh, the back button,
  // a new tab or reopening the browser goes straight in; after it, the password is asked again.
  const exp = Date.now() + VIEWER_SESSION_MS;
  (await cookies()).set(VIEWER_COOKIE, await sign({ r: "viewer", p: pass.id, exp }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: VIEWER_SESSION_MS / 1000,
  });
  return { ok: true };
}
