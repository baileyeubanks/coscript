"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublicEnv } from "@/lib/env";

export function createSupabaseBrowser() {
  const { url, anonKey } = getSupabasePublicEnv();

  return createBrowserClient(
    url,
    anonKey
  );
}
