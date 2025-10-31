import { config } from './config.js';

const totalCells = config.gridWidth * config.gridHeight;

const createCells = () => new Uint8Array(totalCells);

export const WORLD_SOLID = 1;
export const WORLD_EMPTY = 0;

export const CELL_TYPES = Object.freeze({
  WALL: WORLD_SOLID,
  FLOOR: WORLD_EMPTY
});

export const gridState = Object.seal({
  width: config.gridWidth,
  height: config.gridHeight,
  cellSize: config.cellSize,
  cells: createCells()
});

export const toIndex = (x, y) => y * gridState.width + x;

export const withinBounds = (x, y) => (
  x >= 0 && x < gridState.width && y >= 0 && y < gridState.height
);

export const markCell = (x, y, value) => {
  if (!withinBounds(x, y)) return;
  gridState.cells[toIndex(x, y)] = value;
};

export const setCell = (index, value) => {
  if (index < 0 || index >= gridState.cells.length) return;
  gridState.cells[index] = value;
};

export const getCell = (x, y) => (
  withinBounds(x, y) ? gridState.cells[toIndex(x, y)] : WORLD_SOLID
);

export const worldToCell = (value) => Math.floor(value / gridState.cellSize);

export const worldPointToCell = (point) => ({
  x: worldToCell(point.x),
  y: worldToCell(point.y)
});

export const sampleCellsAroundPoint = (point, radius) => {
  const minX = worldToCell(point.x - radius);
  const maxX = worldToCell(point.x + radius);
  const minY = worldToCell(point.y - radius);
  const maxY = worldToCell(point.y + radius);
  const cells = [];
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      cells.push({ x, y, value: getCell(x, y) });
    }
  }
  return cells;
};

export const worldPointToIndex = (point) => {
  const cell = worldPointToCell(point);
  if (!withinBounds(cell.x, cell.y)) return -1;
  return toIndex(cell.x, cell.y);
};

export const cellToWorld = (x, y) => ({
  x: x * gridState.cellSize,
  y: y * gridState.cellSize
});

export const cellToWorldCenter = (x, y) => ({
  x: x * gridState.cellSize + gridState.cellSize / 2,
  y: y * gridState.cellSize + gridState.cellSize / 2
});

export const resetGrid = (value = WORLD_SOLID) => {
  gridState.cells.fill(value);
};

const rectToCellRange = (rect) => ({
  startX: worldToCell(rect.x),
  endX: worldToCell(rect.x + rect.width - 1),
  startY: worldToCell(rect.y),
  endY: worldToCell(rect.y + rect.height - 1)
});

export const forEachCellInRect = (rect, callback) => {
  const { startX, endX, startY, endY } = rectToCellRange(rect);
  for (let y = startY; y <= endY; y++) {
    for (let x = startX; x <= endX; x++) {
      if (!withinBounds(x, y)) continue;
      callback(x, y, toIndex(x, y));
    }
  }
};

export const carveRect = (rect) => {
  forEachCellInRect(rect, (x, y) => markCell(x, y, WORLD_EMPTY));
};

export const fillRect = (rect) => {
  forEachCellInRect(rect, (x, y) => markCell(x, y, WORLD_SOLID));
};

export const isCellSolid = (x, y) => getCell(x, y) === WORLD_SOLID;
