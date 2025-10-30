import { gameState } from './gameState.js';
import { shrinkRect, inflateRect, rectsOverlap } from '../utils/geometry.js';

export const getDoorDefinition = (door) => gameState.doors[door.index];

const addIfRoom = (set, value) => {
  if (value && value !== 'corridor') set.add(value);
};

export const listOpenRooms = () => {
  const rooms = new Set();
  gameState.doorList.forEach((door) => {
    if (!door.isOpen) return;
    const definition = getDoorDefinition(door);
    addIfRoom(rooms, definition.from);
    addIfRoom(rooms, definition.to);
  });
  return [...rooms];
};

export const getOpenRoomRects = () => (
  listOpenRooms()
    .map((id) => gameState.roomById[id])
    .filter(Boolean)
);

const shrinkCorridor = (rect) => rect;

const shrinkRoom = (rect) => rect;

const inflateDoor = (door) => inflateRect(getDoorDefinition(door), gameState.config.doorPadding);

const filterTruthy = (value) => Boolean(value);

const listOpenDoors = () => gameState.doorList.filter((door) => door.isOpen);

const listClosedDoors = () => gameState.doorList.filter((door) => !door.isOpen);

export const getShrunkCorridors = () => gameState.corridors.map(shrinkCorridor).filter(filterTruthy);

export const getShrunkRooms = () => getOpenRoomRects().map(shrinkRoom).filter(filterTruthy);

export const getOpenDoorRects = () => listOpenDoors().map(inflateDoor).filter(filterTruthy);

export const getWalkableRects = () => ([
  ...gameState.corridors,
  ...getShrunkRooms()
]);

const cameraRect = () => ({
  x: gameState.camera.x,
  y: gameState.camera.y,
  width: gameState.camera.width,
  height: gameState.camera.height
});

const padRect = (rect, padding) => ({
  x: rect.x - padding,
  y: rect.y - padding,
  width: rect.width + padding * 2,
  height: rect.height + padding * 2
});

const visibleFilter = (rect) => rectsOverlap(rect, padRect(cameraRect(), 64));

export const listVisibleCorridors = () => gameState.corridors.filter(visibleFilter);

export const listVisibleRooms = () => gameState.rooms.filter(visibleFilter);

export const listVisibleDoors = () => gameState.doorList.filter((door) => visibleFilter(getDoorDefinition(door)));

export const listVisibleShafts = () => gameState.shafts.filter(visibleFilter);

const closedDoorRects = () => listClosedDoors()
  .map((door) => getDoorDefinition(door))
  .filter(filterTruthy);

export const getBlockingRects = () => closedDoorRects();
