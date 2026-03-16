import { NextResponse } from "next/server";
import { requireAuth, unauthorizedResponse } from "@/lib/auth";
import { getBuiltInFrameworks } from "@/lib/co-script-method";
import { createSupabaseAuth } from "@/lib/supabase-auth";

export async function GET() {
  const user = await requireAuth();
  if (!user) return unauthorizedResponse();

  const supabase = await createSupabaseAuth();

  const { data: frameworks, error } = await supabase
    .from("frameworks")
    .select("*")
    .or(`is_system.eq.true,user_id.eq.${user.id}`)
    .order("category", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const builtIns = getBuiltInFrameworks();
  const merged = [...builtIns, ...(frameworks ?? [])];

  return NextResponse.json({ frameworks: merged });
}
