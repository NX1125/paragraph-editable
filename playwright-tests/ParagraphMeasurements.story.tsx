import React, { useEffect, useRef } from 'react'
import {
  ICaretHighlight,
  IInlineFragment,
  ILineFragment,
  ParagraphMeasurements,
} from '../ParagraphMeasurements'
import { TextNodeLineMeasurements, TextNodeMeasurements } from '../util/TextNodeMeasurements'
import { story_paragraph_style } from './StyledParagraphForStory'

export function toText(x: ILineFragment | IInlineFragment): string {
  return x.source instanceof TextNodeLineMeasurements
    ? x.source.getText()
    : x.source instanceof TextNodeMeasurements
      ? x.source.text.data
      : '@'
}

export const ParagraphMeasurementStoryContent: React.FC = () => (
  <>
    Some text in <i>italic</i> and <b>bold</b> and <u>underline</u> and <s>strikethrough</s>.<br />
    And some colored text:{' '}
    <span style={{ color: 'red' }}>red</span>{', '}
    <span style={{ color: 'green' }}>green</span>{', '}
    <span style={{ color: 'violet' }}>violet</span>{'. '}

    <span className="text-blue-500">Lorem ipsum dolor sit amet, consectetur adipiscing elit</span>.
    Sed non nisi sit amet nisi fringilla tincidunt.{' '}
    <strong style={{ fontWeight: 'bold' }}>
      Vivamus <i>quis</i> <b>libero <i>ac</i> felis</b> viverra ultricies.
    </strong>
    {` Pellentesque ut nulla vel ante pharetra varius. `}
    Aliquam id eros eget risus rutrum feugiat.
    Sed sed porta ligula.
    Vestibulum fringilla in erat vitae molestie.{' '}
    <span data-rt-atomic={true}>ATOMIC</span>{' '}
    Quisque in libero nibh.
    Fusce efficitur justo vitae ullamcorper efficitur.
  </>
)

export const ParagraphMeasurementsStory: React.FC<React.PropsWithChildren<{
  getInlines?: (texts: string[]) => void
  getLines?: (lines: string[][]) => void

  getPositionAt?: {
    clientX: number
    clientY: number

    callback: (offset: number) => void
  }

  getHorizontalMovement?: {
    offset: number
    direction: 'left' | 'right' | 'home' | 'end'
    callback: (offset: number) => void
  }

  getVerticalMovement?: {
    offset: number
    clientX: number
    direction: 'up' | 'down'
    callback: (offset: number) => void
  }

  getCaretHighlight?: {
    offset: number
    callback: (bounds: ICaretHighlight) => void
  }
}>> = props => {
  const ref = useRef<HTMLParagraphElement>(null)

  const {
    getInlines,
    getLines,
    getPositionAt,
  } = props

  useEffect(() => {
    const measurements = new ParagraphMeasurements(ref.current!)
    const container = ref.current!.getBoundingClientRect()

    if (getInlines) {
      console.log('inlines', measurements.inlines, measurements.inlines.map(toText))
      getInlines(measurements.inlines.map(toText))
    }

    if (getLines)
      getLines(measurements
        .getLines()
        .map(xs => xs.map(toText)))

    if (getPositionAt)
      getPositionAt.callback(
        measurements.getClosestOffsetToClientPoint(
          getPositionAt.clientX + container.left,
          getPositionAt.clientY + container.top,
        ),
      )

    if (props.getHorizontalMovement) {
      const {
        offset,
        callback,
      } = props.getHorizontalMovement
      switch (props.getHorizontalMovement.direction) {
        case 'left':
          callback(measurements.moveLeft(offset))
          break

        case 'right':
          callback(measurements.moveRight(offset))
          break

        case 'home':
          callback(measurements.moveToLineHome(offset))
          break

        case 'end':
          callback(measurements.moveToLineEnd(offset))
          break
      }
    }

    if (props.getVerticalMovement) {
      const x = props.getVerticalMovement.clientX + container.left
      props.getVerticalMovement.callback(
        props.getVerticalMovement.direction === 'up'
          ? measurements.moveUp(props.getVerticalMovement.offset, x)
          : measurements.moveDown(props.getVerticalMovement.offset, x),
      )
    }

    if (props.getCaretHighlight) {
      const caret = measurements.getCaretHighlight(props.getCaretHighlight.offset)

      caret.x -= container.left
      caret.top -= container.top
      caret.bottom -= container.top

      props.getCaretHighlight.callback(caret)
    }
  }, [
    getLines,
    getInlines,
    getPositionAt,
    props.getHorizontalMovement,
    props.getVerticalMovement,
    props.getCaretHighlight,
  ])

  return (
    <div
      style={{
        position: 'relative',
      }}
    >
      <p
        ref={ref}
        style={{
          ...story_paragraph_style,
          width: 384,
          padding: 16,
        }}
      >
        <ParagraphMeasurementStoryContent />
        {props.children}
      </p>

      {
        props.getPositionAt && (
          <>
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: props.getPositionAt.clientX,
                width: 1,
                height: '100%',
                backgroundColor: 'red',
              }}
            />

            <div
              style={{
                position: 'absolute',
                top: props.getPositionAt.clientY,
                left: 0,
                width: '100%',
                height: 1,
                backgroundColor: 'red',
              }}
            />
          </>
        )
      }
    </div>
  )
}
