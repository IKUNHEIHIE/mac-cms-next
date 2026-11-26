export const ADMIN_PATH_DEFAULT = "/admin";

export const RESERVED_ADMIN_PATHS = [
  "/api",
  "/api.php",
  "/vod",
  "/user",
  "/art",
  "/topic",
  "/map",
  "/label",
  "/search",
  "/gbook",
  "/website",
  "/manga",
  "/actor",
  "/role",
  "/rss",
  "/media",
  "/player",
  "/theme",
  "/_next",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
];

export function normalizeAdminPath(input: unknown): string {
  let value = String(input ?? "").trim();
  if (!value) return ADMIN_PATH_DEFAULT;
  if (!value.startsWith("/")) value = `/${value}`;
  value = value.replace(/\/+$/, "");
  if (!/^\/[A-Za-z0-9_-]{2,32}$/.test(value)) return ADMIN_PATH_DEFAULT;
  if (RESERVED_ADMIN_PATHS.some((reserved) => value === reserved || value.startsWith(`${reserved}/`))) {
    return ADMIN_PATH_DEFAULT;
  }
  return value;
}

export function adminPathJoin(adminPath: string, suffix = "") {
  const base = normalizeAdminPath(adminPath);
  if (!suffix) return base;
  return `${base}${suffix.startsWith("/") ? suffix : `/${suffix}`}`;
}
