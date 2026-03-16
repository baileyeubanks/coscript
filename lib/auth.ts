import "server-only";

import { NextResponse } from "next/server";
import { createSupabaseAuth } from "./supabase-auth";

export type AppAuthUser = {
  id: string;
  email: string | null;
};

export async function requireAuth(): Promise<AppAuthUser | null> {
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
