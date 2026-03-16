import { NextResponse } from "next/server";
import { createSupabaseAuth } from "@/lib/supabase-auth";
import type { SignupResponse } from "@/lib/contracts";

export async function POST(req: Request) {
  let body: Record<string, string>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { email, password, display_name } = body;
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }

  const supabase = await createSupabaseAuth();
  const { data, error } = await supabase.auth.signUp({
    email: email.toLowerCase(),
    password,
    options: {
      data: { display_name: display_name || email.split("@")[0] },
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json<SignupResponse>({
    success: true,
    authenticated: Boolean(data.session),
    requiresEmailVerification: !data.session,
    user: data.user
      ? {
          id: data.user.id,
          email: data.user.email ?? null,
        }
      : null,
  });
}
