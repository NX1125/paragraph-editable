Blocks:

- container
- block card
- flex row
- image
- list item
- paragraph
- table

Inlines:

- text
- link
- icon
- image

```
-- selection

cursor position
    container key
    block key
    offset in block // paragraph usage

selection
    focus
    anchor

paragraph editable
    inlines = parse inline views

    paragraph view
        map inline views

[block] editable
    on key down

container editable
    selection = use state
        focus
        anchor

    start, end = block range

    return div
        map blocks
            selection = start <= index <= end
                ? focus = focus if focused, anchor = anchor if anchored
                : undefined

on key down
    left
block index = index of focus

    right
    down
    up


```

```

--- paragraph editable


Let's do just the paragraph editable part. That is the most special block, so we might as well do it separately. It
should not change much depending on the solution.

paragraph state
    text
    metadata[]

metadata
    key
    style
    layout node
    href

paragraph editable
    props
        paragraph state
        render metadata(attrs)
        caret position
        selection?: start?, end?

    inlines = parse inlines
        match sequences of metadata that are equal and have no atomic node

    move focus
        anchor = shift ? anchor ?? focus : focus

    return
        paragraph view
            on mouse down
            on mouse move
                same as mouse down, but without shift
            on mouse up
                same as mouse move

            on key down
            map inlines recursively
            // there will be 2 types of nodes to find here: inline elements and texts. A text may not necessarily be
            // wrapped into a span, but every atomic inline should be wrapped and marked with a data-rt-atomic attribute.

            render highlights
            render caret if there is a focus, but hidden if there is an anchor too

get atomic attributes
    data-rt-atomic

// or dispatch a click event to the child paragraph?
go into paragraph movement(direction)

abstract paragraph measurements
    ctor(element)
        inlines = get inlines of root element

    abstract is atomic
    abstract is same line

    get inlines(node, offset)
        for each node
            if it is a text node
                create inline fragment reference from [ offset, offset + length ]
                offset += text length

            else if it is atomic
                create atomic fragment reference from [ offset, offset + 1 ]
                offset++

            else
                inlines = get inlines(node)
                yield all inlines

                offset = last inline end

    static get line ranges(inlines)
        for each inline
            if it is a text node
                create a line for each line in it
            else
                single line

    get caret movement(offset, x, y, direction)
        left
            if first
                return

            offset--
        right
            if last
                return

            offset++
        down
            line ranges = get line ranges

            line bounds = bounds of first inline
            last good position = 0

            for each inline
                if it is not contained in the line bounds
                    break

                if it contains x
                    last good position = is text
                        ? get closest x position in it
                        : x is after its middle ? offset + 1 : offset
                    break

                last good position = end of inline range

            return last good position

        up
            inlines = get line ranges

            line bounds = bounds of last inline range
            last good position = 0

            for each inline in reverse
                if it is not contained in the line bounds
                    break

                if it contains x
                    last good position = is text
                        ? get closest x position in it
                        : x is after its middle ? offset + 1 : offset
                    break

                last good position = start of inline

            return last good position

        home
            inlines = get line ranges

            inline index = find inline containing offset
            line bounds = first line range bounds

            for each inline backwards
                if it is not on the same line
                    break

                inline index--

            return start of line range

        end
            inlines = get line ranges

            inline index = find inline containing offset
            line bounds = first line range bounds

            for each inline afterwards
                if it is not on the same line
                    break

                inline index++

            return end of line range

        page up, down
            y += viewport height with direction sign

            if it is outside this paragraph
                return

            mouse down at position

    get caret position at client point(x, y)
        line ranges = get line ranges

        line = find closest line ranges to the point
        last good position = offset of first line range

        for each line range
            if left is after x: break

            if right is before x:
                last good position = end of inline range
                continue

            last good position = get closest x position in line

            break

        move focus to last good position

    get selection highlights

    get caret bounds

interface caret highlight
    bounds
    source: text or atomic node

interface selection highlight
    start, end
    bounds
    source: text or atomic node

```
