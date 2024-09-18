import { binarySearch } from './binarySearch'

describe('binary search', () => {
  it('should find item', () => {
    const query = 5
    const items = [ 1, 2, 3, 4, 5, 6, 7, 8, 9 ]
    const index = binarySearch(items.length, i => items[i] - query)

    expect(index).toBe(items.indexOf(query))
  })

  it('should find position that it would be inserted', () => {
    const query = 5
    const items = [ 1, 2, 3, 4, 6, 7, 8, 9 ]
    const index = binarySearch(items.length, i => items[i] - query)

    expect(index).toBe(items.indexOf(6))
  })

  it('should find position that it would be inserted 2', () => {
    const query = 5
    const items = [ 1, 2, 3, 4, 6, 7, 8, 9, 10 ]
    const index = binarySearch(items.length, i => items[i] - query)

    expect(index).toBe(items.indexOf(6))
  })

  it('should find position that it would be inserted 3', () => {
    const query = 5
    const items = [ 0, 1, 2, 3, 4, 6, 7, 8, 9 ]
    const index = binarySearch(items.length, i => items[i] - query)

    expect(index).toBe(items.indexOf(6))
  })

  it('should find one item when multiple are present', () => {
    const query = 5
    const items = [ 1, 2, 3, 4, 5, 5, 5, 6, 7, 8, 9 ]
    const index = binarySearch(items.length, i => items[i] - query)

    expect(index).toBe(items.indexOf(query))
  })

  it('should find the item with one item', () => {
    const query = 5
    const items = [ 5 ]
    const index = binarySearch(items.length, i => items[i] - query)

    expect(index).toBe(items.indexOf(query))
  })

  it('should find a position to insert if empty', () => {
    const index = binarySearch(0, i => {
      throw new Error('should not be called')
    })

    expect(index).toBe(0)
  })

  it('should find the first position', () => {
    const query = 1
    const items = [ 1, 2, 3, 4, 5, 6, 7, 8, 9 ]
    const index = binarySearch(items.length, i => items[i] - query)

    expect(index).toBe(items.indexOf(query))
  })

  it('should find the last position', () => {
    const query = 9
    const items = [ 1, 2, 3, 4, 5, 6, 7, 8, 9 ]
    const index = binarySearch(items.length, i => items[i] - query)

    expect(index).toBe(items.indexOf(query))
  })

  it('should find if 2 items', () => {
    const query = 5
    const items = [ 5, 6 ]
    const index = binarySearch(items.length, i => items[i] - query)

    expect(index).toBe(items.indexOf(query))
  })

  it('should find with a lot of items', () => {
    const query = 54
    const items = [ ...Array.from({ length: 1000 }, (_, i) => i), 1000 ]
    const index = binarySearch(items.length, i => items[i] - query)

    expect(index).toBe(items.indexOf(query))
  })

  it('should find with a lot of repeated items', () => {
    const query = 54
    const items = [
      ...Array.from({ length: 50 }, (_, i) => i),
      ...Array.from({ length: 50 }, () => query),
      ...Array.from({ length: 1000 }, () => 1000),
    ]
    const index = binarySearch(items.length, i => items[i] - query)

    expect(index).toBe(items.indexOf(query))
  })

  it('should find with a lot of repeated items 2', () => {
    const query = 54
    const items = [
      ...Array.from({ length: 49 }, (_, i) => i),
      ...Array.from({ length: 50 }, () => query),
      ...Array.from({ length: 1000 }, () => 1000),
    ]
    const index = binarySearch(items.length, i => items[i] - query)

    expect(index).toBe(items.indexOf(query))
  })
})
