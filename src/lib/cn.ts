/** Tiny classnames joiner (no clsx dependency needed). */
export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}
