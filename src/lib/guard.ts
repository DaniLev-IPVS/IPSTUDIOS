import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, VIEWER_COOKIE, verify } from "./sign";
import { getPass } from "./passes";

export async function isAdmin(): Promise<boolean> {
  const c = await verify((await cookies()).get(ADMIN_COOKIE)?.value);
  return c?.r === "admin";
}

/** True when the visitor holds a live (not revoked) pass, or is the admin. */
export async function hasAccess(): Promise<boolean> {
  if (await isAdmin()) return true;
  const c = await verify((await cookies()).get(VIEWER_COOKIE)?.value);
  if (c?.r !== "viewer") return false;
  const p = await getPass(c.p);
  return Boolean(p && !p.revoked);
}

export async function requireViewer() {
  if (!(await hasAccess())) redirect("/");
}
