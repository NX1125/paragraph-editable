export interface IGroupSequenceRange {
  offset: number
  length: number
}

/**
 * Groups a sequence of items by a comparison function.
 *
 * @param items The items to group.
 * @param cmp The comparison function.
 */
export function getSequenceGroupRanges<I>(items: I[], cmp: (reference: I, item: I) => boolean): IGroupSequenceRange[] {
  let isFirst = true
  let previous: I | undefined = undefined
  const groups: IGroupSequenceRange[] = []

  for (let i = 0; i < items.length; i++) {
    const item = items[i]

    if (!isFirst && cmp(previous!, item)) {
      groups[groups.length - 1].length++
      continue
    }

    isFirst = false

    previous = item
    groups.push({
      offset: i,
      length: 1,
    })
  }

  return groups
}

/**
 * Groups a sequence of items by a comparison function.
 *
 * @param items The items to group.
 * @param cmp The comparison function.
 */
export function groupSequenceBy<I>(items: I[], cmp: (reference: I, item: I) => boolean): I[][] {
  const groups: IGroupSequenceRange[] = getSequenceGroupRanges(items, cmp)

  return groups.map(group => items.slice(group.offset, group.offset + group.length))
}
