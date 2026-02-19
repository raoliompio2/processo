import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "session_token";

function isPublic(pathname: string): boolean {
  if (pathname === "/" || pathname === "/sign-in" || pathname === "/sign-up") return true;
  if (pathname.startsWith("/api/auth/")) return true;
  if (pathname.startsWith("/view/")) return true;
  if (pathname.startsWith("/api/cases/public/") || pathname.startsWith("/api/public/")) return true;
  return false;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (isPublic(pathname)) {
    return NextResponse.next();
  }
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    const isApi = pathname.startsWith("/api/");
    if (isApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const signIn = new URL("/sign-in", req.url);
    signIn.searchParams.set("redirect", pathname);
    return NextResponse.redirect(signIn);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ico|woff2?|ttf|eot)).*)",
    "/(api|trpc)(.*)",
  ],
};
