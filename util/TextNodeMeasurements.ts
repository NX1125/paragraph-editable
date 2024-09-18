import { binarySearch } from './binarySearch'

/**
 * A rectangle representing the bounds of a text node.
 */
export interface ITextNodeBounds {
  top: number
  bottom: number
  left: number
  right: number
}

/**
 * Measurements of a {@link Text} node. Assumes that the text node is not
 * throughout the usage of the instance.
 */
export class TextNodeMeasurements {
  private readonly range: Range

  private lines?: DOMRectList

  constructor(
    public readonly text: Text,
    range?: Range,
  ) {
    this.range = range ?? document.createRange()
    this._setStart(0)
  }

  /**
   * For internal use only.
   */
  private _setStart(offset: number) {
    this.range.setStart(this.text, offset)
  }

  /**
   * For internal use only.
   */
  private _setEnd(offset: number) {
    if (offset > this.length || isNaN(offset) || offset < 0) {
      throw new Error(`Offset out of bounds: ${offset} > ${this.length}`)
    }
    this.range.setEnd(this.text, offset)
  }

  /**
   * Return the client rects for the text node.
   */
  getClientRects(): DOMRectList {
    return this.range.getClientRects()
  }

  /**
   * Return the client rects for the given range.
   */
  getClientRectsForRange(start: number, end: number): ITextNodeBounds[] {
    // when the start index points to the first char of a line, the left side of the last char of the previous line is
    // returned instead. We need to get the rects relative to the end of the text as well.

    this._setStart(0)
    this._setEnd(end)
    const endRects: ITextNodeBounds[] = Array.from(this.getClientRects())

    this._setStart(start)
    this._setEnd(this.length)
    const startRects = this.getClientRects()

    // clean up the range
    this._setStart(0)

    const lines = this.getLineCount()

    const startLineIndex = lines - startRects.length
    const endLineIndex = endRects.length - 1

    if (startLineIndex === endLineIndex) {
      return [
        {
          top: startRects[0].top,
          bottom: endRects[endRects.length - 1].bottom,
          left: startRects[0].left,
          right: endRects[endRects.length - 1].right,
        },
      ]
    }

    // endRects will have all rects before the start until the end line. Remove the lines above the first one and
    // replace the first one with the first of the startRects.
    endRects.splice(0, startLineIndex + 1, startRects[0])

    return endRects
  }

  /**
   * The length of the text node.
   */
  get length(): number {
    return this.text.data.length
  }

  /**
   * Find the line index of the text node at the given index. The char is included in the line.
   *
   * @param offsetInText
   */
  getLineIndex(offsetInText: number): number {
    this._setStart(0)
    this._setEnd(Math.min(offsetInText + 1, this.length))
    const rects = this.getClientRects()

    return rects.length - 1
  }

  /**
   * Returns the number of lines in the text node.
   */
  getLineCount(): number {
    return this.getLineRects().length
  }

  /**
   * Get the bounds of each line in the text node.
   */
  getLineRects() {
    if (this.lines) {
      return this.lines
    }

    this._setStart(0)
    this._setEnd(this.length)
    this.lines = this.getClientRects()

    return this.lines
  }

  /**
   * Find the range of the line at the given index.
   *
   * See {@link getLineStart} and {@link getLineEnd} for more details.
   *
   * @param lineIndex
   */
  getLineRange(lineIndex: number): [ number, number ] {
    lineIndex++
    this._setStart(0)

    return [
      this._getLineStart(lineIndex),
      this._getLineEnd(lineIndex),
    ]
  }

  private _getLineEnd(lineIndexPlusOne: number): number {
    return binarySearch(this.length + 1, index => {
      this._setEnd(index + 1)
      const rects = this.getClientRects()
      return rects.length - (lineIndexPlusOne + 1)
    })
  }

  /**
   * Find the end of the line at the given index. The char at the end is not included in the line.
   *
   * @param lineIndex
   * @returns The index of the char at the end of the line relative to the text node.
   */
  getLineEnd(lineIndex: number): number {
    lineIndex++
    this._setStart(0)

    return this._getLineEnd(lineIndex)
  }

  private _getLineStart(lineIndexPlusOne: number): number {
    return binarySearch(this.length, index => {
      this._setEnd(index + 1)
      const rects = this.getClientRects()
      return rects.length - lineIndexPlusOne
    })
  }

  /**
   * Find the start of the line at the given index. The char at the start is included in the line.
   *
   * @param lineIndex
   * @returns The index of the char at the start of the line relative to the text node.
   */
  getLineStart(lineIndex: number): number {
    lineIndex++
    this._setStart(0)

    return this._getLineStart(lineIndex)
  }

  /**
   * Get the line measurements for the given line index.
   *
   * @param lineIndex
   */
  getLine(lineIndex: number): TextNodeLineMeasurements {
    const lines = this.getLineRects()
    if (!lines[lineIndex]) {
      throw new Error('Line index out of bounds')
    }

    const [ start, end ] = this.getLineRange(lineIndex)

    return new TextNodeLineMeasurements(
      lines[lineIndex],
      lineIndex,
      start,
      end - start,
      this,
    )
  }

  /**
   * Get the caret position for the given offset.
   * See {@link TextNodeLineMeasurements.getCaretPosition} for more details.
   *
   * @param offsetInText
   * @param touching
   */
  getCaretPosition(offsetInText: number, touching: 'left' | 'right'): ITextNodeBounds {
    const lineIndex = this.getLineIndex(offsetInText)
    const line = this.getLine(lineIndex)

    return line.getCaretPosition(offsetInText - line.offsetInText, touching)
  }

  /**
   * Get the bounds from the given offset until the end of the text node.
   * See {@link TextNodeLineMeasurements.getBoundsUntilEnd} for more details.
   *
   * @param offset
   */
  getBoundsUntilEnd(offset: number): ITextNodeBounds {
    const lineIndex = this.getLineIndex(offset)
    const line = this.getLine(lineIndex)

    return line.getBoundsUntilEnd(offset - line.offsetInText)
  }

  /**
   * Get the bounds from the start of the text node until the given offset.
   * See {@link TextNodeLineMeasurements.getBoundsUntilStart} for more details.
   *
   * @param offset
   */
  getBoundsUntilStart(offset: number): ITextNodeBounds {
    const lineIndex = this.getLineIndex(offset)
    const line = this.getLine(lineIndex)

    return line.getBoundsUntilStart(offset - line.offsetInText)
  }

  /**
   * Get the index of the closest line at the given y coordinate.
   */
  getClosestLineIndexAtY(clientY: number): number {
    const lines = this.getLineRects()

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      if (line.top <= clientY && line.bottom >= clientY) {
        return i
      }

      if (line.top > clientY) {
        return i - 1
      }
    }

    return lines.length - 1
  }
}

/**
 * Measurements of a line in a text node. Assumes that the text node is not
 * throughout the usage of the instance.
 */
export class TextNodeLineMeasurements {
  /**
   * @param bounds The bounds of the line.
   * @param lineIndex The index of the line in the text node.
   * @param offsetInText The offset of the line in the text node.
   * @param length The length of the line.
   * @param parent The parent text node measurements.
   */
  constructor(
    public readonly bounds: DOMRect,
    public readonly lineIndex: number,
    public readonly offsetInText: number,
    public readonly length: number,
    public readonly parent: TextNodeMeasurements,
  ) {
  }

  private getRangeBounds(start: number, end: number): ITextNodeBounds {
    const rects = this.parent.getClientRectsForRange(this.offsetInText + start, this.offsetInText + end)

    // assert one rect
    if (rects.length !== 1) {
      throw new Error('Expected one rect: ' + rects.length)
    }

    return rects[0]
  }

  private getMiddleX(start: number, end: number): number {
    const bounds = this.getRangeBounds(start, end)
    return (bounds.left + bounds.right) / 2
  }

  /**
   * Get the caret position for the given index.
   *
   * The caret is position between the chars `index - 1` and `index`.
   * If `touching` is `left`, then the caret is touching the char at
   * `index - 1`. If `touching` is `right`, then the caret is touching
   * the char at `index`. Generally, the difference between the two are
   * small, less than a pixel.
   *
   * @param indexAtLine The index of the char in the line.
   * @param touching Whether the caret should be touching the char at
   * `index - 1` or `index`; ignored if `indexAtLine` is first or last char
   */
  getCaretPosition(indexAtLine: number, touching: 'left' | 'right'): ITextNodeBounds {
    if (indexAtLine === 0) {
      return {
        top: this.bounds.top,
        bottom: this.bounds.bottom,
        left: this.bounds.left,
        right: this.bounds.left,
      }
    }

    if (indexAtLine >= this.length) {
      return {
        top: this.bounds.top,
        bottom: this.bounds.bottom,
        left: this.bounds.right,
        right: this.bounds.right,
      }
    }

    let b: ITextNodeBounds
    let x: number

    if (touching === 'left') {
      b = this.getRangeBounds(0, indexAtLine)
      x = b.right
    } else {
      b = this.getRangeBounds(indexAtLine, this.length)
      x = b.left
    }

    return {
      top: b.top,
      bottom: b.bottom,
      left: x,
      right: x,
    }
  }

  /**
   * Get the bounds from the given offset until the end of the line.
   */
  getBoundsUntilEnd(offset: number, isAbsoluteOffset?: boolean): ITextNodeBounds {
    if (isAbsoluteOffset) {
      offset -= this.offsetInText
    }

    const caret = this.getCaretPosition(offset, 'right')

    return {
      top: this.bounds.top,
      bottom: this.bounds.bottom,
      left: caret.right,
      right: this.bounds.right,
    }
  }

  /**
   * Get the bounds from the start of the line until the given offset.
   */
  getBoundsUntilStart(offset: number, isAbsoluteOffset?: boolean): ITextNodeBounds {
    if (isAbsoluteOffset) {
      offset -= this.offsetInText
    }

    const caret = this.getCaretPosition(offset, 'left')

    return {
      top: this.bounds.top,
      bottom: this.bounds.bottom,
      left: this.bounds.left,
      right: caret.left,
    }
  }

  /**
   * Get the closest position at the given x coordinate, relative to the line.
   */
  getClosestOffsetAtLineToX(clientX: number): number {
    if (clientX < this.bounds.left) {
      return this.startingSpaces
    }

    if (clientX >= this.bounds.right) {
      return this.length - this.getCaretEndingSpaces(false)
    }

    const offset = this.startingSpaces

    return binarySearch(this.length - offset, i => {
      i += offset
      return this.getMiddleX(i, i + 1) - clientX
    }) + offset
  }

  /**
   * Get the text of the line.
   */
  getText() {
    return this.parent.text.data.slice(this.offsetInText, this.offsetInText + this.length)
  }

  /**
   * Get the text of the line.
   */
  get text() {
    return this.getText()
  }

  get startingSpaces() {
    return this.text.match(/^[ \n\r\t]*/g)?.[0].length || 0
  }

  /**
   * Return the number of whitespaces to ignore at the end of the line.
   *
   * @param ignoreLastLine Whether to ignore the last line; if true, the last line will return 0.
   */
  getCaretEndingSpaces(ignoreLastLine = true) {
    if (ignoreLastLine && this.lineIndex === this.parent.getLineCount() - 1) {
      return 0
    }

    return /\s*$/g.exec(this.text)?.[0].length || 0
  }
}
