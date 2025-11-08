import { rooms } from './mapState.js';
import { worldPointToCell, cellToWorldCenter } from './gridState.js';

export const ITEM_TYPES = Object.freeze({
  ENERGY_BAR: 'energy_bar',
  OXYGEN_CANISTER: 'oxygen_canister'
});

export const ITEM_DEFINITIONS = Object.freeze({
  [ITEM_TYPES.ENERGY_BAR]: {
    label: 'Energy Bar',
    effect: { type: 'stamina', amount: 0.25 }
  },
  [ITEM_TYPES.OXYGEN_CANISTER]: {
    label: 'Oxygen Canister',
    effect: { type: 'oxygen', amount: 0.10 }
  }
});

const randomType = () => (
  Math.random() < 0.5 ? ITEM_TYPES.ENERGY_BAR : ITEM_TYPES.OXYGEN_CANISTER
);

const randomRoom = () => rooms[Math.floor(Math.random() * rooms.length)];

const randomCellInsideRoom = (room) => {
  const minCell = worldPointToCell({ x: room.x, y: room.y });
  const maxCell = worldPointToCell({ x: room.x + room.width, y: room.y + room.height });
  const interiorWidth = Math.max(1, maxCell.x - minCell.x - 1);
  const interiorHeight = Math.max(1, maxCell.y - minCell.y - 1);
  const cellX = Math.floor(Math.random() * interiorWidth) + minCell.x + Math.min(1, interiorWidth);
  const cellY = Math.floor(Math.random() * interiorHeight) + minCell.y + Math.min(1, interiorHeight);
  return { cellX, cellY };
};

const createItem = (index) => {
  const room = randomRoom();
  const type = randomType();
  const { cellX, cellY } = randomCellInsideRoom(room);
  const { x, y } = cellToWorldCenter(cellX, cellY);
  const definition = ITEM_DEFINITIONS[type];
  return Object.seal({
    id: `item_${index}`,
    type,
    label: definition.label,
    effect: definition.effect,
    cellX,
    cellY,
    x,
    y,
    collected: false
  });
};

const generateItems = () => {
  const count = Math.floor(Math.random() * 3) + 2; // 2-4 items
  return Array.from({ length: count }, (_, index) => createItem(index));
};

const items = generateItems();

export const itemState = Object.seal({
  all: items,
  byId: items.reduce((acc, item) => {
    acc[item.id] = item;
    return acc;
  }, {}),
  types: ITEM_TYPES,
  definitions: ITEM_DEFINITIONS
});
