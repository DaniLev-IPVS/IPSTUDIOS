"use server";

import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createPass, deletePass, generatePassword, limited, setRevoked } from "@/lib/passes";
import { ADMIN_COOKIE, hmacHex, sign } from "@/lib/sign";
import { isAdmin } from "@/lib/guard";

const DAYS = 14;

async function assertAdmin() {
  if (!(await isAdmin())) throw new Error("Not signed in");
}

export async function adminLogin(_: string | null, form: FormData): Promise<string | null> {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return "ADMIN_PASSWORD is not set for this deployment";
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (await limited(`admin:${ip}`, 8, 900)) return "Too many tries. Wait 15 minutes.";
  const given = String(form.get("password") ?? "");
  // Compare keyed hashes so the check does not leak timing on the raw strings.
  if ((await hmacHex(`admin:${given}`)) !== (await hmacHex(`admin:${expected}`))) return "Wrong password";
  (await cookies()).set(ADMIN_COOKIE, await sign({ r: "admin", exp: Date.now() + DAYS * 864e5 }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: DAYS * 86400,
  });
  revalidatePath("/admin");
  return null;
}

export async function adminLogout() {
  (await cookies()).delete(ADMIN_COOKIE);
  revalidatePath("/admin");
}

export type Created = { label: string; password: string; token: string } | { error: string } | null;

export async function createPassAction(_: Created, form: FormData): Promise<Created> {
  await assertAdmin();
  const label = String(form.get("label") ?? "").trim();
  const chosen = String(form.get("password") ?? "").trim();
  if (!label) return { error: "Add who this link is for" };
  if (chosen && chosen.length < 5) return { error: "Passwords need 5 or more characters" };
  const password = chosen || generatePassword();
  try {
    const p = await createPass(label.slice(0, 80), password);
    revalidatePath("/admin");
    return { label: p.label, password, token: p.token };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function toggleRevoke(id: string, revoked: boolean) {
  await assertAdmin();
  await setRevoked(id, revoked);
  revalidatePath("/admin");
}

export async function removePass(id: string) {
  await assertAdmin();
  await deletePass(id);
  revalidatePath("/admin");
}
