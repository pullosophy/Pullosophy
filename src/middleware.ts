import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, adminToken } from "@/lib/admin-auth";

export async function middleware(req: NextRequest) {
  if (req.nextUrl.pathname === "/admin/login") return NextResponse.next();
  const token = await adminToken();
  if (token && req.cookies.get(ADMIN_COOKIE)?.value === token) return NextResponse.next();
  return NextResponse.redirect(new URL("/admin/login", req.url));
}

export const config = { matcher: ["/admin", "/admin/:path*"] };
