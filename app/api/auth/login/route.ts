import { NextResponse } from "next/server";
import { createLocalAuthSession, getLocalAuthEmail, isValidLocalCredential } from "@/lib/auth";

export async function POST(req: Request) {
  let body: Record<string, string>;
  try {
    body = await req.json();
  } catch {
    // Fallback to form data for non-JSON requests
    const form = await req.formData().catch(() => null);
    if (!form) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    body = {
      email: String(form.get("email") || ""),
      password: String(form.get("password") || ""),
    };
  }

  const { email, password } = body;
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }

  if (!isValidLocalCredential(email, password)) {
    return NextResponse.json(
      { error: `Use the current workspace credentials for ${getLocalAuthEmail()}.` },
      { status: 401 },
    );
  }

  await createLocalAuthSession();
  return NextResponse.json({ success: true });
}
