import { expect as baseExpect } from '@playwright/experimental-ct-react'

export const expect = baseExpect.extend({
  toBeCloseTo2(value: number, expected: number, tol: number) {
    const assertionName = 'toBeCloseTo2'

    const pass = Math.abs(value - expected) <= tol

    return {
      pass,
      message: () => {
        const diff = Math.abs(value - expected)

        return this.utils.matcherHint(
            assertionName,
            value,
            expected,
            { isNot: this.isNot, promise: this.promise },
          ) + '\n\n' +
          `Expected: ${this.utils.printExpected(expected)}\n` +
          `Received: ${this.utils.printReceived(value)}\n` +
          `Difference: ${this.utils.printReceived(diff)} > ${this.utils.printExpected(tol)}`
      },
    }
  },
})
