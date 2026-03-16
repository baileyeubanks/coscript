import "server-only";

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseServiceEnv } from "@/lib/env";

let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!_client) {
    const { url, serviceKey } = getSupabaseServiceEnv();
    _client = createClient(url, serviceKey);
  }
  return _client;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabase() as any)[prop];
  },
});
