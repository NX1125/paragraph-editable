/**
 * Stores all states in a history, and allows undo and redo. Undoing/redoing will change the current
 * {@link IUndoableEditState.historyIndex}. There are edits and transient states. Edits are the main
 * actions that can be undone and redone. Transient states are temporary states usually skipped to
 * an edit. For example, when moving the cursor, the cursor position is a transient state.
 */
export interface IUndoableEditState<S extends IUndoableEditState<S>> {
  /**
   * The previous states, including the current state.
   */
  history?: S[]

  /**
   * The index of the current state in the history. If this is undefined, then this is the final state.
   */
  historyIndex?: number

  isEdit?: boolean
}

export class UndoableEditUtil {
  /**
   * Add an undoable state to the history.
   * If the new state is an edit, then all states to redo are removed.
   * Transient states (e.g. movements) are only added when there is no edit to redo, like a parallel branch.
   */
  static addUndoableState<S extends IUndoableEditState<S>>(prevState: S, nextState: S): S {
    let history = prevState.history || [ prevState ]

    const historyIndex = typeof prevState.historyIndex === 'number'
      ? prevState.historyIndex
      : history.length

    // If the new state is a transient state, then only add it if there is no edit to redo.
    if (!nextState.isEdit && historyIndex < history.length && history.slice(historyIndex + 1).some(state => state.isEdit)) {
      return prevState
    }

    // If the new state is an edit, then remove all states to redo.
    history = history.slice(0, historyIndex + 1)
    history.push(nextState)

    return {
      ...nextState,
      history,
      historyIndex: undefined,
    }
  }

  /**
   * Undo every transient state until the last edit, then undo the last edit. The new state will be the state before the
   * last edit.
   *
   * For example, the user moves to position A, then insert some text, then moves to position B. If the user undoes, it
   * will undo the movement to position B, then undo the text insertion, and stop at position A. This way the cursor
   * will be moved to where it was before the text insertion.
   *
   * If there is no edit to undo, then nothing will happen.
   */
  static undo<S extends IUndoableEditState<S>>(state: S): S {
    const history = state.history || [ state ]
    const historyIndex = typeof state.historyIndex === 'number'
      ? state.historyIndex
      : history.length - 1

    if (historyIndex <= 0 || !history) {
      return state
    }

    let i = historyIndex
    while (i >= 0 && !history[i].isEdit) {
      i--
    }

    if (i < 0) {
      return state
    }

    // move to the state before the last edit
    i--
    if (i < 0) {
      return {
        ...history[0],
        history,
        historyIndex: undefined,
      }
    }

    return {
      ...history[i],
      history,
      historyIndex: i,
    }
  }

  /**
   * Redo the last undone edit. The new state will be the last undone edit.
   *
   * For example, the user moves to position A, then insert some text, which will move to B, then moves to position C.
   * If the user undoes the text insertion, then redoes, it will redo the text insertion, and stop at position B, not C.
   *
   * If there is no edit to redo, then nothing will happen.
   */
  static redo<S extends IUndoableEditState<S>>(state: S): S {
    if (typeof state.historyIndex !== 'number' || !state.history) {
      return state
    }

    // If there is no edit to redo, then nothing will happen. If all states are transient, then nothing will happen.
    if (state.historyIndex + 1 >= state.history.length || !state.history.some(state => state.isEdit)) {
      return state
    }

    let i = state.historyIndex + 1
    while (i < state.history.length && !state.history[i].isEdit) {
      i++
    }

    if (i >= state.history.length) {
      return state
    }

    return {
      ...state.history[i],
      history: state.history,
      historyIndex: i,
    }
  }
}
