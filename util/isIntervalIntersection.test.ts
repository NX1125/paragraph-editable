import { isIntervalIntersection } from './isIntervalIntersection'

function getParams(x: string) {
  return Array
    .from('abcd')
    .map(c => x.indexOf(c) + 1)
}

it('should get params', () => {
  expect(getParams('bcad')).toEqual([ 3, 1, 2, 4 ])
})

it('should not intersect abcd', () => {
  // eslint-disable-next-line
  const [ a, b, c, d ] = getParams('abcd')
  expect(isIntervalIntersection(a, b, c, d)).toBe(false)
})

it('should intersect acbd', () => {
  // eslint-disable-next-line
  const [ a, b, c, d ] = getParams('acbd')
  expect(isIntervalIntersection(a, b, c, d)).toBe(true)
})

it('should intersect acdb', () => {
  // eslint-disable-next-line
  const [ a, b, c, d ] = getParams('acdb')
  expect(isIntervalIntersection(a, b, c, d)).toBe(true)
})

it('should intersect cadb', () => {
  // eslint-disable-next-line
  const [ a, b, c, d ] = getParams('cadb')
  expect(isIntervalIntersection(a, b, c, d)).toBe(true)
})

it('should not intersect cdab', () => {
  // eslint-disable-next-line
  const [ a, b, c, d ] = getParams('cdab')
  expect(isIntervalIntersection(a, b, c, d)).toBe(false)
})
