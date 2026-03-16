import { NextResponse } from "next/server";
import { createSupabaseAuth } from "@/lib/supabase-auth";
import { buildLoginPath, normalizeNextPath } from "@/lib/navigation";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextPath = normalizeNextPath(searchParams.get("next"));

  if (code) {
    const supabase = await createSupabaseAuth();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(new URL(buildLoginPath(nextPath), origin));
    }
  }

  return NextResponse.redirect(new URL(nextPath, origin));
}
