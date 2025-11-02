import { config } from './config.js';
import { rooms, doors } from './mapState.js';

const { wallThickness, doorPadding } = config;

const isHorizontal = (door) => door.orientation === 'horizontal';

const connectsToRoom = (door, roomId) => door.to === roomId || door.from === roomId;

const doorSide = (door) => door.side;

const buildGap = (door) => ({
  start: isHorizontal(door) ? door.x - doorPadding : door.y - doorPadding,
  end: isHorizontal(door) ? door.x + door.width + doorPadding : door.y + door.height + doorPadding
});

const sortGaps = (gaps) => gaps.slice().sort((a, b) => a.start - b.start);

const pushSegment = (segments, start, end) => {
  if (end <= start) return;
  segments.push({ start, end });
};

const splitRange = (start, end, gaps) => {
  const segments = [];
  let cursor = start;
  sortGaps(gaps).forEach((gap) => {
    const gapStart = Math.max(gap.start, start);
    const gapEnd = Math.min(gap.end, end);
    pushSegment(segments, cursor, gapStart);
    cursor = Math.max(cursor, gapEnd);
  });
  pushSegment(segments, cursor, end);
  return segments;
};

const clampSegment = (segment, start, end) => ({
  start: Math.max(segment.start, start),
  end: Math.min(segment.end, end)
});

const buildNorthWalls = (room, gaps) => {
  const start = room.x - wallThickness;
  const end = room.x + room.width + wallThickness;
  return splitRange(start, end, gaps)
    .map((segment) => clampSegment(segment, start, end))
    .map((segment) => ({
      x: segment.start,
      y: room.y - wallThickness,
      width: segment.end - segment.start,
      height: wallThickness
    }));
};

const buildSouthWalls = (room, gaps) => {
  const start = room.x - wallThickness;
  const end = room.x + room.width + wallThickness;
  return splitRange(start, end, gaps)
    .map((segment) => clampSegment(segment, start, end))
    .map((segment) => ({
      x: segment.start,
      y: room.y + room.height,
      width: segment.end - segment.start,
      height: wallThickness
    }));
};

const buildWestWalls = (room, gaps) => {
  const start = room.y - wallThickness;
  const end = room.y + room.height + wallThickness;
  return splitRange(start, end, gaps)
    .map((segment) => clampSegment(segment, start, end))
    .map((segment) => ({
      x: room.x - wallThickness,
      y: segment.start,
      width: wallThickness,
      height: segment.end - segment.start
    }));
};

const buildEastWalls = (room, gaps) => {
  const start = room.y - wallThickness;
  const end = room.y + room.height + wallThickness;
  return splitRange(start, end, gaps)
    .map((segment) => clampSegment(segment, start, end))
    .map((segment) => ({
      x: room.x + room.width,
      y: segment.start,
      width: wallThickness,
      height: segment.end - segment.start
    }));
};

const wallsForRoom = (room) => {
  const northGaps = [];
  const southGaps = [];
  const westGaps = [];
  const eastGaps = [];
  doors.forEach((door) => {
    if (!connectsToRoom(door, room.id)) return;
    const side = doorSide(door);
    const gap = buildGap(door);
    if (side === 'north') northGaps.push(gap);
    if (side === 'south') southGaps.push(gap);
    if (side === 'west') westGaps.push(gap);
    if (side === 'east') eastGaps.push(gap);
  });
  return [
    ...buildNorthWalls(room, northGaps),
    ...buildSouthWalls(room, southGaps),
    ...buildWestWalls(room, westGaps),
    ...buildEastWalls(room, eastGaps)
  ];
};

export const wallRects = Object.freeze(rooms.flatMap(wallsForRoom));
