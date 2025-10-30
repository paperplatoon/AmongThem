import { rooms } from './mapState.js';

const createItem = (room, index) => {
  const id = `item_${room.id}`;
  const label = String(index + 1);
  const centerX = room.x + room.width / 2;
  const centerY = room.y + room.height / 2;
  const offsetX = (index % 2 === 0 ? -1 : 1) * room.width * 0.15;
  const offsetY = (index % 3 === 0 ? 1 : -1) * room.height * 0.15;
  return Object.seal({
    id,
    roomId: room.id,
    label,
    x: centerX + offsetX,
    y: centerY + offsetY,
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
