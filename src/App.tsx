import React, { useCallback, useEffect, memo } from 'react'

import { FixedSizeGrid as Grid, GridChildComponentProps } from 'react-window'
import AutoSizer from "react-virtualized-auto-sizer"

import {
  toKey,
  MAX,
  useGameReducer,
  Game,
  GameState,
  GameActionType,
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

      dispatch({
        type: GameActionType.START,
        payload: {
          rows,
          columns,
          mines
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
        <input max={MAX} required type="number" name="rows" id="rows" />
        <br />
        <label htmlFor="columns">Columns:</label>
        <input max={MAX} required type="number" name="columns" id="columns" />
        <br />
        <label htmlFor="mines">Mines:</label>
        <input max={(MAX << 1) - 1} required type="number" name="mines" id="mines" />
        <br />
        <button type="submit">Start Game!</button>
      </form>
    )
  }

  return (
    <>
      <button onClick={onRestartGame}>Restart Game!</button>
      <div onClick={onClick} onContextMenu={onContextMenu}>
        <Field rows={rows} columns={columns} cells={cells} />
      </div>
    </>
  )
}

export default App

const Field: React.FC<Pick<Game, 'rows' | 'columns' | 'cells'>> = ({
  rows,
  columns,
  cells
}) => {
  return (
    <AutoSizer style={{
      minWidth: '100vw',
      minHeight: '96vh'
    }}>
    {({ height, width }) => (
      <Grid
      columnCount={columns}
      columnWidth={20}
      height={height}
      rowCount={rows}
      rowHeight={20}
      width={width}
      itemData={cells}
    >
      {Cell}
    </Grid>
    )}
</AutoSizer>  
  )
}

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

const Cell: React.FC<GridChildComponentProps> = ({ data, columnIndex, rowIndex, style }) => {
  const state = data[toKey(rowIndex, columnIndex)]

  const cellState = getState(state)

  return (
    <div
      style={{
        ...style,
        color: cellColor[state],
        backgroundColor:
          state >= CellState.EMPTY && state < CellState.FLAG
            ? 'white'
            : 'lightgray'
      }}
      data-row={rowIndex}
      data-cell={columnIndex}
    >
      {cellState}
    </div>
  )
}
