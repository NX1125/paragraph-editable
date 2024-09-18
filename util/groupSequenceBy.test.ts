import { groupSequenceBy } from './groupSequenceBy'

describe('group sequences', () => {
  it('should group sequences', () => {
    const items = [ 1, 2, 2, 3, 3, 3, 2, 2, 4, 4, 4, 4 ]
    const cmp = (reference: number, item: number) => reference === item

    const groups = groupSequenceBy(items, cmp)

    expect(groups).toEqual([
      [ 1 ],
      [ 2, 2 ],
      [ 3, 3, 3 ],
      [ 2, 2 ],
      [ 4, 4, 4, 4 ],
    ])
  })

  it('should group unique sequences', () => {
    const items = [ 1, 2, 3, 1, 2, 3 ]
    const cmp = (reference: number, item: number) => reference === item

    const groups = groupSequenceBy(items, cmp)

    expect(groups).toEqual([
      [ 1 ],
      [ 2 ],
      [ 3 ],
      [ 1 ],
      [ 2 ],
      [ 3 ],
    ])
  })

  it('should group one sequence', () => {
    const items = [ 1 ]
    const cmp = (reference: number, item: number) => reference === item

    const groups = groupSequenceBy(items, cmp)

    expect(groups).toEqual([
      [ 1 ],
    ])
  })

  it('should group 2 sequences', () => {
    const items = [ 1, 2 ]
    const cmp = (reference: number, item: number) => true

    const groups = groupSequenceBy(items, cmp)

    expect(groups).toEqual([
      [ 1, 2 ],
    ])
  })

  it('should group 2 sequences into 2', () => {
    const items = [ 1, 2 ]
    const cmp = (reference: number, item: number) => false

    const groups = groupSequenceBy(items, cmp)

    expect(groups).toEqual([
      [ 1 ],
      [ 2 ],
    ])
  })
})
