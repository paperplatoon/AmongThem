import { doors } from './mapState.js';
import { worldPointToCell, toIndex } from './gridState.js';

const createDoorState = (definition, index) => Object.seal({
  id: definition.id,
  index,
  rect: definition,
  orientation: definition.orientation,
  side: definition.side,
  label: definition.label,
  isOpen: false,
  progress: 0,
  target: 0,
  state: 'closed'
});

const snapshots = doors.map(createDoorState);
snapshots.forEach((door) => Object.seal(door));

const buildLookup = (list) => list.reduce((acc, door) => {
  acc[door.id] = door;
  return acc;
}, {});

export const doorState = Object.seal({
  byId: buildLookup(snapshots),
  all: snapshots,
  cells: (() => {
    const map = new Map();
    doors.forEach((door) => {
      const min = worldPointToCell({ x: door.x, y: door.y });
      const max = worldPointToCell({ x: door.x + door.width - 1, y: door.y + door.height - 1 });
      for (let x = min.x - 1; x <= max.x + 1; x += 1) {
        for (let y = min.y - 1; y <= max.y + 1; y += 1) {
          map.set(toIndex(x, y), door.id);
        }
      }
    });
    return map;
  })()
});
