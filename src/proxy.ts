import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

const PUBLIC_ROUTES = ["/login"];
const ADMIN_OWNER_ROUTES = ["/configuracion", "/reportes", "/mensualidades"];
const ADMIN_ONLY_ROUTES: string[] = [];

export default auth((req: NextRequest & { auth: { user?: { role?: string } } | null }) => {
  const { pathname } = req.nextUrl;
  const isPublic = PUBLIC_ROUTES.some((r) => pathname.startsWith(r));

  if (!req.auth && !isPublic) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (req.auth && isPublic) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  const role = (req.auth?.user as { role?: string })?.role;

  if (ADMIN_ONLY_ROUTES.some((r) => pathname.startsWith(r)) && role !== "admin") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (
    ADMIN_OWNER_ROUTES.some((r) => pathname.startsWith(r)) &&
    role !== "admin" &&
    role !== "owner"
  ) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
