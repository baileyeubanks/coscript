import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import type { AuthSessionResponse } from "@/lib/contracts";

export async function GET() {
  const user = await requireAuth();
  if (!user) {
    return NextResponse.json<AuthSessionResponse>(
      { authenticated: false, user: null },
      { status: 401 },
    );
  }

  return NextResponse.json<AuthSessionResponse>({
    authenticated: true,
    user: {
      id: user.id,
      email: user.email,
    },
  });
}
