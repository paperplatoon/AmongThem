import { config } from './config.js';

const cellSize = config.cellSize;
const gridWidth = Math.floor(config.worldWidth / cellSize);
const gridHeight = Math.floor(config.worldHeight / cellSize);

const layout = Object.freeze({
  cellSize,
  gridWidth,
  gridHeight,
  perimeter: Object.freeze({
    marginCells: 12,
    corridorThicknessCells: 4
  }),
  rooms: Object.freeze({
    northSouth: Object.freeze({
      widthCells: 18,
      depthCells: 8,
      fractions: [0.3, 0.7]
    }),
    eastWest: Object.freeze({
      heightCells: 18,
      depthCells: 8,
      fractions: [0.3, 0.7]
    })
  })
});

export const cellsToWorld = (value) => value * cellSize;
export const worldToCells = (value) => Math.floor(value / cellSize);

export const rectFromCells = ({ x, y, width, height }) => ({
  x: cellsToWorld(x),
  y: cellsToWorld(y),
  width: cellsToWorld(width),
  height: cellsToWorld(height)
});

export { layout };
