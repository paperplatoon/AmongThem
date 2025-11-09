import { layout, rectFromCells, cellsToWorld } from './layoutConfig.js';
import { config } from './config.js';

const doorParallel = 40 * 9;
const doorDepth = config.wallThickness;

const corridorMargin = layout.perimeter.marginCells;
const corridorThickness = layout.perimeter.corridorThicknessCells;
const corridorThicknessWorld = corridorThickness * layout.cellSize;

const square = Object.freeze({
  left: corridorMargin,
  right: layout.gridWidth - corridorMargin,
  top: corridorMargin,
  bottom: layout.gridHeight - corridorMargin
});

const corridorOuter = Object.freeze({
  left: cellsToWorld(square.left),
  right: cellsToWorld(square.right),
  top: cellsToWorld(square.top),
  bottom: cellsToWorld(square.bottom),
  width: cellsToWorld(square.right - square.left),
  height: cellsToWorld(square.bottom - square.top)
});

const corridorInner = Object.freeze({
  left: cellsToWorld(square.left + corridorThickness),
  right: cellsToWorld(square.right - corridorThickness),
  top: cellsToWorld(square.top + corridorThickness),
  bottom: cellsToWorld(square.bottom - corridorThickness),
  width: cellsToWorld(square.right - square.left - corridorThickness * 2),
  height: cellsToWorld(square.bottom - square.top - corridorThickness * 2)
});

const lerp = (a, b, t) => a + (b - a) * t;

const buildCorridors = () => ([
  { id: 'corridor_north', ...rectFromCells({ x: square.left, y: square.top, width: square.right - square.left, height: corridorThickness }) },
  { id: 'corridor_south', ...rectFromCells({ x: square.left, y: square.bottom - corridorThickness, width: square.right - square.left, height: corridorThickness }) },
  { id: 'corridor_west', ...rectFromCells({ x: square.left, y: square.top + corridorThickness, width: corridorThickness, height: square.bottom - square.top - corridorThickness * 2 }) },
  { id: 'corridor_east', ...rectFromCells({ x: square.right - corridorThickness, y: square.top + corridorThickness, width: corridorThickness, height: square.bottom - square.top - corridorThickness * 2 }) }
]);

export const corridors = Object.freeze(buildCorridors());

const northSouthConfig = layout.rooms.northSouth;
const eastWestConfig = layout.rooms.eastWest;

const horizontalSpan = [
  square.left + corridorThickness + northSouthConfig.widthCells / 2,
  square.right - corridorThickness - northSouthConfig.widthCells / 2
];

const verticalSpan = [
  square.top + corridorThickness + eastWestConfig.heightCells / 2,
  square.bottom - corridorThickness - eastWestConfig.heightCells / 2
];

const makeDoor = (room, side) => {
  if (side === 'north') {
    return {
      id: `${room.id}_door`,
      from: 'corridor',
      to: room.id,
      x: room.x + room.width / 2 - doorParallel / 2,
      y: room.y - doorDepth / 2,
      width: doorParallel,
      height: doorDepth,
      side: 'north',
      orientation: 'horizontal',
      label: room.name
    };
  }
  if (side === 'south') {
    return {
      id: `${room.id}_door`,
      from: 'corridor',
      to: room.id,
      x: room.x + room.width / 2 - doorParallel / 2,
      y: room.y + room.height - doorDepth / 2,
      width: doorParallel,
      height: doorDepth,
      side: 'south',
      orientation: 'horizontal',
      label: room.name
    };
  }
  if (side === 'west') {
    return {
      id: `${room.id}_door`,
      from: 'corridor',
      to: room.id,
      x: room.x - doorDepth / 2,
      y: room.y + room.height / 2 - doorParallel / 2,
      width: doorDepth,
      height: doorParallel,
      side: 'west',
      orientation: 'vertical',
      label: room.name
    };
  }
  return {
    id: `${room.id}_door`,
    from: 'corridor',
    to: room.id,
    x: room.x + room.width - doorDepth / 2,
    y: room.y + room.height / 2 - doorParallel / 2,
    width: doorDepth,
    height: doorParallel,
    side: 'east',
    orientation: 'vertical',
    label: room.name
  };
};

const makeNorthRooms = () => northSouthConfig.fractions.map((fraction, index) => {
  const center = lerp(horizontalSpan[0], horizontalSpan[1], fraction);
  const rect = rectFromCells({
    x: center - northSouthConfig.widthCells / 2,
    y: square.top - northSouthConfig.depthCells,
    width: northSouthConfig.widthCells,
    height: northSouthConfig.depthCells
  });
  const room = {
    id: index === 0 ? 'bridge' : 'medbay',
    name: index === 0 ? 'Bridge' : 'Medbay',
    ...rect
  };
  return { room, door: makeDoor(room, 'south') };
});

const makeSouthRooms = () => northSouthConfig.fractions.map((fraction, index) => {
  const center = lerp(horizontalSpan[0], horizontalSpan[1], fraction);
  const rect = rectFromCells({
    x: center - northSouthConfig.widthCells / 2,
    y: square.bottom,
    width: northSouthConfig.widthCells,
    height: northSouthConfig.depthCells
  });
  const ids = ['kitchen', 'quarters'];
  const names = ['Kitchen', 'Quarters'];
  const room = {
    id: ids[index],
    name: names[index],
    ...rect
  };
  return { room, door: makeDoor(room, 'north') };
});

const makeSideRooms = (side) => eastWestConfig.fractions.map((fraction, index) => {
  const center = lerp(verticalSpan[0], verticalSpan[1], fraction);
  const rect = rectFromCells({
    x: side === 'west' ? square.left - eastWestConfig.depthCells : square.right,
    y: center - eastWestConfig.heightCells / 2,
    width: eastWestConfig.depthCells,
    height: eastWestConfig.heightCells
  });
  const ids = side === 'west' ? ['engineering', 'maintenance'] : ['hydroponics', 'ai_core'];
  const names = {
    engineering: 'Engineering',
    maintenance: 'Maintenance',
    hydroponics: 'Hydroponics',
    ai_core: 'AI Core'
  };
  const room = {
    id: ids[index],
    name: names[ids[index]],
    ...rect
  };
  return { room, door: makeDoor(room, side === 'west' ? 'east' : 'west') };
});

const pairings = [
  ...makeNorthRooms(),
  ...makeSouthRooms(),
  ...makeSideRooms('west'),
  ...makeSideRooms('east')
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
  corridorThickness: corridorThicknessWorld
});
