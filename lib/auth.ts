import "server-only";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseAuth } from "./supabase-auth";

const LOCAL_AUTH_COOKIE = "co_script_local_auth";
const LOCAL_AUTH_EMAIL = "bailey@contentco-op.com";
const LOCAL_AUTH_PASSWORD = "BaylorFilm2011";
const LOCAL_AUTH_USER_ID = "local-bailey";

export type AppAuthUser = {
  id: string;
  email: string | null;
};

export function getLocalAuthEmail() {
  return LOCAL_AUTH_EMAIL;
}

export function isValidLocalCredential(email: string, password: string) {
  return email.trim().toLowerCase() === LOCAL_AUTH_EMAIL && password === LOCAL_AUTH_PASSWORD;
}

export async function createLocalAuthSession() {
  const cookieStore = await cookies();
  cookieStore.set(LOCAL_AUTH_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
}

export async function clearLocalAuthSession() {
  const cookieStore = await cookies();
  cookieStore.set(LOCAL_AUTH_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function getLocalAuthUser(): Promise<AppAuthUser | null> {
  const cookieStore = await cookies();
  const hasLocalSession = cookieStore.get(LOCAL_AUTH_COOKIE)?.value === "1";

  if (!hasLocalSession) {
    return null;
  }

  return {
    id: LOCAL_AUTH_USER_ID,
    email: LOCAL_AUTH_EMAIL,
  };
}

export async function requireAuth() {
  const localUser = await getLocalAuthUser();
  if (localUser) return localUser;

  const supabase = await createSupabaseAuth();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return {
    id: user.id,
    email: user.email ?? null,
  };
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
