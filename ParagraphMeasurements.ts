import { ITextNodeBounds, TextNodeLineMeasurements, TextNodeMeasurements } from './util/TextNodeMeasurements'
import { groupSequenceBy } from './util/groupSequenceBy'
import { isIntervalIntersection } from './util/isIntervalIntersection'

export interface IInlineFragment {
  start: number
  end: number

  source: Element | TextNodeMeasurements
}

/**
 * Represents a node in the paragraph. This is used to create the selection from the DOM Selection.
 */
export interface INodeFragment {
  offset: number
  node: Node
}

export interface ILineFragmentRange {
  start: number
  end: number
  isWhitespaceOrEmpty?: boolean
}

export interface IAtomicLineFragment extends ILineFragmentRange {
  source: Node
  clientBounds: DOMRect | ITextNodeBounds
}

export interface ITextLineFragment extends ILineFragmentRange {
  source: TextNodeLineMeasurements
  clientBounds: DOMRect
}

export type ILineFragment = IAtomicLineFragment | ITextLineFragment

export interface ISelectionHighlight {
  start: number
  end: number

  bounds: DOMRect | ITextNodeBounds
  source: Node | TextNodeLineMeasurements
}

export interface ICaretHighlight {
  offset: number

  x: number
  top: number
  bottom: number

  source: Node | TextNodeLineMeasurements
}

export abstract class AbstractParagraphMeasurements {
  public readonly inlines: IInlineFragment[]
  public readonly fragments: ILineFragment[]

  public readonly nodes: INodeFragment[]

  constructor(
    public readonly root: Element,
  ) {
    this.inlines = []
    this.nodes = []

    this.parseInlinesRecursively(this.inlines, root, 0)

    let previous: ILineFragment | undefined = undefined

    this.fragments = []
    for (const inline of this.inlines) {
      const lineFragments = this.getLineFragments(inline, previous)
      this.fragments.push(...lineFragments)
      previous = lineFragments[lineFragments.length - 1]
    }

    Object.freeze(this.inlines)
    Object.freeze(this.fragments)
  }

  /**
   * Check if the given element is atomic. Atomic elements are not parsed.
   *
   * @param element
   */
  abstract isAtomic(element: Element): boolean

  /**
   * Check if two line fragments are on the same line.
   *
   * @param f1
   * @param f2
   */
  abstract isSameLine(f1: ILineFragment, f2: ILineFragment): boolean

  /**
   * Check if the given element is empty, thus it should be skipped.
   *
   * @param element
   */
  abstract isNotInline(element: Element): boolean

  private parseInlinesRecursively(inlines: IInlineFragment[], element: Element | null | undefined, offset: number) {
    if (element === null || element === undefined) {
      return offset
    }

    // store into an array since childNodes is a live collection
    const childNodes = Array.from(element.childNodes)

    for (const node of childNodes) {
      this.nodes.push({
        offset,
        node,
      })

      if (node instanceof Text) {
        const data = node.data
        inlines.push({
          start: offset,
          end: offset + data.length,
          source: new TextNodeMeasurements(node),
        })
        offset += data.length
      } else if (node instanceof Comment) {
        // skip comments
      } else if (!(node instanceof Element)) {
        throw new Error(`Unexpected node type ${node}`)
      } else if (this.isNotInline(node)) {
        // skip empty elements
      } else if (this.isAtomic(node)) {
        inlines.push({
          start: offset,
          end: offset + 1,
          source: node,
        })
        offset++
      } else {
        offset = this.parseInlinesRecursively(inlines, node, offset)
      }
    }

    return offset
  }

  private getLineFragments(inline: IInlineFragment, previous: ILineFragment | undefined): ILineFragment[] {
    const source = inline.source
    if (source instanceof TextNodeMeasurements) {
      const length = source.getLineCount()

      // Special case. When a text is empty, it has no bounds,
      // and getBoundingClientRect returns a zeroed rect.
      // We try to use the right side of the previous inline.

      if (length === 0) {
        const isWhitespace = /^\s*$/.test(source.text.data)
        if (!isWhitespace) {
          console.error('Unexpected empty line', source)
          throw new Error('Unexpected empty line')
        }

        if (!previous) {
          throw new Error('Unexpected empty line at the beginning of the text')
        }

        return [
          {
            start: inline.start,
            end: inline.end,
            source: source.text,
            clientBounds: {
              left: previous.clientBounds.right,
              right: previous.clientBounds.right,
              top: previous.clientBounds.top,
              bottom: previous.clientBounds.bottom,
            },
            isWhitespaceOrEmpty: true,
          },
        ]
      }

      return Array
        .from({ length }, (_, i) => source.getLine(i))
        .map<ILineFragment>(i => ({
          start: inline.start + i.offsetInText,
          end: inline.start + i.offsetInText + i.length,
          source: i,
          clientBounds: i.bounds,
        }))
    } else {
      return [
        {
          start: inline.start,
          end: inline.end,
          source,
          clientBounds: source.getBoundingClientRect(),
        },
      ]
    }
  }

  get length() {
    return this.fragments[this.fragments.length - 1]?.end || 0
  }

  /**
   * Move caret left. Do nothing if the caret is already at the beginning of the
   * text. Returns -1 if the caret goes out of the text.
   *
   * @param offset
   */
  moveLeft(offset: number) {
    if (offset <= 0) {
      return -1
    }

    return offset - 1
  }

  /**
   * Move caret right. Note that the offset may return the length of the text
   * in case the caret is at the end of the text. If it moves out of the text,
   * then -1 is returned.
   *
   * @param offset
   */
  moveRight(offset: number) {
    const last = this.inlines[this.inlines.length - 1]
    if (offset + 1 > last.end) {
      return -1
    }

    return offset + 1
  }

  /**
   * Get the index of the line fragment that contains the given offset.
   *
   * @param offset
   */
  getLineFragmentIndex(offset: number) {
    if (offset === this.length) {
      return this.fragments.length - 1
    }

    return this.fragments.findIndex(f => f.start <= offset && offset < f.end)
  }

  /**
   * Returns all line fragments that are on the same line as the given line
   * fragment. The return is a tuple of the start index and the length of the
   * line fragments:
   * ```[start, length]```
   *
   * @param fragmentIndex
   */
  getLineFragmentsRangeAtLine(fragmentIndex: number) {
    const start = this.getLineStart(fragmentIndex)
    const end = this.getLineEnd(fragmentIndex)

    return [ start, end + 1 - start ]
  }

  /**
   * Returns the index of the line fragment that is at the start of the line
   * containing the given line fragment. Inclusive.
   *
   * @param fragmentIndex
   */
  getLineStart(fragmentIndex: number) {
    const lineFragment = this.fragments[fragmentIndex]

    while (fragmentIndex > 0 && this.isSameLine(lineFragment, this.fragments[fragmentIndex - 1])) {
      fragmentIndex--
    }

    return fragmentIndex
  }

  /**
   * Returns the index of the line fragment that is at the end of the line
   * containing the given line fragment. Inclusive.
   *
   * @param fragmentIndex
   */
  getLineEnd(fragmentIndex: number) {
    const lineFragment = this.fragments[fragmentIndex]

    while (fragmentIndex < this.fragments.length - 1 && this.isSameLine(lineFragment, this.fragments[fragmentIndex + 1])) {
      fragmentIndex++
    }

    return fragmentIndex
  }

  /**
   * Get the closest offset to the given x coordinate. If the x coordinate is
   * outside the line fragments, then the last line fragment is returned.
   *
   * @param fragments
   * @param clientX
   */
  getClosestOffsetToX(fragments: ILineFragment[], clientX: number) {
    if (!fragments.length) {
      return -1
    }

    fragments = fragments.filter(x => !x.isWhitespaceOrEmpty)

    for (let i = 0; i < fragments.length - 1; i++) {
      const fragment = fragments[i]
      const {
        left,
        right,
      } = fragment.clientBounds

      if (clientX < left) {
        return fragment.start
      }

      if (clientX > right) {
        continue
      }

      return this.getClosestOffsetToXInFragment(fragment, clientX, false, i === 0)
    }

    return this.getClosestOffsetToXInFragment(fragments[fragments.length - 1], clientX, true, fragments.length === 1)
  }

  private getClosestOffsetToXInFragment(
    fragment: ILineFragment,
    clientX: number,
    isLastOfLine: boolean,
    isFirstOfLine: boolean,
  ) {
    if (!(fragment.source instanceof TextNodeLineMeasurements)) {
      return this.getClosestOffsetToXInAtomic(fragment as IAtomicLineFragment, clientX, isLastOfLine)
    }

    // if the text starts with whitespace and the clientX is the first fragment
    // of the line, then return after the first whitespace
    if (isFirstOfLine
      && fragment.source.startingSpaces > 0
      && clientX < fragment.clientBounds.left) {
      return fragment.start + 1
    }

    const offset = fragment.source.getClosestOffsetAtLineToX(clientX)
    return offset + fragment.start
  }

  abstract getClosestOffsetToXInAtomic(
    fragment: IAtomicLineFragment,
    clientX: number,
    isLastOfLine: boolean,
  ): number

  /**
   * Return all line fragments that are on the line below the line containing
   * the given offset. If the caret is at the last line, then an empty array is
   * returned.
   *
   * @param offset
   */
  getLineFragmentsAtLineBelowAtOffsetLine(offset: number) {
    const fragmentIndex = this.getLineFragmentIndex(offset)
    const lineEnd = this.getLineEnd(fragmentIndex)

    if (lineEnd >= this.fragments.length - 1) {
      return []
    }

    const nextLineStart = lineEnd + 1
    const nextLineEnd = this.getLineEnd(nextLineStart)

    return this.fragments.slice(nextLineStart, nextLineEnd + 1)
  }

  /**
   * Move caret down. Uses the x coordinate to determine the closest position
   * in the line below. If it is at the last line, then -1 is returned.
   *
   * @param offset
   * @param clientX The client x coordinate
   */
  moveDown(offset: number, clientX: number) {
    const fragments = this.getLineFragmentsAtLineBelowAtOffsetLine(offset)
    if (!fragments.length) {
      return -1
    }

    return this.getClosestOffsetToX(fragments, clientX)
  }

  /**
   * Return all line fragments that are on the line above the line containing
   * the given offset. If the caret is at the first line, then an empty array is
   * returned.
   *
   * @param offset
   */
  getLineFragmentsAtLineAboveAtOffsetLine(offset: number) {
    const fragmentIndex = this.getLineFragmentIndex(offset)
    const lineStart = this.getLineStart(fragmentIndex)

    if (lineStart <= 0) {
      return []
    }

    const prevLineEnd = lineStart - 1
    const prevLineStart = this.getLineStart(prevLineEnd)

    return this.fragments.slice(prevLineStart, prevLineEnd + 1)
  }

  /**
   * Move caret up. Uses the x coordinate to determine the closest position
   * in the line above. If it is at the first line, then -1 is returned.
   *
   * @param offset
   * @param clientX The client x coordinate
   */
  moveUp(offset: number, clientX: number) {
    const fragments = this.getLineFragmentsAtLineAboveAtOffsetLine(offset)
    if (!fragments.length) {
      return -1
    }

    return this.getClosestOffsetToX(fragments, clientX)
  }

  /**
   * Move caret to the beginning of the line containing the given offset.
   *
   * @param offset
   */
  moveToLineHome(offset: number) {
    const fragmentIndex = this.getLineFragmentIndex(offset)
    const lineStart = this.getLineStart(fragmentIndex)
    const fragment = this.fragments[lineStart]

    if (!(fragment.source instanceof TextNodeLineMeasurements))
      return fragment.start

    return fragment.start + fragment.source.startingSpaces
  }

  /**
   * Move caret to the end of the line containing the given offset.
   *
   * @param offset
   */
  moveToLineEnd(offset: number) {
    // TODO: Handle whitespace at the end of the line
    const fragmentIndex = this.getLineFragmentIndex(offset)
    const lineEnd = this.getLineEnd(fragmentIndex)

    return this.fragments[lineEnd].end
  }

  /**
   * Get a close fragment index to the given client y coordinate. If the
   * client y coordinate is below the last line, then the last line is returned.
   *
   * @param clientY
   */
  getFirstFragmentFragmentIndexCloseToY(clientY: number) {
    const index = this.fragments.findIndex(f => {
      const {
        bottom,
      } = f.clientBounds

      return bottom >= clientY
    })

    return index === -1 ? this.fragments.length - 1 : index
  }

  /**
   * Get the closest offset to the given client point.
   *
   * @param clientX
   * @param clientY
   * @returns offset relative to the text
   */
  getClosestOffsetToClientPoint(clientX: number, clientY: number) {
    const fragmentIndex = this.getFirstFragmentFragmentIndexCloseToY(clientY)
    const [ start, length ] = this.getLineFragmentsRangeAtLine(fragmentIndex)
    const fragments = this.fragments.slice(start, start + length)

    return this.getClosestOffsetToX(fragments, clientX)
  }

  /**
   * Return all bounds of the line fragments that are in the selection,
   * taking care of start and end.
   *
   * @param start
   * @param end
   */
  getSelectionHighlights(start: number, end: number): ISelectionHighlight[] {
    if (start === end) {
      return []
    }

    return this.fragments
      .filter(x => isIntervalIntersection(
        x.start,
        x.end,
        start,
        end,
      ))
      .map<ISelectionHighlight>(x => {
        const source = x.source
        if (!(source instanceof TextNodeLineMeasurements)) {
          return {
            start: x.start,
            end: x.end,
            bounds: x.clientBounds,
            source,
          }
        }

        const bounds: ITextNodeBounds = {
          left: x.clientBounds.left,
          right: x.clientBounds.right,
          top: x.clientBounds.top,
          bottom: x.clientBounds.bottom,
        }

        // cut the start of the bounds if the start of selection is in it
        if (x.start < start && start < x.end) {
          const b = source.getCaretPosition(start - x.start, 'right')
          bounds.left = b.left
        }

        // cut the end of the bounds if the end of selection is in it
        if (x.start < end && end < x.end) {
          const b = source.getCaretPosition(end - x.start, 'left')
          bounds.right = b.right
        }

        return {
          start: x.start,
          end: x.end,
          bounds,
          source,
        }
      })
  }

  // TODO: Create getCaretHighlights which handles the caret position when
  //  it is at the end of a line and there is no whitespace at it, thus the
  //  caret is never touching the right side of the last atomic element.

  /**
   * Return where the caret should be placed at the given offset.
   *
   * The caret may be positioned between inlines, so it may have two possible
   * caret positions. Considering the inline at `index`, the caret may be on
   * the left side of the inline `index` or on the right side of the inline
   * `index - 1`. Both positions are returned.
   *
   * The exception is when the caret is at the start or end of the text,
   * thus only one caret position is returned. Also, if the caret is within
   * a text node, then only one caret position is returned.
   *
   * If the offset is out of the text, then an error is thrown.
   *
   * @param offset
   */
  getCaretHighlight(offset: number): ICaretHighlight {
    if (offset < 0 || offset > this.length) {
      throw new Error('Offset is out of the text ' + offset)
    }

    if (!this.length) {
      const bounds = this.root.getBoundingClientRect()
      return {
        offset: 0,
        x: bounds.left,
        top: bounds.top,
        bottom: bounds.bottom,
        source: this.root,
      }
    }

    if (offset === this.length) {
      // last fragment
      const fragment = this.fragments[this.fragments.length - 1]

      return this.getCaretHighlightFromFragment(fragment, offset, 'right', 'right')
    }

    const index = this.fragments.findIndex(x => x.start <= offset && offset < x.end)

    if (index === -1) {
      throw new Error('Offset is out of the text')
    }

    // if it is in the whitespace of the text, and it is the first fragment of
    // the line, then return the bounds of the last fragment of line above
    const fragment = this.fragments[index]
    if (index > 0
      && offset === fragment.start
      && fragment.source instanceof TextNodeLineMeasurements) {
      const lineStart = this.getLineStart(index)
      const char = fragment.source.text[offset - fragment.start]

      if (lineStart === index && /^[ \t\n\r]$/.test(char)) {
        return this.getCaretHighlightFromFragment(this.fragments[index - 1], offset, 'right', 'right')
      }
    }

    return this.getCaretHighlightFromFragment(this.fragments[index], offset, 'left', 'left')
  }

  private getCaretHighlightFromFragment(
    node: ILineFragment,
    offset: number,
    side: 'left' | 'right',
    boundProperty: 'left' | 'right',
  ): ICaretHighlight {
    const bounds = node.source instanceof TextNodeLineMeasurements
      ? node.source.getCaretPosition(offset - node.start, side)
      : node.clientBounds

    return {
      offset,
      bottom: bounds.bottom,
      top: bounds.top,
      x: bounds[boundProperty],
      source: node.source,
    }
  }

  /**
   * Return the offset of the given node. If the node is not found, then an
   * error is thrown.
   *
   * @param node
   */
  getNodeOffset(node: Node): number {
    if (node === this.root) {
      return 0
    }

    const index = this.nodes.findIndex(x => x.node === node)
    if (index === -1) {
      throw new Error('Node not found')
    }

    return this.nodes[index].offset
  }
}

export class ParagraphMeasurements extends AbstractParagraphMeasurements {
  isAtomic(element: Element): boolean {
    // if it contains data-rt-atomic, is an image or br
    return element.hasAttribute('data-rt-atomic')
      || element.getAttribute('data-rt-type') === 'atomic'
      || element.tagName === 'IMG'
      || element.tagName === 'BR'
  }

  isSameLine(f1: ILineFragment, f2: ILineFragment): boolean {
    // if they overlap
    return isIntervalIntersection(
      f1.clientBounds.top,
      f1.clientBounds.bottom,
      f2.clientBounds.top,
      f2.clientBounds.bottom,
    )
  }

  isNotInline(element: Element): boolean {
    // not-inline, caret, selection
    return element.hasAttribute('data-rt-not-inline')
      || element.hasAttribute('data-rt-caret')
      || element.hasAttribute('data-rt-selection')
      || element.classList.contains('absolute')
      || element.getAttribute('data-rt-type') === 'ignore'
  }

  getLines() {
    return groupSequenceBy(this.fragments, this.isSameLine)
  }

  getClosestOffsetToXInAtomic(fragment: IAtomicLineFragment, clientX: number, isLastOfLine: boolean): number {
    if (fragment.source instanceof Element && fragment.source.tagName === 'BR') {
      return fragment.start
    }

    const {
      left,
      right,
    } = fragment.clientBounds

    return clientX > (left + right) / 2
      ? fragment.end
      : fragment.start
  }
}
