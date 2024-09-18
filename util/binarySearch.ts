/**
 * Binary search. If multiple items are present, then the first or last one will
 * be returned depending on the `isHigher` flag.
 *
 * @param length
 * @param match
 */
export function binarySearch(length: number, match: (index: number) => number): number {
  if (!length) {
    return 0
  }

  let start = 0
  let end = length - 1
  let direction: number | undefined

  while (start < end) {
    const middle = Math.floor((start + end) / 2)
    direction = match(middle)
    if (direction === 0) {
      end = middle
    } else if (direction < 0) {
      start = middle + 1
    } else {
      end = middle
    }
  }

  return Math.floor((start + end) / 2)
}
