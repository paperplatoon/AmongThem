import { gameState } from './gameState.js';
import { worldPointToCell, cellToWorldCenter } from './gridState.js';

const getTerminalOffset = (side) => {
  const offsetDistance = gameState.grid.cellSize * 1.5;
  switch (side) {
    case 'north': return { x: 0, y: -offsetDistance };
    case 'south': return { x: 0, y: offsetDistance };
    case 'east': return { x: offsetDistance, y: 0 };
    case 'west': return { x: -offsetDistance, y: 0 };
    default: return { x: 0, y: 0 };
  }
};

const createTerminalForDoor = (door, roomId) => {
  const doorCenterX = door.x + door.width / 2;
  const doorCenterY = door.y + door.height / 2;
  const offset = getTerminalOffset(door.side);
  const worldX = doorCenterX + offset.x;
  const worldY = doorCenterY + offset.y;
  const cell = worldPointToCell({ x: worldX, y: worldY });
  const worldPos = cellToWorldCenter(cell.x, cell.y);

  return {
    id: `terminal_${roomId}`,
    roomId,
    cellX: cell.x,
    cellY: cell.y,
    x: worldPos.x,
    y: worldPos.y,
    promptActive: false
  };
};

export const initializeDoorTerminals = () => {
  const terminals = [];
  const doors = gameState.map.doors;
  const rooms = gameState.map.rooms;

  rooms.forEach((room) => {
    // Find the first door that leads to this room from the corridor
    const door = doors.find((d) => d.to === room.id && d.from === 'corridor');
    if (door) {
      terminals.push(createTerminalForDoor(door, room.id));
    }
  });

  return terminals;
};
