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
    corridorThicknessCells: 7
  }),
  rooms: Object.freeze({
    northSouth: Object.freeze({
      widthCells: 24,
      depthCells: 11,
      fractions: [0.3, 0.7]
    }),
    eastWest: Object.freeze({
      heightCells: 24,
      depthCells: 11,
      fractions: [0.3, 0.7]
    })
  }),
  centerGrid: Object.freeze({
    insetCells: 18,
    laneThicknessCells: 5,
    lanes: Object.freeze({ horizontal: [0.4, 0.6], vertical: [0.4, 0.6] })
  }),
  vents: Object.freeze({
    offsetCells: 6,
    thicknessCells: 3
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
