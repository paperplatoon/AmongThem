import { gameState } from './gameState.js';
import { worldPointToCell, cellToWorldCenter } from './gridState.js';

const createTerminalForDoor = (door, roomId) => {
  const cellSize = gameState.grid.cellSize;

  let terminalX, terminalY;

  // Position terminal: 2 cells to the right of door edge, flush against corridor wall
  // "Right" is relative to standing in corridor facing the door
  switch (door.side) {
    case 'north':
      // Door on north side, corridor above
      // Facing south into room, right = east
      // Terminal: 2 cells east of door's right edge, flush against wall
      terminalX = door.x + door.width + (cellSize * 2);
      terminalY = door.y;
      break;
    case 'south':
      // Door on south side, corridor below
      // Facing north into room, right = west
      // Terminal: 2 cells west of door's left edge, flush against wall
      terminalX = door.x - (cellSize * 2);
      terminalY = door.y + door.height;
      break;
    case 'east':
      // Door on east side, corridor to the right
      // Facing west into room, right = north
      // Terminal: 2 cells north of door's top edge, flush against wall
      terminalX = door.x + door.width;
      terminalY = door.y - (cellSize * 2);
      break;
    case 'west':
      // Door on west side, corridor to the left
      // Facing east into room, right = south
      // Terminal: 2 cells south of door's bottom edge, flush against wall
      terminalX = door.x;
      terminalY = door.y + door.height + (cellSize * 2);
      break;
  }

  const cell = worldPointToCell({ x: terminalX, y: terminalY });
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
