import { NextResponse } from "next/server";
import { createSupabaseAuth } from "@/lib/supabase-auth";
import { diffLines } from "diff";

export async function POST(req: Request) {
  const supabase = await createSupabaseAuth();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { version_a, version_b } = await req.json();
  if (!version_a || !version_b) return NextResponse.json({ error: "Two version IDs required" }, { status: 400 });

  // Fetch both versions with ownership check via script
  const { data: versions, error } = await supabase
    .from("script_versions")
    .select("id, version_number, content, score, created_at, script_id")
    .in("id", [version_a, version_b]);

  if (error || !versions || versions.length !== 2) {
    return NextResponse.json({ error: "Versions not found" }, { status: 404 });
  }

  // Verify both versions belong to the same script
  if (versions[0].script_id !== versions[1].script_id) {
    return NextResponse.json({ error: "Versions must belong to the same script" }, { status: 400 });
  }

  // Verify ownership
  const scriptId = versions[0].script_id;
  const { data: script } = await supabase
    .from("scripts")
    .select("id")
    .eq("id", scriptId)
    .eq("user_id", user.id)
    .single();

  if (!script) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const a = versions.find((v) => v.id === version_a)!;
  const b = versions.find((v) => v.id === version_b)!;

  const changes = diffLines(a.content, b.content);

  return NextResponse.json({
    version_a: { id: a.id, version_number: a.version_number, content: a.content, score: a.score, created_at: a.created_at },
    version_b: { id: b.id, version_number: b.version_number, content: b.content, score: b.score, created_at: b.created_at },
    diff: changes.map((c) => ({
      value: c.value,
      added: c.added || false,
      removed: c.removed || false,
    })),
  });
}
