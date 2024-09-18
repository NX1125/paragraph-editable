import { IUndoableEditState, UndoableEditUtil } from './UndoableEditUtil'

interface IEditState extends IUndoableEditState<IEditState> {
  id: number
}

describe('undo/redo', () => {
  let id = 0
  beforeEach(() => {
    id = 0
  })

  function createEditState(data?: Partial<IEditState>): IEditState {
    return {
      ...data,
      isEdit: data?.isEdit ?? true,
      id: ++id,
    }
  }

  function createHistory(...history: IEditState[]): IEditState {
    return {
      ...history[history.length - 1],
      history,
    }
  }

  function getHistoryIds(editState: IEditState) {
    return editState.history?.map(state => state.id)
  }

  function createHistoryWithString(edits: string): IEditState {
    const history = edits.split('').map(c => createEditState({
      isEdit: c === 'E' || c === 'e',
    }))
    const index = /[ME]/.exec(edits)?.index
    const historyIndex = index === undefined || index === -1 || index === edits.length - 1 ? undefined : index

    return {
      ...history[index ?? history.length - 1],
      history,
      historyIndex,
    }
  }

  describe('add undoable edit', () => {
    it('should add undoable edit', () => {
      const prevState = createEditState()
      const nextState = UndoableEditUtil.addUndoableState(prevState, createEditState())
      expect(getHistoryIds(nextState)).toEqual([ 1, 2 ])
    })

    it('should preserve history', () => {
      const prevState = createHistory(
        createEditState(),
        createEditState(),
      )
      const nextState = UndoableEditUtil.addUndoableState<IEditState>(prevState, createEditState())
      expect(getHistoryIds(nextState)).toEqual([ 1, 2, 3 ])
    })

    it('should preserve redo history', () => {
      const prevState = createHistory(
        createEditState(),
        createEditState(),
        createEditState({
          historyIndex: 1,
        }),
      )
      const nextState = UndoableEditUtil.addUndoableState<IEditState>(prevState, createEditState({
        isEdit: false,
      }))
      expect(getHistoryIds(nextState)).toEqual([ 1, 2, 3 ])
    })

    it('should clear redo history', () => {
      const prevState = createHistory(
        createEditState(),
        createEditState(),
        createEditState({
          historyIndex: 1,
        }),
      )
      const nextState = UndoableEditUtil.addUndoableState<IEditState>(prevState, createEditState())
      expect(getHistoryIds(nextState)).toEqual([ 1, 2, 4 ])
    })

    it('should remove head movements', () => {
      const prevState = createHistory(
        createEditState(),
        createEditState(),
        createEditState({
          historyIndex: 1,
          isEdit: false,
        }),
      )
      const nextState = UndoableEditUtil.addUndoableState<IEditState>(prevState, createEditState({
        isEdit: false,
      }))
      expect(getHistoryIds(nextState)).toEqual([ 1, 2, 4 ])
    })
  })

  describe('undo', () => {
    describe('basics', () => {
      it('should do nothing when there is no undo stack', () => {
        const prevState = createEditState()
        const nextState = UndoableEditUtil.undo(prevState)
        expect(nextState).toEqual(prevState)
      })

      it('should do nothing when there is nothing on undo stack', () => {
        const prevState = createHistory(
          createEditState(),
        )
        const nextState = UndoableEditUtil.undo(prevState)
        expect(nextState).toEqual(prevState)
      })

      it('should undo', () => {
        const undoState = createEditState()
        const prevState = createHistory(
          undoState,
          createEditState(),
        )
        const nextState = UndoableEditUtil.undo(prevState)
        expect(nextState.id).toBe(undoState.id)
      })

      it('should update redo stack', () => {
        const undoState = createEditState()
        const prevState = createHistory(
          undoState,
          createEditState(),
        )
        const nextState = UndoableEditUtil.undo(prevState)
        expect(nextState.history?.length).toBe(2)
        expect(nextState.historyIndex).toBe(0)
      })
    })

    // MEMEEMMEEMEMM

    describe('examples', () => {
      it('should undo eM', () => {
        const prevState = createHistoryWithString('eM')
        const nextState = UndoableEditUtil.undo(prevState)
        expect(nextState.id).toBe(1)
      })

      it('should undo eeM', () => {
        const prevState = createHistoryWithString('eeM')
        const nextState = UndoableEditUtil.undo(prevState)
        expect(nextState.id).toBe(1)
      })

      it('should undo meE', () => {
        const prevState = createHistoryWithString('meE')
        const nextState = UndoableEditUtil.undo(prevState)
        expect(nextState.id).toBe(2)
      })

      it('should undo memEm to mEmem', () => {
        const prevState = createHistoryWithString('memEm')
        expect(prevState.historyIndex).toBe(3)
        const nextState = UndoableEditUtil.undo(prevState)
        expect(nextState.id).toBe(3)
      })

      it('should undo eE', () => {
        const prevState = createHistoryWithString('eE')
        const nextState = UndoableEditUtil.undo(prevState)
        expect(nextState.id).toBe(1)
      })

      it('should undo eEm', () => {
        const prevState = createHistoryWithString('eEm')
        const nextState = UndoableEditUtil.undo(prevState)
        expect(nextState.id).toBe(1)
      })

      it('should undo mmEm', () => {
        const prevState = createHistoryWithString('mmEm')
        const nextState = UndoableEditUtil.undo(prevState)
        expect(nextState.id).toBe(2)
      })

      it('should do nothing with mMem', () => {
        const prevState = createHistoryWithString('mMem')
        const nextState = UndoableEditUtil.undo(prevState)
        expect(nextState.id).toBe(2)
      })

      it('should do nothing with Meem', () => {
        const prevState = createHistoryWithString('Meem')
        const nextState = UndoableEditUtil.undo(prevState)
        expect(nextState.id).toBe(1)
      })

      it('should undo nothing with Ee', () => {
        const prevState = createHistoryWithString('Ee')
        const nextState = UndoableEditUtil.undo(prevState)
        expect(nextState.id).toBe(1)
      })

      it('should undo emm', () => {
        const prevState = createHistoryWithString('emm')
        const nextState = UndoableEditUtil.undo(prevState)
        expect(nextState.id).toBe(1)
      })

      it('should undo memm', () => {
        const prevState = createHistoryWithString('memm')
        const nextState = UndoableEditUtil.undo(prevState)
        expect(nextState.id).toBe(1)
      })

      it('should undo example from paper', () => {
        let state = createHistoryWithString('mememmeememm')

        state = UndoableEditUtil.undo(state)
        expect(state.id).toBe(9)

        state = UndoableEditUtil.undo(state)
        expect(state.id).toBe(7)

        state = UndoableEditUtil.undo(state)
        expect(state.id).toBe(6)

        state = UndoableEditUtil.undo(state)
        expect(state.id).toBe(3)

        state = UndoableEditUtil.undo(state)
        expect(state.id).toBe(1)

        // do nothing
        state = UndoableEditUtil.undo(state)
        expect(state.id).toBe(1)
      })

      it('should undo example from paper', () => {
        let state = createHistoryWithString('mmememmeememm')

        state = UndoableEditUtil.undo(state)
        expect(state.id).toBe(10)

        state = UndoableEditUtil.undo(state)
        expect(state.id).toBe(8)

        state = UndoableEditUtil.undo(state)
        expect(state.id).toBe(7)

        state = UndoableEditUtil.undo(state)
        expect(state.id).toBe(4)

        state = UndoableEditUtil.undo(state)
        expect(state.id).toBe(2)

        // do nothing
        state = UndoableEditUtil.undo(state)
        expect(state.id).toBe(2)
      })
    })

  })

  describe('redo', () => {
    it('should not redo eM', () => {
      const prevState = createHistoryWithString('eM')
      const nextState = UndoableEditUtil.redo(prevState)
      expect(nextState.id).toBe(2)
    })

    it('should redo example Mememmeememm', () => {
      let state = createHistoryWithString('Mememmeememm')

      state = UndoableEditUtil.redo(state)
      expect(state.id).toBe(2)

      state = UndoableEditUtil.redo(state)
      expect(state.id).toBe(4)

      state = UndoableEditUtil.redo(state)
      expect(state.id).toBe(7)

      state = UndoableEditUtil.redo(state)
      expect(state.id).toBe(8)

      state = UndoableEditUtil.redo(state)
      expect(state.id).toBe(10)

      // do nothing
      state = UndoableEditUtil.redo(state)
      expect(state.id).toBe(10)
    })
  })
})
