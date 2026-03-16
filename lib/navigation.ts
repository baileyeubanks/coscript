const DEFAULT_NEXT_PATH = "/";

export function normalizeNextPath(nextPath: string | null | undefined, fallback = DEFAULT_NEXT_PATH) {
  if (!nextPath) return fallback;
  if (!nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return fallback;
  }

  return nextPath;
}

function buildAuthPath(basePath: "/login" | "/signup", nextPath?: string | null) {
  const normalized = normalizeNextPath(nextPath);
  if (normalized === DEFAULT_NEXT_PATH) {
    return basePath;
  }

  return `${basePath}?next=${encodeURIComponent(normalized)}`;
}

export function buildLoginPath(nextPath?: string | null) {
  return buildAuthPath("/login", nextPath);
}

export function buildSignupPath(nextPath?: string | null) {
  return buildAuthPath("/signup", nextPath);
}
