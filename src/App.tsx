import React, { useCallback, useEffect, memo } from 'react'

import {
  useGameReducer,
  Game,
  GameState,
  GameActionType,
  CellStorage,
  CellState
} from './modules/game'

const App = () => {
  const [gameState, dispatch] = useGameReducer()

  const { state, rows, columns, cells } = gameState

  const onClick = useCallback(
    e => {
      if (!e.target.dataset.cell) return

      dispatch({
        type: GameActionType.DE_MINE,
        payload: { ...e.target.dataset }
      })
    },
    [dispatch]
  )

  const onContextMenu = useCallback(
    e => {
      e.preventDefault()

      if (!e.target.dataset.cell) return

      dispatch({
        type: GameActionType.MARK_MINE,
        payload: e.target.dataset
      })
    },
    [dispatch]
  )

  const onSubmit = useCallback(
    e => {
      e.preventDefault()

      const data = new FormData(e.target as HTMLFormElement)

      const rows = parseInt(data.get('rows') as string, 10)
      const columns = parseInt(data.get('columns') as string, 10)
      const mines = parseInt(data.get('mines') as string, 10)

      if (rows * columns < mines + 1) {
        return alert('Mines count is too match!')
      }

      const row: any[] = Array.from({ length: columns })

      const cells: CellStorage = []

      for (let i = 0; i < rows; i++) {
        cells[i] = row
      }

      dispatch({
        type: GameActionType.START,
        payload: {
          rows,
          columns,
          mines,
          cells
        }
      })
    },
    [dispatch]
  )

  const onRestartGame = useCallback(() => {
    dispatch({
      type: GameActionType.RESTART,
      payload: null
    })
  }, [dispatch])

  useEffect(() => {
    if (state === GameState.WIN) alert('You win!')
    if (state === GameState.EXPLOSED) alert('BOOM!')
  }, [state])

  if (state === GameState.INIT) {
    return (
      <form onSubmit={onSubmit}>
        <label htmlFor="rows">Rows:</label>
        <input required max="1000" type="number" name="rows" id="rows" />
        <br />
        <label htmlFor="columns">Columns:</label>
        <input required max="1000" type="number" name="columns" id="columns" />
        <br />
        <label htmlFor="mines">Mines:</label>
        <input required max="1000" type="number" name="mines" id="mines" />
        <br />
        <button type="submit">Start Game!</button>
      </form>
    )
  }

  return (
    <>
      <button onClick={onRestartGame}>Restart Game!</button>
      <table onClick={onClick} onContextMenu={onContextMenu}>
        <Field rows={rows} columns={columns} cells={cells} />
      </table>
    </>
  )
}

export default App

const Field: React.FC<Pick<Game, 'rows' | 'columns' | 'cells'>> = ({
  rows,
  columns,
  cells
}) => {
  let rowList = []

  for (let i = 0; i < rows; i++) {
    rowList.push(
      <MemoRow
        columns={columns}
        key={`row-${i}`}
        rowIndex={i}
        rowData={cells[i]}
      />
    )
  }

  return <tbody>{rowList}</tbody>
}

const Row: React.FC<{ columns: number; rowIndex: number; rowData: any[] }> = ({
  columns,
  rowIndex,
  rowData
}) => {
  let cellList = []

  for (let i = 0; i < columns; i++) {
    cellList.push(
      <MemoCell
        state={rowData[i]}
        rowIndex={rowIndex}
        key={`cell-${rowIndex}-${i}`}
        idx={i}
      />
    )
  }

  return <tr>{cellList}</tr>
}

const MemoRow = memo(Row)

function getState(state: number) {
  if (state === CellState.EMPTY) return null
  if (state === CellState.MINE) return '💣'
  if (state === CellState.FLAG) return '🚩'
  if (state === CellState.EXPLOSION) return '💥'

  return state || null
}

const cellColor = [
  'red',
  'blue',
  'green',
  'red',
  'purple',
  'black',
  'gray',
  'maroon',
  'turquoise'
]

const Cell: React.FC<{ state: number; idx: number; rowIndex: number }> = ({
  state,
  idx,
  rowIndex
}) => {
  const cellState = getState(state)

  return (
    <td
      style={{
        color: cellColor[state],
        backgroundColor:
          state >= CellState.EMPTY && state < CellState.FLAG
            ? 'white'
            : 'lightgray'
      }}
      data-row={rowIndex}
      data-cell={idx}
    >
      {cellState}
    </td>
  )
}

const MemoCell = memo(Cell)
