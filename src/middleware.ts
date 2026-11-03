import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, VIEWER_COOKIE, verify } from "@/lib/sign";

// Fast signature check at the edge; /main itself also checks the pass has not been revoked.
export async function middleware(req: NextRequest) {
  const viewer = await verify(req.cookies.get(VIEWER_COOKIE)?.value);
  const admin = await verify(req.cookies.get(ADMIN_COOKIE)?.value);
  if (viewer || admin?.r === "admin") return NextResponse.next();
  return NextResponse.redirect(new URL("/", req.url));
}

export const config = { matcher: ["/main/:path*"] };
