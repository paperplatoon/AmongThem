import {
  gridState,
  WORLD_SOLID,
  WORLD_EMPTY,
  resetGrid,
  carveRect,
  worldToCell
} from '../state/gridState.js';
import { gameState } from '../state/gameState.js';

const carveWalkable = (rect) => carveRect(rect);

const carveCorridors = () => gameState.map.corridors.forEach(carveWalkable);

const carveVents = () => gameState.map.vents.forEach(carveWalkable);

const carveRooms = () => {
  gameState.map.rooms.forEach((room) => {
    const minCellX = worldToCell(room.x);
    const maxCellX = worldToCell(room.x + room.width - 1);
    const minCellY = worldToCell(room.y);
    const maxCellY = worldToCell(room.y + room.height - 1);
    for (let y = minCellY + 1; y <= maxCellY - 1; y++) {
      for (let x = minCellX + 1; x <= maxCellX - 1; x++) {
        const index = y * gridState.width + x;
        if (index < 0 || index >= gridState.cells.length) continue;
        gridState.cells[index] = WORLD_EMPTY;
      }
    }
  });
};

const carveDoors = () => gameState.map.doors.forEach(carveWalkable);

export const buildSolidMask = () => {
  resetGrid(WORLD_SOLID);
  carveCorridors();
  carveVents();
  carveRooms();
  carveDoors();
};
