import { mapState } from './mapState.js';
import { worldPointToCell, cellToWorldCenter } from './gridState.js';

const randomRoom = () => mapState.rooms[Math.floor(Math.random() * mapState.rooms.length)];

const randomCellInsideRoom = (room) => {
  const minCell = worldPointToCell({ x: room.x, y: room.y });
  const maxCell = worldPointToCell({ x: room.x + room.width, y: room.y + room.height });
  const interiorWidth = Math.max(1, maxCell.x - minCell.x - 1);
  const interiorHeight = Math.max(1, maxCell.y - minCell.y - 1);
  const cellX = Math.floor(Math.random() * interiorWidth) + minCell.x + Math.min(1, interiorWidth);
  const cellY = Math.floor(Math.random() * interiorHeight) + minCell.y + Math.min(1, interiorHeight);
  return { cellX, cellY };
};

const lockerDefinitions = mapState.rooms.map((room) => ({
  lockerId: `${room.id}_locker`,
  label: `${room.name} Locker Keycard`
}));

const createKeycard = (definition, index) => {
  const room = randomRoom();
  const cell = randomCellInsideRoom(room);
  const { x, y } = cellToWorldCenter(cell.cellX, cell.cellY);
  return Object.seal({
    id: `${definition.lockerId}_key_${index}`,
    lockerId: definition.lockerId,
    label: definition.label,
    cellX: cell.cellX,
    cellY: cell.cellY,
    x,
    y,
    collected: false
  });
};

const keycards = lockerDefinitions.map((definition, index) => createKeycard(definition, index));

const byLockerId = keycards.reduce((acc, keycard) => {
  acc[keycard.lockerId] = keycard;
  return acc;
}, {});

export const keycardState = Object.seal({
  all: keycards,
  byLockerId
});
