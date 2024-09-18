import { ITextNodeBounds } from './TextNodeMeasurements'

function containsMiddle(middleRect: DOMRect | ITextNodeBounds, container: DOMRect | ITextNodeBounds) {
  const middleA = (middleRect.top + middleRect.bottom) / 2
  return container.top <= middleA && middleA <= container.bottom
}

/**
 * Checks whether two bounds are on the same line.
 */
export function isSameLine(a: DOMRect | ITextNodeBounds, b: DOMRect | ITextNodeBounds) {
  // We don't have a way to know this. So we will try instead to check if the
  // middle of one is contained in the other.
  return containsMiddle(a, b) || containsMiddle(b, a)
}
