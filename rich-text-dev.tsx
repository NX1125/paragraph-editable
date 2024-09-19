import { NextPage } from 'next'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  ICaretHighlight,
  ISelectionHighlight,
  ParagraphMeasurements,
} from './ParagraphMeasurements'
import styles from './rich-text-dev.module.scss'
import { story_paragraph_style } from './playwright-tests/StyledParagraphForStory'
import {
  ParagraphMeasurementStoryContent,
  toText,
} from './playwright-tests/ParagraphMeasurements.story'

const CopyablePre: React.FC<React.PropsWithChildren<{
  className?: string
  data?: any
}>> = props => (
  <pre
    className={`cursor-pointer ${props.className || ''}`}
    onClick={e => {
      // copy to clipboard
      const text = e.currentTarget.textContent || JSON.stringify(props.data)
      navigator.clipboard.writeText(text)
    }}
  >{props.children}</pre>
)

const RichTextDevPage: NextPage = () => {
  const [ texts, setTexts ] = useState<string[]>()
  const [ lines, setLines ] = useState<string[][]>()

  const ref = useRef<HTMLParagraphElement>(null)

  const [ focus, setFocus ] = useState(0)
  const [ anchor, setAnchor ] = useState(0)

  const [ selectionView, setSelectionView ] = useState<{
    highlights: ISelectionHighlight[]
    container: DOMRect
    caret: ICaretHighlight
  }>()

  const refreshSelectionView = useCallback(() => {
    const measurements = new ParagraphMeasurements(ref.current!)

    const start = Math.min(focus, anchor)
    const end = Math.max(focus, anchor)

    const highlights = measurements.getSelectionHighlights(start, end)

    setSelectionView({
      highlights,
      caret: measurements.getCaretHighlight(focus),
      container: ref.current!.getBoundingClientRect(),
    })
  }, [ anchor, focus ])

  useEffect(() => {
    const measurements = new ParagraphMeasurements(ref.current!)

    setTexts(measurements.inlines.map(toText))
    setLines(measurements
      .getLines()
      .map(xs => xs.map(toText)))
  }, [])

  useEffect(() => {
    refreshSelectionView()
  }, [ refreshSelectionView ])

  useEffect(() => {
    // refresh when there is a change in the DOM structure
    const observer = new MutationObserver(() => {
      refreshSelectionView()
    })

    observer.observe(ref.current!, {
      childList: true,
      subtree: true,
    })

    return () => {
      observer.disconnect()
    }
  }, [ refreshSelectionView ])

  const [ simulatedPositionClick, setSimulatedPositionClick ] = useState<{
    x: number
    y: number
    offset: number
  }>()

  const [ customBounds, setCustomBounds ] = useState<{
    top: number
    left: number
    bottom: number
    right: number
  }[]>([])

  const [ movementMsg, setMovementMsg ] = useState('')

  function getMeasurements() {
    return new ParagraphMeasurements(ref.current!)
  }

  const caret = selectionView?.caret

  const wholeText = texts?.join('') || ''

  const [ horizontalPagination, setHorizontalPagination ] = useState<{
    offset: number
    home: number
    end: number
  }[]>([])

  const [ isSelectLineOnClick, setIsSelectLineOnClick ] = useState(false)

  return (
    <div
      className="p-5 bg-neutral-800 text-neutral-300"
    >
      <form
        onSubmit={e => {
          e.preventDefault()

          const xInput = document.getElementById('x') as HTMLInputElement
          const yInput = document.getElementById('y') as HTMLInputElement
          const measurements = new ParagraphMeasurements(ref.current!)
          const container = ref.current!.getBoundingClientRect()

          const x = +(xInput.value)
          const y = +(yInput.value)

          const offset = measurements.getClosestOffsetToClientPoint(
            x + container.left,
            y + container.top,
          )

          setSimulatedPositionClick({
            x,
            y,
            offset,
          })

          setFocus(offset)
        }}
      >
        Simulate click:
        <input
          type="number"
          id="x"
          step={0.1}
        />
        <input
          type="number"
          id="y"
          step={0.1}
        />

        <button type="submit">
          Click
        </button>
      </form>

      <p>
        TOP, LEFT, BOTTOM, RIGHT
      </p>
      <textarea
        name="bounds"
        id="bounds"
        cols={20}
        rows={4}
        onChange={e => {
          // each line should be 4 numbers separated by commas or space
          // top, left, bottom, right
          const lines = e.target.value
            .split('\n')
            .filter(x => x.trim())
            .map(x => x.split(/,|\s/).map(x => +(x.trim())))
            .filter(x => x.length === 4 && x.every(x => !isNaN(x)))
            /* eslint-disable */
            .map(([ top, left, bottom, right ]) => ({
              top,
              left,
              bottom,
              right,
            }))

          console.log(lines)

          setCustomBounds(lines)
        }}
      />

      <input
        type="checkbox"
        id="select-line-on-click"
        checked={isSelectLineOnClick}
        onChange={e => {
          setIsSelectLineOnClick(e.target.checked)
        }}
      />
      <label htmlFor="select-line-on-click">
        Select line on click
      </label>

      <p
        ref={ref}
        style={{
          ...story_paragraph_style,
          width: 384,
          padding: 16,
        }}
        className="text-neutral-400 relative select-none cursor-text"
        onMouseDown={e => {
          const measurements = new ParagraphMeasurements(ref.current!)
          const offset = measurements.getClosestOffsetToClientPoint(e.clientX, e.clientY)

          if (isSelectLineOnClick) {
            const home = measurements.moveToLineHome(offset)
            const end = measurements.moveToLineEnd(offset)

            setHorizontalPagination([
              { offset, home, end },
              ...horizontalPagination,
            ])

            setFocus(home)
            setAnchor(end)

            return
          }

          setFocus(offset)
          if (!e.shiftKey) {
            setAnchor(offset)
          }
        }}
        onMouseMove={e => {
          if (e.buttons !== 1) {
            return
          }

          if (isSelectLineOnClick) {
            return
          }

          const measurements = new ParagraphMeasurements(ref.current!)
          const offset = measurements.getClosestOffsetToClientPoint(e.clientX, e.clientY)
          setFocus(offset)
          const container = ref.current!.getBoundingClientRect()

          if (e.shiftKey)
            console.debug(`click at (${e.clientX - container.x}, ${e.clientY - container.y}) to get ${offset}`)
        }}
        onMouseUp={e => {
          if (isSelectLineOnClick) {
            return
          }

          const measurements = new ParagraphMeasurements(ref.current!)
          const offset = measurements.getClosestOffsetToClientPoint(e.clientX, e.clientY)
          setFocus(offset)
          const container = ref.current!.getBoundingClientRect()

          setSimulatedPositionClick({
            x: e.clientX - container.x,
            y: e.clientY - container.y,
            offset,
          })

          setFocus(offset)
        }}
      >
        {
          selectionView && selectionView.highlights.map((highlight, index) => (
            <div
              key={index}
              className={`rt-selection-highlight absolute bg-blue-500 opacity-50 ${styles.focus_target}`}
              style={{
                top: highlight.bounds.top - selectionView.container.y,
                left: highlight.bounds.left - selectionView.container.x,
                width: Math.max(1, highlight.bounds.right - highlight.bounds.left),
                height: highlight.bounds.bottom - highlight.bounds.top,
              }}
              data-start={highlight.start}
              data-end={highlight.end}
              data-focus={true}
            />
          ))
        }

        {
          caret && (
            <div
              className={`rt-cursor-highlight absolute bg-gray-500 w-0.5 ${styles.focus_target}`}
              style={{
                top: caret.top - selectionView!.container.y,
                left: caret.x - selectionView!.container.x,
                height: caret.bottom - caret.top,
              }}
            />
          )
        }

        {
          // draw cross
          simulatedPositionClick && (
            <>
              <div
                className="absolute bg-red-500 w-0.5 h-full top-0"
                style={{
                  left: simulatedPositionClick.x,
                }}
              />
              <div
                className="absolute bg-red-500 h-0.5 w-full left-0"
                style={{
                  top: simulatedPositionClick.y,
                }}
              />
            </>
          )
        }

        {
          customBounds.map((bounds, index) => (
            <div
              key={index}
              className="absolute bg-red-500 opacity-50"
              style={{
                top: bounds.top,
                left: bounds.left,
                width: bounds.right - bounds.left,
                height: bounds.bottom - bounds.top,
              }}
            />
          ))
        }

        <ParagraphMeasurementStoryContent />

        {' And '}

        <i
          className="bi bi-star"
          data-rt-type="atomic"
        />

        Some text after the icon. And some more here.

        <i
          className="bi bi-star"
          data-rt-type="atomic"
        />

        {' And break the line'}
      </p>

      {
        simulatedPositionClick && (
          <CopyablePre>
            click at ({simulatedPositionClick.x}, {simulatedPositionClick.y}) to get {simulatedPositionClick.offset}
          </CopyablePre>
        )
      }

      <button
        onClick={() => {
          const measurements = getMeasurements()
          const left = measurements.moveLeft(focus)

          if (left >= 0)
            setFocus(left)
          setMovementMsg(`from ${focus} to ${left}`)
        }}
      >
        Move left
      </button>

      <button
        onClick={() => {
          const measurements = getMeasurements()
          const right = measurements.moveRight(focus)

          if (right >= 0)
            setFocus(right)
          setMovementMsg(`from ${focus} to ${right}`)
        }}
      >
        Move right
      </button>

      <button
        onClick={() => {
          if (!selectionView?.caret)
            return

          const measurements = getMeasurements()
          const up = measurements.moveUp(focus, selectionView.caret.x)
          const container = ref.current!.getBoundingClientRect()

          if (up >= 0)
            setFocus(up)
          setMovementMsg(`from ${focus} to ${up} with x = ${selectionView.caret.x - container.x}`)
        }}
      >
        UP
      </button>

      <button
        onClick={() => {
          if (!selectionView?.caret)
            return

          const measurements = getMeasurements()
          const down = measurements.moveDown(focus, selectionView.caret.x)
          const container = ref.current!.getBoundingClientRect()

          if (down >= 0)
            setFocus(down)
          setMovementMsg(`from ${focus} to ${down} with x = ${selectionView.caret.x - container.x}`)
        }}
      >
        DOWN
      </button>

      <button
        onClick={() => {
          const measurements = getMeasurements()
          const home = measurements.moveToLineHome(focus)

          if (home >= 0)
            setFocus(home)
          setMovementMsg(`from ${focus} to ${home}`)
        }}
      >
        HOME
      </button>

      <button
        onClick={() => {
          const measurements = getMeasurements()
          const end = measurements.moveToLineEnd(focus)

          if (end >= 0)
            setFocus(end)
          setMovementMsg(`from ${focus} to ${end}`)
        }}
      >
        END
      </button>

      <CopyablePre>
        {movementMsg}
      </CopyablePre>

      <hr />

      Caret
      {
        caret && (() => {
          const c = selectionView!.container
          const x = caret.x - c.x
          const top = caret.top - c.y
          const bottom = caret.bottom - c.y

          return (
            <CopyablePre>
              {`test('at ${focus} with ${x} ${top} ${bottom}', async ({ mount }) => {
  await expectHighlight(mount, ${focus}, ${x}, ${top}, ${bottom})
})`}
            </CopyablePre>
          )
        })()
      }

      <hr />

      <input
        type="number"
        value={focus}
        onChange={e => setFocus(+(e.target.value || 0))}
      />

      <pre>({anchor}, {focus})</pre>

      <pre>{JSON.stringify(wholeText.substring(0, focus).slice(-40))}</pre>
      {
        focus < wholeText.length && (
          <pre>{JSON.stringify(wholeText.substring(focus, focus + 4))}</pre>
        )
      }

      <hr />
      <CopyablePre>{horizontalPagination.map(x => `// home of ${x.offset} is ${x.home}`).join('\n')}</CopyablePre>
      <hr />
      <CopyablePre>{horizontalPagination.map(x => `// end of ${x.offset} is ${x.end}`).join('\n')}</CopyablePre>

      <pre>{JSON.stringify(lines, undefined, 2)}</pre>
      <pre>{JSON.stringify(texts, undefined, 2)}</pre>
    </div>
  )
}

export default RichTextDevPage
