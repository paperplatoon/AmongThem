import { gameState } from '../state/gameState.js';
import { withinBounds as withinGridBounds, toIndex } from '../state/gridState.js';

const isOpaqueCell = (cellX, cellY) => {
  if (!withinGridBounds(cellX, cellY)) return true;
  const value = gameState.grid.cells[toIndex(cellX, cellY)];
  return value !== 0;
};

const bresenham = (start, end, maxSteps) => {
  const points = [];
  let x0 = start.x;
  let y0 = start.y;
  const x1 = end.x;
  const y1 = end.y;
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  let steps = 0;
  while (true) {
    points.push({ x: x0, y: y0 });
    if (x0 === x1 && y0 === y1) break;
    if (maxSteps != null && steps >= maxSteps) break;
    const e2 = err * 2;
    if (e2 > -dy) {
      err -= dy;
      x0 += sx;
    }
    if (e2 < dx) {
      err += dx;
      y0 += sy;
    }
    steps += 1;
  }
  return points;
};

const maxCellsFromDistance = (distanceCells) => Math.max(0, Math.floor(distanceCells));

export const hasLineOfSight = (startCell, endCell, rangeCells) => {
  const maxSteps = maxCellsFromDistance(rangeCells);
  const points = bresenham(startCell, endCell, maxSteps);
  for (let i = 0; i < points.length; i += 1) {
    const point = points[i];
    if (point.x === startCell.x && point.y === startCell.y) continue;
    if (point.x === endCell.x && point.y === endCell.y) return true;
    if (isOpaqueCell(point.x, point.y)) return false;
  }
  return false;
};
