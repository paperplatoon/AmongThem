import { mapState } from './mapState.js';
import { worldPointToCell, cellToWorldCenter } from './gridState.js';
import { createItemFromDefinition } from './itemDefinitions.js';

const PROP_TYPES = ['desk', 'bed', 'trash', 'locker'];

const PROP_CONTENT_CHANCE = Object.freeze({
  locker: 0.25,
  desk: 0.10,
  trash: 0.05,
  bed: 0.01
});

const shouldPopulate = (propType) => (
  Math.random() < (PROP_CONTENT_CHANCE[propType] ?? 0)
);

const buildContents = (room, propType) => {
  if (!shouldPopulate(propType)) return [];
  const item = createItemFromDefinition(`${room.id}_${propType}`);
  return item ? [item] : [];
};

const createProp = (room, propType, index) => {
  const offsets = [
    { x: 0.2, y: 0.2 },
    { x: 0.8, y: 0.2 },
    { x: 0.2, y: 0.8 },
    { x: 0.8, y: 0.8 }
  ];
  const base = offsets[index % offsets.length];
  const worldX = room.x + room.width * base.x;
  const worldY = room.y + room.height * base.y;
  const cell = worldPointToCell({ x: worldX, y: worldY });
  const { x, y } = cellToWorldCenter(cell.x, cell.y);
  return Object.seal({
    id: `${room.id}_${propType}_${index}`,
    roomId: room.id,
    type: propType,
    label: propType.charAt(0).toUpperCase() + propType.slice(1),
    cellX: cell.x,
    cellY: cell.y,
    x,
    y,
    contents: buildContents(room, propType),
    promptActive: false
  });
};

export const generateRoomProps = () => (
  mapState.rooms.flatMap((room) => (
    PROP_TYPES.map((type, index) => createProp(room, type, index))
  ))
);
