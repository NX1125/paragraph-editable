/**
 * @param a Inclusive
 * @param b Exclusive
 * @param c Inclusive
 * @param d Exclusive
 */
export function isIntervalIntersection(
  a: number,
  b: number,
  c: number,
  d: number,
): boolean {
  return a < d && c < b
}
