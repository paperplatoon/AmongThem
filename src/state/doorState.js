import { doors } from './mapState.js';

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
  all: snapshots
});
