"use server";

import { cookies, headers } from "next/headers";
import { checkPassword, limited } from "@/lib/passes";
import { sign, VIEWER_COOKIE } from "@/lib/sign";

const DAYS = 30;

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
  const exp = Date.now() + DAYS * 864e5;
  (await cookies()).set(VIEWER_COOKIE, await sign({ r: "viewer", p: pass.id, exp }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DAYS * 86400,
  });
  return { ok: true };
}
