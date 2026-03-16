import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabasePublicEnv } from "@/lib/env";
import { buildLoginPath } from "@/lib/navigation";

const LOCAL_AUTH_COOKIE = "co_script_local_auth";
const PUBLIC_ROUTES = [
  "/login",
  "/signup",
  "/auth/callback",
  "/api/auth",
  "/shared/",
];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const allowLocalEditorPreview = process.env.NODE_ENV !== "production" && pathname.startsWith("/editor");

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  if (allowLocalEditorPreview) {
    return NextResponse.next();
  }

  if (req.cookies.get(LOCAL_AUTH_COOKIE)?.value === "1") {
    return NextResponse.next();
  }

  const res = NextResponse.next();
  const { url, anonKey } = getSupabasePublicEnv();

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          res.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const nextPath = `${pathname}${req.nextUrl.search}`;
    return NextResponse.redirect(new URL(buildLoginPath(nextPath), req.url));
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
