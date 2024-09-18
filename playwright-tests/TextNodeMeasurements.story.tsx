import React, { useEffect, useRef } from 'react'
import { ITextNodeBounds, TextNodeLineMeasurements, TextNodeMeasurements } from '../util/TextNodeMeasurements'
import { story_paragraph_style } from './StyledParagraphForStory'

export interface IGetLine {
  text: string
  left: number
  right: number
}

export interface IGetBoundsUntil {
  length: number
  text: string
  left: number[]
  right: number[]
}

function getBoundsUtil(
  measurements: TextNodeMeasurements,
  f: (line: TextNodeLineMeasurements, i: number) => ITextNodeBounds,
): IGetBoundsUntil[] {
  return Array
    .from({ length: measurements.getLineCount() }, (_, i) => i)
    .map(x => measurements.getLine(x))
    .map(x => ({
      bounds: Array
        .from({ length: x.length }, (_, i) => i)
        .map(i => f(x, i)),
      offset: x.offsetInText,
      length: x.length,
    }))
    .map<IGetBoundsUntil>(x => ({
      length: x.length,
      text: measurements.text.wholeText.slice(x.offset, x.offset + x.length),
      left: x.bounds.map(b => b.left),
      right: x.bounds.map(b => b.right),
    }))
}

// @ts-ignore
const TextNodeMeasurementsStory: React.FC<React.PropsWithChildren<{
  getLineIndexes?: (indexes: number[]) => void
  getLineRanges?: (ranges: [ number, number ][]) => void
  getClientRectsForRange?: {
    start: number
    end: number
    callback: (bounds: ITextNodeBounds[]) => void
  }
  getLines?: (lines: IGetLine[]) => void
  getCaretPositions?: (left: number[], right: number[]) => void
  getBoundsUntilEnd?: (bounds: IGetBoundsUntil[]) => void
  getBoundsUntilStart?: (bounds: IGetBoundsUntil[]) => void
  marginLeft?: number
}>> = props => {
  const ref = useRef<HTMLSpanElement>(null)

  const {
    getLineIndexes,
    getLineRanges,
    getLines,
    getCaretPositions,
    getBoundsUntilStart,
    getBoundsUntilEnd,
  } = props

  useEffect(() => {
    const measurements = new TextNodeMeasurements(ref.current!.firstChild as Text)

    if (getLineIndexes) {
      const indexes: number[] = []
      for (let i = 0; i < measurements.length; i++) {
        indexes.push(measurements.getLineIndex(i))
      }

      getLineIndexes(indexes)
    }

    if (getLineRanges) {
      const ranges: [ number, number ][] = []
      const count = measurements.getLineCount()
      for (let i = 0; i < count; i++) {
        ranges.push(measurements.getLineRange(i))
      }

      getLineRanges(ranges)
    }

    if (props.getClientRectsForRange) {
      const { start, end, callback } = props.getClientRectsForRange
      const container = measurements.text.parentElement!.getBoundingClientRect()
      callback(measurements
        .getClientRectsForRange(start, end)
        .map(bounds => ({
          top: bounds.top - container.top,
          bottom: bounds.bottom - container.top,
          left: bounds.left - container.left,
          right: bounds.right - container.left,
        })))
    }

    if (getLines) {
      const count = measurements.getLineCount()
      const lines = Array
        .from({ length: count }, (_, i) => i)
        .map(i => measurements.getLine(i))
        .map<IGetLine>(x => ({
          text: measurements.text.wholeText.slice(x.offsetInText, x.offsetInText + x.length),
          left: x.bounds.left,
          right: x.bounds.right,
        }))

      getLines(lines)
    }

    if (getCaretPositions) {
      const carets = Array
        .from({ length: measurements.length }, (_, i) => i)
        .map(i => ({
          left: measurements.getCaretPosition(i, 'left'),
          right: measurements.getCaretPosition(i, 'right'),
        }))

      getCaretPositions(
        carets.map(c => c.left.left),
        carets.map(c => c.right.left),
      )
    }

    if (getBoundsUntilStart) {
      const bounds = getBoundsUtil(measurements, (line, i) => line.getBoundsUntilStart(i))

      getBoundsUntilStart(bounds)
    }

    if (getBoundsUntilEnd) {
      const bounds = getBoundsUtil(measurements, (line, i) => line.getBoundsUntilEnd(i))

      getBoundsUntilEnd(bounds)
    }
  }, [
    getLineIndexes,
    getLineRanges,
    getLines,
    getCaretPositions,
    props.getClientRectsForRange,
    getBoundsUntilStart,
    getBoundsUntilEnd,
  ])

  return (
    <p
      style={{
        ...story_paragraph_style,
        width: 150,
      }}
    >
      {
        !!props.marginLeft && (
          <span style={{ width: props.marginLeft, display: 'inline-block' }} />
        )
      }

      <span ref={ref}>
        {props.children}
      </span>
    </p>
  )
}

export default TextNodeMeasurementsStory
