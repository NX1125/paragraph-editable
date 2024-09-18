import { binarySearch } from './binarySearch'

/**
 * Returns the range of items that matches the query. The returned range is
 * inclusive on both ends. If no items match the query, the range will be
 * empty, i.e. `end` will be less than `start`.
 */
export function binaryRangeSearch(
  length: number,
  query: (index: number) => number,
): [ number, number ] {
  if (!length) {
    return [ 0, -1 ]
  }

  const start = binarySearch(length, index => {
    const a = index <= 0 ? -1 : query(index - 1)
    const b = query(index)

    if (a < 0 && b < 0) {
      return -1
    }

    if (a < 0 && (b >= 0)) {
      return 0
    }

    return 1
  })

  const rest = length - start

  const end = binarySearch(rest, index => {
    const a = query(index + start)
    const b = index + 1 >= rest ? 1 : query(index + start + 1)

    if (a > 0 && b > 0) {
      return 1
    }

    if (a <= 0 && b > 0) {
      return 0
    }

    return -1
  })

  return [ start, start + end ]
}
