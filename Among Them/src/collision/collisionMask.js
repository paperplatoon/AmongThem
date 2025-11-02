import { sampleCellsAroundPoint, isCellSolid } from '../state/gridState.js';
import { config } from '../state/config.js';

export const isPointWalkable = (point) => (
  sampleCellsAroundPoint(point, config.playerRadius)
    .every((cell) => !isCellSolid(cell.x, cell.y))
);
