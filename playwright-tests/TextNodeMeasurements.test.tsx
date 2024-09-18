import { test } from '@playwright/experimental-ct-react'
import { expect } from './fixtures'
import TextNodeMeasurementsStory, { IGetBoundsUntil, IGetLine } from './TextNodeMeasurements.story'
import { ITextNodeBounds } from '../util/TextNodeMeasurements'

test.describe('line indexes', () => {
  test('should return correct line indexes', async ({ mount }) => {
    let lines: number[] = []

    const r = await mount((
      <TextNodeMeasurementsStory
        getLineIndexes={indexes => {
          lines = indexes
        }}
      >
        Enough text to break a line. More text to break a line.
      </TextNodeMeasurementsStory>
    ))

    await r.waitFor()

    expect(lines).toEqual([
      ...Array.from('Enough text to break ', () => 0),
      ...Array.from('a line. More text to ', () => 1),
      ...Array.from('break a line.', () => 2),
    ])
  })

  test('should return correct line indexes with margin', async ({ mount }) => {
    let lines: number[] = []

    const r = await mount((
      <TextNodeMeasurementsStory
        getLineIndexes={indexes => {
          lines = indexes
        }}
        marginLeft={110}
      >
        Enough text to break a line. More text to break a line.
      </TextNodeMeasurementsStory>
    ))

    await r.waitFor()

    expect(lines).toEqual([
      ...Array.from('Enough text to break ', () => 0),
      ...Array.from('a line. More text to ', () => 1),
      ...Array.from('break a line.', () => 2),
    ])
  })

  test('with whitespace at first char', async ({ mount }) => {
    let lines: number[] = []

    const r = await mount((
      <TextNodeMeasurementsStory
        getLineIndexes={indexes => {
          lines = indexes
        }}
      >
        {' Enough text to break a line. More text to break a line.'}
      </TextNodeMeasurementsStory>
    ))

    await r.waitFor()

    expect(lines).toEqual([
      ...Array.from(' Enough text to break ', () => 0),
      ...Array.from('a line. More text to ', () => 1),
      ...Array.from('break a line.', () => 2),
    ])
  })

  test('with multiple whitespaces', async ({ mount, browserName }) => {
    test.skip(browserName === 'webkit', 'WebKit does not behave nicely compared to other browsers')

    let lines: number[] = []

    const r = await mount((
      <TextNodeMeasurementsStory
        getLineIndexes={indexes => {
          lines = indexes
        }}
      >
        {'Enough text to break a line  . More text to break a line.'}
      </TextNodeMeasurementsStory>
    ))

    await r.waitFor()

    expect(lines).toEqual([
      ...Array.from('Enough text to break ', () => 0),
      ...Array.from('a line  . More text to ', () => 1),
      ...Array.from('break a line.', () => 2),
    ])
  })

  test('with multiple whitespaces at line break', async ({ mount }) => {
    let lines: number[] = []

    const r = await mount((
      <TextNodeMeasurementsStory
        getLineIndexes={indexes => {
          lines = indexes
        }}
      >
        {'Enough text to break    a line. More text to break a line.'}
      </TextNodeMeasurementsStory>
    ))

    await r.waitFor()

    expect(lines).toEqual([
      ...Array.from('Enough text to break    ', () => 0),
      ...Array.from('a line. More text to ', () => 1),
      ...Array.from('break a line.', () => 2),
    ])
  })
})

test.describe('line ranges', () => {
  test('should return correct line ranges', async ({ mount }) => {
    let ranges: [ number, number ][] = []

    const text = 'Enough text to break a line. More text to break a line.'
    const r = await mount((
      <TextNodeMeasurementsStory
        getLineRanges={r => {
          ranges = r
        }}
      >
        {text}
      </TextNodeMeasurementsStory>
    ))

    await r.waitFor()

    expect(ranges.map(([ a, b ]) => text.slice(a, b))).toEqual([
      'Enough text to break ',
      'a line. More text to ',
      'break a line.',
    ])
  })
})

test.describe('getClientRectsForRange', () => {
  const text = 'Some random text enough to break this text into multiple lines, at least 5 of them are needed for tests.'

  test('should return correct client rects for range', async ({ mount }) => {
    let bounds: ITextNodeBounds[] = []

    const r = await mount((
      <TextNodeMeasurementsStory
        getClientRectsForRange={{
          start: 'Some random text enough to'.length,
          end: 'Some random text enough to break '.length,
          callback: rects => {
            bounds = rects
          },
        }}
      >
        {text}
      </TextNodeMeasurementsStory>
    ))

    await r.waitFor()

    expect(bounds.length).toBe(1)
    expect(bounds[0].left).toBeCloseTo2(71.1, 1)
    expect(bounds[0].right).toBeCloseTo2(120.0, 1)
    expect(bounds[0].top).toBeCloseTo2(27, 3)
    expect(bounds[0].bottom).toBeCloseTo2(44, 3)
  })

  test('should get client rects starting at line', async ({ mount }) => {
    let bounds: ITextNodeBounds[] = []

    const r = await mount((
      <TextNodeMeasurementsStory
        getClientRectsForRange={{
          start: 'Some random text '.length,
          end: 'Some random text enough to break '.length,
          callback: rects => {
            bounds = rects
          },
        }}
      >
        {text}
      </TextNodeMeasurementsStory>
    ))

    await r.waitFor()

    expect(bounds.length).toBe(1)
    expect(bounds[0].left).toBeCloseTo2(0, 1)
    expect(bounds[0].right).toBeCloseTo2(120.0, 1)
    expect(bounds[0].top).toBeCloseTo2(27, 3)
    expect(bounds[0].bottom).toBeCloseTo2(44, 3)
  })
})

test('getLines', async ({ mount }) => {
  let lines: IGetLine[] = []
  const text = 'Enough text to break a line. More text to break a line.'

  const r = await mount((
    <TextNodeMeasurementsStory
      getLines={l => {
        lines = l
      }}
    >
      {text}
    </TextNodeMeasurementsStory>
  ))

  await r.waitFor()

  expect(lines.map(x => x.text)).toEqual([
    'Enough text to break ',
    'a line. More text to ',
    'break a line.',
  ])

  expect(lines.map(x => x.left)).toEqual([ 8, 8, 8 ])

  expect(lines[0].right).toBeCloseTo2(155.65625, 3)
  expect(lines[1].right).toBeCloseTo2(139.625, 3)
  expect(lines[2].right).toBeCloseTo2(95.171875, 3)
})

test.describe('get bounds until', () => {
  function expectArrayCloseTo(line: number[], left: number, tol=1) {
    for (const x of line) {
      expect(x).toBeCloseTo2(left, tol)
    }
  }

  function expectArrayCloseToArray(line: number[], xs: number[], tolerance = 3) {
    for (let i = 0; i < line.length; i++) {
      expect(line[i]).toBeCloseTo2(xs[i], tolerance)
    }
  }

  const xs = [
    [
      24,
      34.671875,
      43.578125,
      52.46875,
      61.375,
      70.265625,
      79.171875,
      83.609375,
      88.0625,
      96.953125,
      104.953125,
      109.40625,
      113.84375,
      118.296875,
      127.1875,
    ],
    [
      8,
      16.90625,
      22.234375,
      31.125,
      40.03125,
      48.03125,
      52.46875,
      61.375,
      65.8125,
      69.375,
      72.921875,
      81.828125,
      90.71875,
      95.171875,
      99.609375,
      112.9375,
      121.84375,
      127.171875,
      136.0625,
    ],
    [
      8,
      12.453125,
      21.34375,
      29.34375,
      33.796875,
      38.234375,
      42.6875,
      51.578125,
      56.03125,
      64.921875,
      70.25,
      79.15625,
      88.046875,
      96.046875,
      100.5,
      109.390625,
      113.84375,
      117.390625,
      120.953125,
      129.84375,
      138.75,
    ],
  ]
  const text = 'Enough text to break a line. More text to break a line.'

  test('getBoundsUntilStart', async ({ mount }) => {
    let bounds: IGetBoundsUntil[] = []

    const r = await mount((
      <TextNodeMeasurementsStory
        marginLeft={16}
        getBoundsUntilStart={b => {
          bounds = b
        }}
      >
        {text}
      </TextNodeMeasurementsStory>
    ))

    await r.waitFor()

    expect(bounds.map(x => x.text)).toEqual([
      'Enough text to ',
      'break a line. More ',
      'text to break a line.',
    ])

    expectArrayCloseTo(bounds[0].left, 24)
    expectArrayCloseTo(bounds[1].left, 8)
    expectArrayCloseTo(bounds[2].left, 8)

    expectArrayCloseToArray(bounds[0].right, xs[0])
    expectArrayCloseToArray(bounds[1].right, xs[1])
    expectArrayCloseToArray(bounds[2].right, xs[2])
  })

  test('getBoundsUntilEnd', async ({ mount }) => {
    let bounds: IGetBoundsUntil[] = []

    const r = await mount((
      <TextNodeMeasurementsStory
        marginLeft={16}
        getBoundsUntilEnd={b => {
          bounds = b
        }}
      >
        {text}
      </TextNodeMeasurementsStory>
    ))

    await r.waitFor()

    expect(bounds.map(x => x.text)).toEqual([
      'Enough text to ',
      'break a line. More ',
      'text to break a line.',
    ])

    expectArrayCloseTo(bounds[0].right, 127)
    expectArrayCloseTo(bounds[1].right, 136)
    expectArrayCloseTo(bounds[2].right, 143, 4)

    expectArrayCloseToArray(bounds[0].left, xs[0])
    expectArrayCloseToArray(bounds[1].left, xs[1])
    expectArrayCloseToArray(bounds[2].left, xs[2])
  })
})
