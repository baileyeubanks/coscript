function readEnv(name: string): string | undefined {
  const value = process.env[name];
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function missingEnv(message: string): never {
  throw new Error(`${message} Set it in .env.local for local development or in your deployment environment.`);
}

function getSupabaseUrl({ allowServerFallback = false }: { allowServerFallback?: boolean } = {}) {
  const url =
    readEnv("NEXT_PUBLIC_SUPABASE_URL") ||
    (allowServerFallback ? readEnv("SUPABASE_URL") : undefined);

  if (!url) {
    if (allowServerFallback) {
      missingEnv("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL.");
    }

    missingEnv("Missing NEXT_PUBLIC_SUPABASE_URL.");
  }

  return url;
}

export function getSupabasePublicEnv() {
  const url = getSupabaseUrl();
  const anonKey = readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  if (!anonKey) {
    missingEnv("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }

  return { url, anonKey };
}

export function getSupabaseServiceEnv() {
  const url = getSupabaseUrl({ allowServerFallback: true });
  const serviceKey = readEnv("SUPABASE_SERVICE_KEY");

  if (!serviceKey) {
    missingEnv("Missing SUPABASE_SERVICE_KEY.");
  }

  return {
    url,
    serviceKey,
  };
}
