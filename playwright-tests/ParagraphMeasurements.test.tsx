import { test } from '@playwright/experimental-ct-react'
import { expect } from './fixtures'
import { ParagraphMeasurementsStory } from './ParagraphMeasurements.story'
import React from 'react'
import { ICaretHighlight } from '@/src/content-editable/ParagraphMeasurements'

test('should get inline texts', async ({ mount }) => {
  let inlines: string[] = undefined!
  const r = await mount((
    <ParagraphMeasurementsStory
      getInlines={e => {
        inlines = e
      }}
    />
  ))

  await r.waitFor()

  expect(inlines).toEqual([
    "Some text in ",
    "italic",
    " and ",
    "bold",
    " and ",
    "underline",
    " and ",
    "strikethrough",
    ".",
    "@",
    "And some colored text:",
    " ",
    "red",
    ", ",
    "green",
    ", ",
    "violet",
    ". ",
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit",
    ". Sed non nisi sit amet nisi fringilla tincidunt.",
    " ",
    "Vivamus ",
    "quis",
    " ",
    "libero ",
    "ac",
    " felis",
    " viverra ultricies.",
    " Pellentesque ut nulla vel ante pharetra varius. ",
    "Aliquam id eros eget risus rutrum feugiat. Sed sed porta ligula. Vestibulum fringilla in erat vitae molestie.",
    " ",
    "@",
    " ",
    "Quisque in libero nibh. Fusce efficitur justo vitae ullamcorper efficitur.",
  ])
})

test('should get line fragments', async ({ mount }) => {
  let lines: string[][] = undefined!
  const r = await mount((
    <ParagraphMeasurementsStory
      getLines={e => {
        lines = e
      }}
    />
  ))

  await r.waitFor()

  expect(lines).toEqual([
    [
      "Some text in ",
      "italic",
      " and ",
      "bold",
      " and ",
      "underline",
      " and ",
    ],
    [
      "strikethrough",
      ".",
      "@",
    ],
    [
      "And some colored text:",
      " ",
      "red",
      ", ",
      "green",
      ", ",
      "violet",
      ". ",
      "Lorem ",
    ],
    [
      "ipsum dolor sit amet, consectetur adipiscing elit",
      ". ",
    ],
    [
      "Sed non nisi sit amet nisi fringilla tincidunt.",
      "@",
    ],
    [
      "Vivamus ",
      "quis",
      " ",
      "libero ",
      "ac",
      " felis",
      " viverra ultricies.",
    ],
    [
      " Pellentesque ut nulla vel ante pharetra varius. ",
    ],
    [
      "Aliquam id eros eget risus rutrum feugiat. Sed ",
    ],
    [
      "sed porta ligula. Vestibulum fringilla in erat vitae ",
    ],
    [
      "molestie.",
      " ",
      "@",
      " ",
      "Quisque in libero nibh. Fusce ",
    ],
    [
      "efficitur justo vitae ullamcorper efficitur.",
    ],
  ])
})

const starIcon = (
  <i
    style={{
      display: 'inline-block',
      width: 16,
      height: 16,
      background: 'red',
    }}
    data-rt-type="atomic"
  />
)

const moreContent = (
  <React.Fragment>
    {' And '}

    {starIcon}

    Some text after the icon.
  </React.Fragment>
)

const evenMoreContent = (
  <React.Fragment>
    {moreContent}
    {' And some more here.'}

    {starIcon}

    {' And break the line'}
  </React.Fragment>
)

test.describe('caret', () => {
  let browserName: string

  test.beforeAll(async ({ browserName: name }) => {
    browserName = name
  })

  async function expectHighlight(
    mount: any,
    offset: number,
    x: number,
    top: number,
    bottom: number,
    children?: React.ReactNode,
    tol?: number,
    tolY?: number,
  ) {
    let bounds: ICaretHighlight = undefined!

    const r = await mount((
      <ParagraphMeasurementsStory
        getCaretHighlight={{
          offset,
          callback: i => {
            bounds = i
          },
        }}
      >
        {children}
      </ParagraphMeasurementsStory>
    ))

    await r.waitFor()

    if (tol === undefined)
      tol = browserName === 'webkit' ? 2.6 : 1.7
    tolY = tolY ?? browserName === 'chromium' ? 1.7 : 5

    expect(bounds.x).toBeCloseTo2(x, tol)
    expect(bounds.top).toBeCloseTo2(top, tolY)
    expect(bounds.bottom).toBeCloseTo2(bottom, tolY)
  }

  test('at 46 with 343.3125 19 36', async ({ mount }) => {
    await expectHighlight(mount, 46, 343.3125, 19, 36)
  })

  test('at 47 with 16 43 60', async ({ mount }) => {
    await expectHighlight(mount, 47, 16, 43, 60)
  })

  test('at 492 with 291.09375 259 276', async ({ mount }) => {
    await expectHighlight(mount, 492, 291.09375, 259, 276, evenMoreContent)
  })

  test('at 544 with 362.84375 283 300', async ({ mount }) => {
    await expectHighlight(mount, 544, 362.84375, 281, 297, evenMoreContent, 5)
  })

  test('at 497 with 327.578125 259 276', async ({ mount }) => {
    await expectHighlight(mount, 497, 327.578125, 257, 273, evenMoreContent, undefined, 3)
  })

  test('at 498 with 16 283 300', async ({ mount }) => {
    await expectHighlight(mount, 498, 16, 283, 300, evenMoreContent)
  })

  test('at 545 with 16 307 324', async ({ mount }) => {
    await expectHighlight(mount, 545, 16, 307, 324, evenMoreContent)
  })

  test('at 447 with 356.046875 235 252', async ({ mount }) => {
    await expectHighlight(mount, 447, 356.046875, 235, 252)
  })

  test('at 209 with 316.59375 115 132', async ({ mount }) => {
    await expectHighlight(mount, 209, 316.59375, 115, 132)
  })

  test('at 210 with 16 139 156', async ({ mount }) => {
    await expectHighlight(mount, 210, 16, 139, 156)
  })

  test('at 496 with 323.125 259 276', async ({ mount }) => {
    await expectHighlight(mount, 496, 323.125, 259, 276, evenMoreContent)
  })
})

test.describe('getPositionAt', () => {
  async function getPositionAt(mount: any, clientX: number, clientY: number, children?: React.ReactNode) {
    let offset: number = undefined!

    const r = await mount((
      <ParagraphMeasurementsStory
        getPositionAt={{
          clientX,
          clientY,
          callback: i => {
            offset = i
          },
        }}
      >
        {children}
      </ParagraphMeasurementsStory>
    ))

    await r.waitFor()

    return offset
  }

  test('should get offset at (46, 200)', async ({ mount }) => {
    expect(await getPositionAt(mount, 46, 200)).toEqual(310)
  })

  test('should get offset at (351, 77)', async ({ mount }) => {
    expect(await getPositionAt(mount, 351, 77)).toEqual(110)
  })

  test('should get offset at (347, 26)', async ({ mount }) => {
    expect(await getPositionAt(mount, 347, 26)).toEqual(46)
  })

  test('should get offset at (8.5, 53.5)', async ({ mount }) => {
    expect(await getPositionAt(mount, 8.5, 53.5)).toEqual(47)
  })

  test('should get offset at (354, 247)', async ({ mount }) => {
    expect(await getPositionAt(mount, 354, 247)).toEqual(447)
  })

  test('should get offset at (99, 247)', async ({ mount }) => {
    expect(await getPositionAt(mount, 99, 247)).toEqual(416)
  })

  test('should get offset at (123, 238)', async ({ mount }) => {
    expect(await getPositionAt(mount, 123, 238)).toEqual(417)
  })

  test('should get offset at (202.5, 98.5)', async ({ mount }) => {
    expect(await getPositionAt(mount, 202.5, 98.5)).toEqual(137)
  })

  test('should get offset at (46, 237)', async ({ mount }) => {
    expect(await getPositionAt(mount, 46, 237)).toEqual(409)
  })

  test('should get offset at (6, 246)', async ({ mount }) => {
    expect(await getPositionAt(mount, 6, 246)).toEqual(406)
  })

  test('should get offset at (148, 128)', async ({ mount }) => {
    expect(await getPositionAt(mount, 148, 128)).toEqual(181)
  })

  test('should get offset at (283, 25)', async ({ mount }) => {
    expect(await getPositionAt(mount, 283, 25)).toEqual(37)
  })

  test('should get offset at (5, 142)', async ({ mount }) => {
    expect(await getPositionAt(mount, 5, 142)).toEqual(210)
  })

  test('click at (303.5, 51.5) to get 62', async ({ mount }) => {
    expect(await getPositionAt(mount, 303.5, 51.5)).toEqual(61)
  })

  test('click at (362.5, 148.5) to get 257', async ({ mount }) => {
    expect(await getPositionAt(mount, 362.5, 148.5)).toEqual(257)
  })

  test('click at (365.5, 154.5) to get 257', async ({ mount }) => {
    expect(await getPositionAt(mount, 365.5, 154.5)).toEqual(257)
  })

  test('click at (9.5, 171.5) to get 258', async ({ mount }) => {
    expect(await getPositionAt(mount, 9.5, 171.5)).toEqual(258)
  })

  test('click at (368.5, 74.5) to get 110', async ({ mount }) => {
    expect(await getPositionAt(mount, 368.5, 74.5)).toEqual(110)
  })

  test('click at (247, 26) to get 33', async ({ mount }) => {
    expect(await getPositionAt(mount, 247, 26)).toEqual(33)
  })

  test('click at (364.5, 77.5) to get 109', async ({ mount }) => {
    expect(await getPositionAt(mount, 364.5, 77.5)).toEqual(110)
  })

  test('click at (320.5, 267.5) to get 493', async ({ mount }) => {
    expect(await getPositionAt(mount, 320.5, 267.5, starIcon)).toEqual(493)
  })

  test('click at (351.5, 271.5) to get 498', async ({ mount }) => {
    expect(await getPositionAt(mount, 351.5, 271.5, moreContent)).toEqual(498)
  })

  test('click at (221.5, 297.5) to get 522', async ({ mount }) => {
    expect(await getPositionAt(mount, 221.5, 297.5, moreContent)).toEqual(523)
  })

  test('click at (373.5, 291.5) to get 544', async ({ mount }) => {
    expect(await getPositionAt(mount, 373.5, 291.5, evenMoreContent)).toEqual(544)
  })

  test('click at (5.5, 315.5) to get 545', async ({ mount }) => {
    expect(await getPositionAt(mount, 5.5, 315.5, evenMoreContent)).toEqual(545)
  })

  // click at (337.5, 129.5) to get 209
  test('click at (337.5, 129.5) to get 209', async ({ mount }) => {
    expect(await getPositionAt(mount, 337.5, 129.5)).toEqual(209)
  })

  // click at (176.5, 313.5) to get 563
  test('click at (176.5, 313.5) to get 563', async ({ mount }) => {
    expect(await getPositionAt(mount, 176.5, 313.5, evenMoreContent)).toEqual(563)
  })
})

async function moveHorizontal(mount: any, offset: number, direction: 'left' | 'right' | 'home' | 'end', children = moreContent) {
  let newOffset: number = undefined!

  const r = await mount((
    <ParagraphMeasurementsStory
      getHorizontalMovement={{
        offset,
        direction,
        callback: i => {
          newOffset = i
        },
      }}
    >
      {children}
    </ParagraphMeasurementsStory>
  ))

  await r.waitFor()

  return newOffset
}

test.describe('arrow movements', () => {
  test.describe('horizontal', () => {
    test.describe('move left', () => {
      // from 327 to 326
      test('from 327 to 326', async ({ mount }) => {
        expect(await moveHorizontal(mount, 327, 'left')).toEqual(326)
      })

      // from 1 to 0
      test('from 1 to 0', async ({ mount }) => {
        expect(await moveHorizontal(mount, 1, 'left')).toEqual(0)
      })

      // from 0 to -1
      test('from 0 to -1', async ({ mount }) => {
        expect(await moveHorizontal(mount, 0, 'left')).toEqual(-1)
      })

      // from 523 to 522
      test('from 523 to 522', async ({ mount }) => {
        expect(await moveHorizontal(mount, 523, 'left')).toEqual(522)
      })
    })

    test.describe('move right', () => {
      // from 496 to 497
      test('from 496 to 497', async ({ mount }) => {
        expect(await moveHorizontal(mount, 496, 'right')).toEqual(497)
      })

      // from 522 to 523
      test('from 522 to 523', async ({ mount }) => {
        expect(await moveHorizontal(mount, 522, 'right')).toEqual(523)
      })

      // from 523 to -1
      test('from 523 to -1', async ({ mount }) => {
        expect(await moveHorizontal(mount, 523, 'right')).toEqual(-1)
      })

      // from 0 to 1
      test('from 0 to 1', async ({ mount }) => {
        expect(await moveHorizontal(mount, 0, 'right')).toEqual(1)
      })
    })
  })

  test.describe('vertical', () => {
    async function move(mount: any, offset: number, direction: 'up' | 'down', x: number) {
      let newOffset: number = undefined!

      const r = await mount((
        <ParagraphMeasurementsStory
          getVerticalMovement={{
            offset,
            direction,
            clientX: x,
            callback: i => {
              newOffset = i
            },
          }}
        >
          {evenMoreContent}
        </ParagraphMeasurementsStory>
      ))

      await r.waitFor()

      return newOffset
    }


    test.describe('move down', () => {
      // from 0 to 47 with x = 16
      test('from 0 to 47 with x = 16', async ({ mount }) => {
        expect(await move(mount, 0, 'down', 16)).toEqual(47)
      })

      // from 47 to 62 with x = 16
      test('from 47 to 62 with x = 16', async ({ mount }) => {
        expect(await move(mount, 47, 'down', 16)).toEqual(62)
      })

      // from 62 to 111 with x = 16
      test('from 62 to 111 with x = 16', async ({ mount }) => {
        expect(await move(mount, 62, 'down', 16)).toEqual(111)
      })

      // from 111 to 162 with x = 16
      test('from 111 to 162 with x = 16', async ({ mount }) => {
        expect(await move(mount, 111, 'down', 16)).toEqual(162)
      })

      //from 111 to 162 with x = 16
      test('from 162 to 210 with x = 16', async ({ mount }) => {
        expect(await move(mount, 162, 'down', 16)).toEqual(210)
      })

      //from 162 to 210 with x = 16
      test('from 210 to 258 with x = 16', async ({ mount }) => {
        expect(await move(mount, 210, 'down', 16)).toEqual(258)
      })

      //from 210 to 258 with x = 16
      test('from 258 to 306 with x = 16', async ({ mount }) => {
        expect(await move(mount, 258, 'down', 16)).toEqual(306)
      })

      // from 258 to 306 with x = 16
      test('from 306 to 353 with x = 16', async ({ mount }) => {
        expect(await move(mount, 306, 'down', 16)).toEqual(353)
      })

      //from 306 to 353 with x = 16
      test('from 353 to 406 with x = 16', async ({ mount }) => {
        expect(await move(mount, 353, 'down', 16)).toEqual(406)
      })

      //from 353 to 406 with x = 16
      test('from 406 to 448 with x = 16', async ({ mount }) => {
        expect(await move(mount, 406, 'down', 16)).toEqual(448)
      })

      //from 406 to 448 with x = 16
      test('from 448 to 498 with x = 16', async ({ mount }) => {
        expect(await move(mount, 448, 'down', 16)).toEqual(498)
      })

      //from 448 to 498 with x = 16
      test('from 498 to 545 with x = 16', async ({ mount }) => {
        expect(await move(mount, 498, 'down', 16)).toEqual(545)
      })

      //from 498 to 545 with x = 16
      test('from 545 to -1 with x = 16', async ({ mount }) => {
        expect(await move(mount, 545, 'down', 16)).toEqual(-1)
      })

      //from 545 to -1 with x = 362.84375
      test('from 545 to -1 with x = 362.84375', async ({ mount }) => {
        expect(await move(mount, 545, 'down', 362.84375)).toEqual(-1)
      })

      //from 9 to 57 with x = 88.03125
      test('from 9 to 58 with x = 88.03125', async ({ mount }) => {
        expect(await move(mount, 9, 'down', 88.03125)).toEqual(58)
      })

      //from 56 to 68 with x = 72.90625
      test('from 56 to 68 with x = 72.90625', async ({ mount }) => {
        expect(await move(mount, 56, 'down', 72.90625)).toEqual(69)
      })

      //from 68 to 117 with x = 65.8125
      test('from 68 to 117 with x = 65.8125', async ({ mount }) => {
        expect(await move(mount, 68, 'down', 65.8125)).toEqual(117)
      })

      //from 117 to 167 with x = 63.125
      test('from 117 to 167 with x = 63.125', async ({ mount }) => {
        expect(await move(mount, 117, 'down', 63.125)).toEqual(168)
      })

      //from 167 to 214 with x = 57.8125
      test('from 167 to 214 with x = 57.8125', async ({ mount }) => {
        expect(await move(mount, 167, 'down', 57.8125)).toEqual(215)
      })

      //from 214 to 262 with x = 48.625
      test('from 214 to 262 with x = 48.625', async ({ mount }) => {
        expect(await move(mount, 214, 'down', 48.625)).toEqual(263)
      })

      // from 368 to 417 with x = 115.625
      test('from 368 to 417 with x = 115.625', async ({ mount }) => {
        expect(await move(mount, 368, 'down', 115.625)).toEqual(417)
      })

      //from 417 to 469 with x = 144.359375
      test('from 417 to 469 with x = 144.359375', async ({ mount }) => {
        expect(await move(mount, 417, 'down', 144.359375)).toEqual(469)
      })

      // from 365 to 416 with x = 94.265625
      test('from 365 to 416 with x = 94.265625', async ({ mount }) => {
        expect(await move(mount, 365, 'down', 94.265625)).toEqual(416)
      })

      // from 34 to 61 with x = 255.25
      test('from 34 to 61 with x = 255.25', async ({ mount }) => {
        expect(await move(mount, 34, 'down', 255.25)).toEqual(61)
      })

      // from 61 to 73 with x = 112.953125
      test('from 61 to 73 with x = 112.953125', async ({ mount }) => {
        expect(await move(mount, 61, 'down', 112.953125)).toEqual(74)
      })

      // from 93 to 142 with x = 239.234375
      test('from 93 to 142 with x = 239.234375', async ({ mount }) => {
        expect(await move(mount, 93, 'down', 239.234375)).toEqual(142)
      })
    })

    test.describe('move up', () => {
      // from 562 to 515 with x = 136.078125
      test('from 562 to 515 with x = 136.078125', async ({ mount }) => {
        expect(await move(mount, 562, 'up', 136.078125)).toEqual(515)
      })

      // from 184 to 133 with x = 168.96875
      test('from 184 to 133 with x = 168.96875', async ({ mount }) => {
        expect(await move(mount, 184, 'up', 168.96875)).toEqual(133)
      })

      // from 141 to 92 with x = 232.09375
      test('from 141 to 92 with x = 232.09375', async ({ mount }) => {
        expect(await move(mount, 141, 'up', 232.09375)).toEqual(92)
      })

      // from 81 to 61 with x = 162.75
      test('from 81 to 61 with x = 162.75', async ({ mount }) => {
        expect(await move(mount, 81, 'up', 162.75)).toEqual(61)
      })

      // from 61 to 14 with x = 112.953125
      test('from 61 to 14 with x = 112.953125', async ({ mount }) => {
        expect(await move(mount, 61, 'up', 112.953125)).toEqual(14)
      })

      // from 12 to -1 with x = 104.9375
      test('from 12 to -1 with x = 104.9375', async ({ mount }) => {
        expect(await move(mount, 12, 'up', 104.9375)).toEqual(-1)
      })

      // from 563 to 516 with x = 144.984375
      test('from 563 to 516 with x = 144.984375', async ({ mount }) => {
        expect(await move(mount, 563, 'up', 144.984375)).toEqual(516)
      })

      // from 545 to 498 with x = 16
      test('from 545 to 498 with x = 16', async ({ mount }) => {
        expect(await move(mount, 545, 'up', 16)).toEqual(498)
      })

      // from 498 to 448 with x = 16
      test('from 498 to 448 with x = 16', async ({ mount }) => {
        expect(await move(mount, 498, 'up', 16)).toEqual(448)
      })

      //from 448 to 406 with x = 16
      test('from 448 to 406 with x = 16', async ({ mount }) => {
        expect(await move(mount, 448, 'up', 16)).toEqual(406)
      })

      //from 406 to 353 with x = 16
      test('from 406 to 353 with x = 16', async ({ mount }) => {
        expect(await move(mount, 406, 'up', 16)).toEqual(353)
      })

      //from 353 to 306 with x = 16
      test('from 353 to 306 with x = 16', async ({ mount }) => {
        expect(await move(mount, 353, 'up', 16)).toEqual(306)
      })

      //from 306 to 258 with x = 16
      test('from 306 to 258 with x = 16', async ({ mount }) => {
        expect(await move(mount, 306, 'up', 16)).toEqual(258)
      })

      //from 258 to 210 with x = 16
      test('from 258 to 210 with x = 16', async ({ mount }) => {
        expect(await move(mount, 258, 'up', 16)).toEqual(210)
      })

      //from 210 to 162 with x = 16
      test('from 210 to 162 with x = 16', async ({ mount }) => {
        expect(await move(mount, 210, 'up', 16)).toEqual(162)
      })

      //from 162 to 111 with x = 16
      test('from 162 to 111 with x = 16', async ({ mount }) => {
        expect(await move(mount, 162, 'up', 16)).toEqual(111)
      })

      //from 111 to 62 with x = 16
      test('from 111 to 62 with x = 16', async ({ mount }) => {
        expect(await move(mount, 111, 'up', 16)).toEqual(62)
      })

      //from 62 to 47 with x = 16
      test('from 62 to 47 with x = 16', async ({ mount }) => {
        expect(await move(mount, 62, 'up', 16)).toEqual(47)
      })

      //from 47 to 0 with x = 16
      test('from 47 to 0 with x = 16', async ({ mount }) => {
        expect(await move(mount, 47, 'up', 16)).toEqual(0)
      })

      //from 0 to -1 with x = 16
      test('from 0 to -1 with x = 16', async ({ mount }) => {
        expect(await move(mount, 0, 'up', 16)).toEqual(-1)
      })
    })
  })
})

test.describe('horizontal pagination', () => {
  test.describe('home', () => {
    async function home(mount: any, offset: number) {
      return await moveHorizontal(mount, offset, 'home', evenMoreContent)
    }

    // home of 186 is 162
    test('home of 186 is 162', async ({ mount }) => {
      expect(await home(mount, 186)).toBe(162)
    })

    // home of 133 is 111
    test('home of 133 is 111', async ({ mount }) => {
      expect(await home(mount, 133)).toBe(111)
    })

    // home of 78 is 62
    test('home of 78 is 62', async ({ mount }) => {
      expect(await home(mount, 78)).toBe(62)
    })

    // home of 56 is 47
    test('home of 56 is 47', async ({ mount }) => {
      expect(await home(mount, 56)).toBe(47)
    })

    // home of 12 is 0
    test('home of 12 is 0', async ({ mount }) => {
      expect(await home(mount, 12)).toBe(0)
    })

    // home of 25 is 0
    test('home of 25 is 0', async ({ mount }) => {
      expect(await home(mount, 25)).toBe(0)
    })

    // home of 228 is 210
    test('home of 228 is 210', async ({ mount }) => {
      expect(await home(mount, 228)).toBe(210)
    })

    // home of 274 is 258
    test('home of 274 is 258', async ({ mount }) => {
      expect(await home(mount, 274)).toBe(258)
    })

    // home of 326 is 306
    test('home of 326 is 306', async ({ mount }) => {
      expect(await home(mount, 326)).toBe(306)
    })

    // home of 376 is 353
    test('home of 376 is 353', async ({ mount }) => {
      expect(await home(mount, 376)).toBe(353)
    })

    // home of 421 is 406
    test('home of 421 is 406', async ({ mount }) => {
      expect(await home(mount, 421)).toBe(406)
    })

    // home of 471 is 448
    test('home of 471 is 448', async ({ mount }) => {
      expect(await home(mount, 471)).toBe(448)
    })

    // home of 524 is 498
    test('home of 524 is 498', async ({ mount }) => {
      expect(await home(mount, 524)).toBe(498)
    })

    // home of 557 is 544
    test('home of 557 is 544', async ({ mount }) => {
      expect(await home(mount, 557)).toBe(545)
    })

    // home of 266 is 257
    test('home of 266 is 257', async ({ mount }) => {
      expect(await home(mount, 266)).toBe(258)
    })
  })

  test.describe('end', () => {
    async function end(mount: any, offset: number) {
      return await moveHorizontal(mount, offset, 'end', evenMoreContent)
    }

    // end of 186 is 210
    test('end of 186 is 210', async ({ mount }) => {
      expect(await end(mount, 186)).toBe(210)
    })

    // end of 133 is 162
    test('end of 133 is 162', async ({ mount }) => {
      expect(await end(mount, 133)).toBe(162)
    })

    // end of 78 is 111
    test('end of 78 is 111', async ({ mount }) => {
      expect(await end(mount, 78)).toBe(111)
    })

    // end of 56 is 62
    test('end of 56 is 62', async ({ mount }) => {
      expect(await end(mount, 56)).toBe(62)
    })

    // end of 12 is 47
    test('end of 12 is 47', async ({ mount }) => {
      expect(await end(mount, 12)).toBe(47)
    })

    // end of 25 is 47
    test('end of 25 is 47', async ({ mount }) => {
      expect(await end(mount, 25)).toBe(47)
    })

    // end of 228 is 257
    test('end of 228 is 257', async ({ mount }) => {
      expect(await end(mount, 228)).toBe(257)
    })

    // end of 274 is 306
    test('end of 274 is 306', async ({ mount }) => {
      expect(await end(mount, 274)).toBe(306)
    })

    // end of 326 is 353
    test('end of 326 is 353', async ({ mount }) => {
      expect(await end(mount, 326)).toBe(353)
    })

    // end of 376 is 406
    test('end of 376 is 406', async ({ mount }) => {
      expect(await end(mount, 376)).toBe(406)
    })

    // end of 421 is 448
    test('end of 421 is 448', async ({ mount }) => {
      expect(await end(mount, 421)).toBe(448)
    })

    // end of 471 is 498
    test('end of 471 is 498', async ({ mount }) => {
      expect(await end(mount, 471)).toBe(498)
    })

    // end of 524 is 544
    test('end of 524 is 544', async ({ mount }) => {
      expect(await end(mount, 524)).toBe(544)
    })

    // end of 557 is 563
    test('end of 557 is 563', async ({ mount }) => {
      expect(await end(mount, 557)).toBe(563)
    })
  })
})
