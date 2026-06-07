/**
 * Cleans the raw settlement string coming from the official notices feed.
 * Mirrors the Postgres `public.clean_settlement(text)` function.
 *
 * Examples:
 *  "vétel - Debrecen"                              -> "Debrecen"
 *  "120 évnél régebben születettek - Alsószentmárton" -> "Alsószentmárton"
 *  "6041 Kerekegyháza"                             -> "Kerekegyháza"
 *  "Belvárdgyula"                                  -> "Belvárdgyula"
 */
export function cleanSettlement(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let s = raw;
  if (s.includes(" - ")) {
    const parts = s.split(" - ");
    s = parts[parts.length - 1];
  }
  s = s.replace(/vétel/gi, "");
  s = s.replace(/-/g, " ");
  s = s.replace(/^\s*\d+\s+/, "");
  s = s.replace(/\s+/g, " ").trim();
  return s === "" ? null : s;
}