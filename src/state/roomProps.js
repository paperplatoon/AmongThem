import { mapState } from './mapState.js';
import { worldPointToCell, cellToWorldCenter } from './gridState.js';

const randomContents = () => {
  if (Math.random() < 0.25) {
    return [{
      id: `prop_energy_${Math.random().toString(36).slice(2, 7)}`,
      label: 'Energy Bar',
      type: 'energy_bar',
      effect: { type: 'stamina', amount: 0.25 }
    }];
  }
  if (Math.random() < 0.2) {
    return [{
      id: `prop_o2_${Math.random().toString(36).slice(2, 7)}`,
      label: 'Oxygen Canister',
      type: 'oxygen_canister',
      effect: { type: 'oxygen', amount: 0.1 }
    }];
  }
  return [];
};

const PROP_TYPES = ['desk', 'bed', 'trash', 'locker'];

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
    contents: randomContents(),
    promptActive: false
  });
};

export const generateRoomProps = () => (
  mapState.rooms.flatMap((room) => (
    PROP_TYPES.map((type, index) => createProp(room, type, index))
  ))
);
