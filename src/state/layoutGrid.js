import { config } from './config.js';

const cellSize = config.cellSize;
const gridWidth = Math.floor(config.worldWidth / cellSize);
const gridHeight = Math.floor(config.worldHeight / cellSize);

export const CellType = Object.freeze({
  WALL: 0,
  CORRIDOR: 1,
  ROOM: 2,
  CENTER: 3,
  VENT: 4
});

const createGrid = () => Array.from({ length: gridHeight }, () => Array(gridWidth).fill(CellType.WALL));

const grid = createGrid();

export const layoutGrid = Object.seal({
  grid,
  width: gridWidth,
  height: gridHeight,
  cellSize,
  reset: () => grid.forEach((row) => row.fill(CellType.WALL))
});

export const tagRectCells = ({ x, y, width, height }, type) => {
  for (let row = y; row < y + height; row += 1) {
    if (row < 0 || row >= gridHeight) continue;
    for (let col = x; col < x + width; col += 1) {
      if (col < 0 || col >= gridWidth) continue;
      grid[row][col] = type;
    }
  }
};
