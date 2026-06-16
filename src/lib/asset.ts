// Prefixes an app-absolute asset path (e.g. "/favicon/logo.png") with the
// configured base path so it resolves correctly when the site is hosted under
// a sub-path such as GitHub Pages ("/Korean-Quest"). Next's <Image>/<Link>
// apply the base path automatically; use this for raw <img> tags, inline
// styles, and any other manual asset URLs.
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function asset(path?: string): string {
  if (!path) return path ?? "";
  if (/^(?:https?:)?\/\//.test(path) || path.startsWith("data:")) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (BASE_PATH && normalized.startsWith(`${BASE_PATH}/`)) return normalized;
  return `${BASE_PATH}${normalized}`;
}
