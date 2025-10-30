import { doors } from './mapState.js';

const addIndex = (door, index) => ({
  id: door.id,
  index,
  isOpen: false,
  progress: 0,
  target: 0,
  state: 'closed'
});

const snapshots = doors.map(addIndex);
snapshots.forEach((door) => Object.seal(door));

const buildLookup = (list) => list.reduce((acc, door) => {
  acc[door.id] = door;
  return acc;
}, {});

export const doorState = Object.seal({
  byId: buildLookup(snapshots),
  all: snapshots
});
