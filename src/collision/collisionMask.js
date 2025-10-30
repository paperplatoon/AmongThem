import { config } from '../state/config.js';
import { mapState } from '../state/mapState.js';
import { gameState } from '../state/gameState.js';
import { isPointInRect, shrinkRect } from '../utils/geometry.js';

const buffer = config.collisionBuffer;
const wall = config.wallThickness;

const { corridorOuter, constants, rooms, doors } = mapState;

const createCorridorWalkways = () => {
  const shrinkX = wall + buffer;
  const shrinkY = wall + buffer;
  const horizontalWidth = corridorOuter.right - corridorOuter.left - shrinkX * 2;
  const horizontalHeight = constants.corridorThickness - shrinkY * 2;
  const north = {
    x: corridorOuter.left + shrinkX,
    y: corridorOuter.top + shrinkY,
    width: horizontalWidth,
    height: horizontalHeight
  };
  const south = {
    x: corridorOuter.left + shrinkX,
    y: corridorOuter.bottom - constants.corridorThickness + shrinkY,
    width: horizontalWidth,
    height: horizontalHeight
  };
  const verticalWidth = constants.corridorThickness - shrinkY * 2;
  const verticalTop = corridorOuter.top + constants.corridorThickness - shrinkY;
  const verticalBottom = corridorOuter.bottom - constants.corridorThickness + shrinkY;
  const verticalHeight = verticalBottom - verticalTop;
  const west = {
    x: corridorOuter.left + shrinkX,
    y: verticalTop,
    width: verticalWidth,
    height: verticalHeight
  };
  const east = {
    x: corridorOuter.right - constants.corridorThickness + shrinkX,
    y: verticalTop,
    width: verticalWidth,
    height: verticalHeight
  };
  return { north, south, west, east };
};

const corridorWalkwaysBySide = createCorridorWalkways();
const corridorWalkwayRects = Object.values(corridorWalkwaysBySide);
const corridorKeyForDoor = { north: 'south', south: 'north', east: 'west', west: 'east' };

const roomInteriorEntries = rooms
  .map((room) => ({ roomId: room.id, rect: shrinkRect(room, wall + buffer) }))
  .filter((entry) => entry.rect);

const roomInteriorById = new Map(roomInteriorEntries.map((entry) => [entry.roomId, entry.rect]));

const alongPad = Math.max(buffer, wall / 2);
const acrossPad = wall + buffer;

const bridgeHorizontalDoor = (door, corridor, roomRect) => {
  const width = door.width + alongPad * 2;
  const x = door.x - alongPad;
  const top = Math.min(corridor.y, roomRect.y) - acrossPad;
  const bottom = Math.max(corridor.y + corridor.height, roomRect.y + roomRect.height) + acrossPad;
  return { x, y: top, width, height: bottom - top };
};

const bridgeVerticalDoor = (door, corridor, roomRect) => {
  const height = door.height + alongPad * 2;
  const y = door.y - alongPad;
  const left = Math.min(corridor.x, roomRect.x) - acrossPad;
  const right = Math.max(corridor.x + corridor.width, roomRect.x + roomRect.width) + acrossPad;
  return { x: left, y, width: right - left, height };
};

const createDoorPassage = (door) => {
  const corridor = corridorWalkwaysBySide[corridorKeyForDoor[door.side]];
  const roomRect = roomInteriorById.get(door.to);
  if (!corridor || !roomRect) return null;
  if (door.orientation === 'horizontal') return bridgeHorizontalDoor(door, corridor, roomRect);
  return bridgeVerticalDoor(door, corridor, roomRect);
};

const doorPassageEntries = doors
  .map((door) => ({ doorId: door.id, roomId: door.to, rect: createDoorPassage(door) }))
  .filter((entry) => entry.rect);

const doorPassageById = new Map(doorPassageEntries.map((entry) => [entry.doorId, entry.rect]));

const corridorContains = (point) => corridorWalkwayRects.some((rect) => isPointInRect(point, rect));

const doorIsOpen = (door) => door?.isOpen;

const isInsideOpenDoor = (point) => (
  gameState.doorList.some((door) => {
    if (!doorIsOpen(door)) return false;
    const rect = doorPassageById.get(door.id);
    return rect ? isPointInRect(point, rect) : false;
  })
);

const isInsideOpenRoom = (point) => (
  gameState.doorList.some((door) => {
    if (!doorIsOpen(door)) return false;
    const roomRect = roomInteriorById.get(door.to);
    return roomRect ? isPointInRect(point, roomRect) : false;
  })
);

export const isPointWalkable = (point) => (
  corridorContains(point) ||
  isInsideOpenDoor(point) ||
  isInsideOpenRoom(point)
);
