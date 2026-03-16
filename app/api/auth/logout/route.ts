import { NextResponse } from "next/server";
import { clearLocalAuthSession } from "@/lib/auth";
import { createSupabaseAuth } from "@/lib/supabase-auth";

export async function POST() {
  await clearLocalAuthSession();
  const supabase = await createSupabaseAuth();
  await supabase.auth.signOut();
  return NextResponse.json({ success: true });
}
