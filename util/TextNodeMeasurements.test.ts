import '@testing-library/jest-dom'

import { TextNodeMeasurements } from './TextNodeMeasurements'

describe('getClientRectsForRange', () => {
  it('should have one bound', () => {
    const textNode = new TextNodeMeasurements(
      jest.fn() as unknown as Text,
      {
        getClientRects: jest
          .fn()
          .mockReturnValueOnce([
            { left: 0, right: 10 },
          ])
          .mockReturnValueOnce([
            { left: 0, right: 20 },
          ]),
        setStart: jest.fn(),
        setEnd: jest.fn(),
      } as any,
    )

    const bounds = textNode.getClientRectsForRange(0, 10)

    expect(bounds).toEqual([
      { left: 10, right: 20 },
    ])
  })
})
