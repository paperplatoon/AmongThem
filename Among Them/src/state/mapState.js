import { config } from './config.js';

const SCALE = 9;
const WORLD_WIDTH = config.worldWidth;
const WORLD_HEIGHT = config.worldHeight;

const corridorMargin = 96 * SCALE;
const corridorThickness = 64 * SCALE;
const roomParallel = 120 * SCALE;
const roomDepth = corridorMargin - corridorThickness / 2;
const doorParallel = 40 * SCALE;
const doorDepth = config.wallThickness;

const lerp = (a, b, t) => a + (b - a) * t;

const distributeCenters = (count, start, end) => (
  Array.from({ length: count }, (_, index) => lerp(start, end, (index * 2 + 1) / (count * 2)))
);

const corridorOuter = Object.freeze({
  left: corridorMargin,
  right: WORLD_WIDTH - corridorMargin,
  top: corridorMargin,
  bottom: WORLD_HEIGHT - corridorMargin
});

const corridorInner = Object.freeze({
  left: corridorOuter.left + corridorThickness,
  right: corridorOuter.right - corridorThickness,
  top: corridorOuter.top + corridorThickness,
  bottom: corridorOuter.bottom - corridorThickness
});

export const corridors = Object.freeze([
  { id: 'corridor_north', x: corridorOuter.left, y: corridorOuter.top, width: corridorOuter.right - corridorOuter.left, height: corridorThickness },
  { id: 'corridor_south', x: corridorOuter.left, y: corridorOuter.bottom - corridorThickness, width: corridorOuter.right - corridorOuter.left, height: corridorThickness },
  { id: 'corridor_west', x: corridorOuter.left, y: corridorOuter.top + corridorThickness, width: corridorThickness, height: corridorOuter.bottom - corridorOuter.top - corridorThickness * 2 },
  { id: 'corridor_east', x: corridorOuter.right - corridorThickness, y: corridorOuter.top + corridorThickness, width: corridorThickness, height: corridorOuter.bottom - corridorOuter.top - corridorThickness * 2 }
]);

const getNorthRooms = () => {
  const start = corridorOuter.left + corridorThickness + roomParallel / 2;
  const end = corridorOuter.right - corridorThickness - roomParallel / 2;
  const centers = distributeCenters(2, start, end);
  return centers.map((center, index) => {
    const room = {
      id: index === 0 ? 'bridge' : 'medbay',
      name: index === 0 ? 'Bridge' : 'Medbay',
      x: center - roomParallel / 2,
      y: corridorOuter.top - roomDepth,
      width: roomParallel,
      height: roomDepth
    };
    const door = {
      id: `${room.id}_door`,
      from: 'corridor',
      to: room.id,
      x: center - doorParallel / 2,
      y: corridorOuter.top - doorDepth / 2,
      width: doorParallel,
      height: doorDepth,
      side: 'south',
      orientation: 'horizontal',
      label: room.name
    };
    return { room, door };
  });
};

const getSouthRooms = () => {
  const start = corridorOuter.left + corridorThickness + roomParallel / 2;
  const end = corridorOuter.right - corridorThickness - roomParallel / 2;
  const centers = distributeCenters(2, start, end);
  return centers.map((center, index) => {
    const ids = ['kitchen', 'quarters'];
    const names = ['Kitchen', 'Quarters'];
    const room = {
      id: ids[index],
      name: names[index],
      x: center - roomParallel / 2,
      y: corridorOuter.bottom,
      width: roomParallel,
      height: roomDepth
    };
    const door = {
      id: `${room.id}_door`,
      from: 'corridor',
      to: room.id,
      x: center - doorParallel / 2,
      y: corridorOuter.bottom - doorDepth / 2,
      width: doorParallel,
      height: doorDepth,
      side: 'north',
      orientation: 'horizontal',
      label: room.name
    };
    return { room, door };
  });
};

const getWestRooms = () => {
  const start = corridorOuter.top + corridorThickness + roomParallel / 2;
  const end = corridorOuter.bottom - corridorThickness - roomParallel / 2;
  const centers = distributeCenters(2, start, end);
  return centers.map((center, index) => {
    const ids = ['engineering', 'maintenance'];
    const names = ['Engineering', 'Maintenance'];
    const room = {
      id: ids[index],
      name: names[index],
      x: corridorOuter.left - roomDepth,
      y: center - roomParallel / 2,
      width: roomDepth,
      height: roomParallel
    };
    const door = {
      id: `${room.id}_door`,
      from: 'corridor',
      to: room.id,
      x: corridorOuter.left - doorDepth / 2,
      y: center - doorParallel / 2,
      width: doorDepth,
      height: doorParallel,
      side: 'east',
      orientation: 'vertical',
      label: room.name
    };
    return { room, door };
  });
};

const getEastRooms = () => {
  const start = corridorOuter.top + corridorThickness + roomParallel / 2;
  const end = corridorOuter.bottom - corridorThickness - roomParallel / 2;
  const centers = distributeCenters(2, start, end);
  return centers.map((center, index) => {
    const ids = ['hydroponics', 'ai_core'];
    const names = ['Hydroponics', 'AI Core'];
    const room = {
      id: ids[index],
      name: names[index],
      x: corridorOuter.right,
      y: center - roomParallel / 2,
      width: roomDepth,
      height: roomParallel
    };
    const door = {
      id: `${room.id}_door`,
      from: 'corridor',
      to: room.id,
      x: corridorOuter.right - doorDepth / 2,
      y: center - doorParallel / 2,
      width: doorDepth,
      height: doorParallel,
      side: 'west',
      orientation: 'vertical',
      label: room.name
    };
    return { room, door };
  });
};

const pairings = [
  ...getNorthRooms(),
  ...getSouthRooms(),
  ...getWestRooms(),
  ...getEastRooms()
];

export const rooms = Object.freeze(pairings.map((pair) => pair.room));

export const doors = Object.freeze(pairings.map((pair) => pair.door));

export const shafts = Object.freeze([
  { id: 'shaft_nw', x: corridorInner.left - doorDepth, y: corridorInner.top - doorDepth, width: doorDepth * 2, height: doorDepth * 2 },
  { id: 'shaft_ne', x: corridorInner.right - doorDepth, y: corridorInner.top - doorDepth, width: doorDepth * 2, height: doorDepth * 2 },
  { id: 'shaft_sw', x: corridorInner.left - doorDepth, y: corridorInner.bottom - doorDepth, width: doorDepth * 2, height: doorDepth * 2 },
  { id: 'shaft_se', x: corridorInner.right - doorDepth, y: corridorInner.bottom - doorDepth, width: doorDepth * 2, height: doorDepth * 2 }
]);

const buildRoomIndex = (list) => list.reduce((acc, room) => {
  acc[room.id] = room;
  return acc;
}, {});

export const roomById = Object.freeze(buildRoomIndex(rooms));

export const mapState = Object.freeze({
  rooms,
  corridors,
  shafts,
  doors,
  roomById,
  corridorOuter,
  corridorInner,
  constants: {
    corridorMargin,
    corridorThickness,
    doorParallel,
    doorDepth,
    roomParallel,
    roomDepth
  }
});
