import { binaryRangeSearch } from './binaryRangeSearch'

describe('binary search for range', () => {
  it('should find the range of equal numbers', () => {
    const items = [ 1, 2, 3, 3, 3, 4, 5 ]
    const query = 3

    const range = binaryRangeSearch(items.length, i => items[i] - query)

    expect(range).toEqual([
      items.indexOf(query),
      items.lastIndexOf(query),
    ])
  })

  it('should find range with number once', () => {
    const items = [ 1, 2, 3, 4, 5 ]
    const query = 3

    const range = binaryRangeSearch(items.length, i => items[i] - query)

    expect(range).toEqual([
      items.indexOf(query),
      items.indexOf(query),
    ])
  })

  it('should find empty range', () => {
    const items = [ 1, 2, 4, 5 ]
    const query = 3

    const range = binaryRangeSearch(items.length, i => items[i] - query)

    expect(range).toEqual([ 2, 1 ])
  })

  it('should find empty range with array', () => {
    const items: number[] = []
    const query = 3

    const range = binaryRangeSearch(items.length, i => items[i] - query)

    expect(range).toEqual([ 0, -1 ])
  })

  it('should find range with all items of array equal query', () => {
    const items = [ 3, 3, 3, 3, 3 ]
    const query = 3

    const range = binaryRangeSearch(items.length, i => items[i] - query)

    expect(range).toEqual([ 0, 4 ])
  })

  it('should find range with single item', () => {
    const items = [ 3 ]
    const query = 3

    const range = binaryRangeSearch(items.length, i => items[i] - query)

    expect(range).toEqual([ 0, 0 ])
  })
})
