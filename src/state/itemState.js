import { rooms } from './mapState.js';
import { worldPointToCell, cellToWorldCenter, worldPointToIndex } from './gridState.js';

const clampCellWithinRoom = (room, cell) => {
  const minX = worldPointToCell({ x: room.x, y: room.y }).x + 1;
  const maxX = worldPointToCell({ x: room.x + room.width, y: room.y }).x - 1;
  const minY = worldPointToCell({ x: room.x, y: room.y }).y + 1;
  const maxY = worldPointToCell({ x: room.x, y: room.y + room.height }).y - 1;
  return {
    x: Math.max(minX, Math.min(maxX, cell.x)),
    y: Math.max(minY, Math.min(maxY, cell.y))
  };
};

const createItem = (room, index) => {
  const id = `item_${room.id}`;
  const label = String(index + 1);
  const centerPoint = {
    x: room.x + room.width / 2,
    y: room.y + room.height / 2
  };
  const baseCell = worldPointToCell(centerPoint);
  const offset = {
    x: (index % 2 === 0 ? -1 : 1),
    y: (index % 3 === 0 ? 1 : -1)
  };
  const candidate = {
    x: baseCell.x + offset.x,
    y: baseCell.y + offset.y
  };
  const cell = clampCellWithinRoom(room, candidate);
  const position = cellToWorldCenter(cell.x, cell.y);
  const gridIndex = worldPointToIndex(position);
  return Object.seal({
    id,
    roomId: room.id,
    label,
    cellX: cell.x,
    cellY: cell.y,
    gridIndex,
    x: position.x,
    y: position.y,
    collected: false
  });
};

const items = rooms.map((room, index) => createItem(room, index));

const buildIndex = (list) => list.reduce((acc, item) => {
  acc[item.id] = item;
  return acc;
}, {});

export const itemState = Object.seal({
  all: items,
  byId: buildIndex(items)
});
