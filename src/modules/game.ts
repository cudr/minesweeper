import { useReducer } from 'react'

/**
 * TYPES
 */

export enum GameState {
  INIT = 'init',
  IN_GAME = 'in-game',
  EXPLOSED = 'explosed',
  WIN = 'win'
}

export enum GameActionType {
  START = 'start',
  RESTART = 'restart',
  DE_MINE = 'de_mine',
  MARK_MINE = 'mark_mine'
}

export enum CellState {
  FLAG = 11,
  EMPTY = 0,
  ONE = 1,
  TWO = 2,
  THREE = 3,
  FOUR = 4,
  FIVE = 5,
  SIX = 6,
  SEVEN = 7,
  EIGHT = 8,
  MINE = 9,
  EXPLOSION = 10
}

export type Point = [number, number]
export type CellStorage = number[][]
export type MinesMap = {
  [key: string]: boolean
}

export interface Game {
  state: GameState
  marked: number
  rows: number
  columns: number
  mines: number
  cells: CellStorage
  minesMap: MinesMap | null
}

export interface GameAction<T> {
  type: GameActionType
  payload: T
}

/**
 * CONSTANTS
 */

const initialState: Game = {
  state: GameState.INIT,
  marked: 0,
  rows: 0,
  columns: 0,
  mines: 0,
  cells: [],
  minesMap: null
}

/**
 * HELPERS
 */

export const toKey = (y: string | number, x: string | number) => `${y}-${x}`

export const fromKey = (key: string): Point => {
  const [y, x] = key.split('-')

  return [parseInt(y, 10), parseInt(x, 10)]
}

const getRandomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min)) + min

export const generateMinesMap = (
  height: number,
  width: number,
  mines: number,
  point: Point
) => {
  const minesMap: MinesMap = {}

  let count = mines

  const clickKey = toKey(...point)

  while (count) {
    let row = getRandomInt(0, height)
    let col = getRandomInt(0, width)

    const key = toKey(row, col)

    if (!minesMap[key] && key !== clickKey) {
      minesMap[key] = true

      count -= 1
    }
  }

  return minesMap
}

export const updateCell = (
  state: CellStorage,
  [y, x]: Point,
  value: CellState
) => {
  const newState = [...state]
  const rowData = state[y]
  const newRow = [...rowData]
  newRow[x] = value
  newState[y] = newRow

  return newState
}

export const markMine = (
  state: CellStorage,
  point: Point
): [CellStorage, number] => {
  const [y, x] = point

  const rowData = state[y]

  if (rowData[x] > CellState.FLAG) return [state, 0]

  const newState = [...state]
  const newRow = [...rowData]
  let increment

  if (newRow[x] === CellState.FLAG) {
    increment = -1
    delete newRow[x]
  } else {
    newRow[x] = CellState.FLAG
    increment = 1
  }

  newState[y] = newRow

  return [newState, increment]
}

export const countMinesAtPoint = (
  state: CellStorage,
  [y, x]: Point,
  minesMap: MinesMap
) => {
  let counter = 0

  for (let i = Math.max(0, y - 1); i <= Math.min(state.length, y + 1); i++) {
    for (
      let n = Math.max(0, x - 1);
      n <= Math.min(state[y].length, x + 1);
      n++
    ) {
      const key = toKey(i, n)
      if (minesMap[key]) {
        counter += 1
      }
    }
  }

  return counter
}

export const openCell = (
  state: CellStorage,
  point: Point,
  minesMap: MinesMap
): CellStorage => {
  let newCells = [...state]

  const pointMap = {
    [toKey(...point)]: true
  }

  const points: Point[] = [
    point
  ]

  let i = 0

  while (i < points.length) {
    const iterPoint = points[i]
    const [y, x] = iterPoint

    i++

    if (
      y < 0 ||
      y >= state.length ||
      x < 0 ||
      x >= state[0].length ||
      state[y][x] >= CellState.EMPTY ||
      minesMap[toKey(...point)]
    ) {
      continue;
    }
  
    const count = countMinesAtPoint(newCells, iterPoint, minesMap)

    if (count >= CellState.MINE) {
      continue;
    }
  
    newCells = updateCell(newCells, iterPoint, count)
  
    if (count !== CellState.EMPTY) {
      continue;
    } else {
      const matrix: Point[] = [
        [y - 1, x],
        [y + 1, x],
        [y, x - 1],
        [y, x + 1]
      ]

      matrix.forEach(p => {
        const k = toKey(...p)
        if (!pointMap[k]) {
          points.push(p)
          pointMap[k] = true
        }
      })
    }
  }

  return newCells
}

const finishGame = (state: CellStorage, point: Point, minesMap: MinesMap) => {
  const newState = Object.keys(minesMap).reduce(
    (acc, key) => updateCell(acc, fromKey(key), CellState.MINE),
    state
  )

  return updateCell(newState, point, CellState.EXPLOSION)
}

/**
 * REDUCER
 */

export const reducer = (state: Game, action: GameAction<any>) => {
  switch (action.type) {
    case GameActionType.START:
      const { rows, columns } = action.payload
      return {
        ...state,
        ...action.payload,
        state: GameState.IN_GAME,
        cells: Array.from({ length: rows }, () =>
          Array.from({ length: columns })
        )
      }
    case GameActionType.RESTART:
      return initialState
    case GameActionType.DE_MINE:
      if (state.state === GameState.EXPLOSED || state.state === GameState.WIN)
        return state

      const row = parseInt(action.payload.row, 10)
      const cell = parseInt(action.payload.cell, 10)

      let minesMap = state.minesMap,
        point: Point = [row, cell]

      if (!minesMap) {
        minesMap = generateMinesMap(
          state.rows,
          state.columns,
          state.mines,
          point
        )
      }

      let cells = state.cells,
        isExlosed = minesMap[toKey(row, cell)]

      if (cells?.[row]?.[cell] !== CellState.FLAG) {
        cells = (isExlosed ? finishGame : openCell)(
          state.cells,
          point,
          minesMap
        )
      }

      return {
        ...state,
        cells,
        minesMap,
        state: isExlosed ? GameState.EXPLOSED : state.state
      }
    case GameActionType.MARK_MINE:
      if (state.state === GameState.EXPLOSED || state.state === GameState.WIN)
        return state

      const [newCells, increment] = markMine(state.cells, [
        parseInt(action.payload.row, 10),
        parseInt(action.payload.cell, 10)
      ])

      const keys = state.minesMap && Object.keys(state.minesMap)

      let isWinner

      if (
        keys?.length &&
        keys?.every(mineKey => {
          const [y, x] = fromKey(mineKey)

          return newCells[y][x] === CellState.FLAG
        })
      ) {
        isWinner = true
      }

      return {
        ...state,
        state: isWinner ? GameState.WIN : state.state,
        marked: state.marked + increment,
        cells: newCells
      }
    default:
      return state
  }
}

export const useGameReducer = () => useReducer(reducer, initialState)
