import { NAV_DATA } from "./data";

/**
 * Checks if the current pathname matches the target href, or if the pathname is a subpath of the target href.=
 */
export function isPathActive(href: string, pathname: string): boolean {
  if (!href) return false;

  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(href + "/");
}

/**
 * Find the nav group whose child URLs include the current pathname.
 * Returns the group's `title` (used as the Disclosure `id`) or null.
 */
export function findActiveGroupKey(pathname: string): string | null {
  for (const section of NAV_DATA) {
    for (const item of section.items) {
      if (item.items && item.items.length > 0) {
        const hasMatch = item.items.some((child) => child.url && isPathActive(child.url, pathname));
        if (hasMatch) return item.title;
      }
    }
  }
  return null;
}

export function findActiveSection(pathname: string): string | null {
  const section = NAV_DATA.find((entry) =>
    entry.items.some((item) => item.url && isPathActive(item.url, pathname)),
  );
  return section?.label ?? null;
}
