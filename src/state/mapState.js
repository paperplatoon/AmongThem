import { layout, rectFromCells, cellsToWorld } from './layoutConfig.js';
import { layoutGrid, tagRectCells, CellType } from './layoutGrid.js';
import { config } from './config.js';

const doorParallel = 40 * 9;
const doorDepth = config.wallThickness;

const corridorMargin = layout.perimeter.marginCells;
const corridorThickness = layout.perimeter.corridorThicknessCells;

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

const innerCorridorBounds = Object.freeze({
  left: square.left + corridorThickness,
  right: square.right - corridorThickness,
  top: square.top + corridorThickness,
  bottom: square.bottom - corridorThickness
});

const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const tagRect = (rect, type) => tagRectCells(rect, type);

const centerGrid = layout.centerGrid;
const centerBounds = {
  left: square.left + centerGrid.insetCells,
  right: square.right - centerGrid.insetCells,
  top: square.top + centerGrid.insetCells,
  bottom: square.bottom - centerGrid.insetCells
};

const laneThickness = centerGrid.laneThicknessCells;
const laneHalf = Math.floor(laneThickness / 2);

const layoutVent = layout.vents;
const ventThickness = layoutVent.thicknessCells;
const ventHalf = Math.floor(ventThickness / 2);
const ventOffset = layoutVent.offsetCells;
const ventIncludeConnectors = Boolean(layoutVent.connectors);

const perimeterCorridors = [
  { id: 'corridor_north', rect: { x: square.left, y: square.top, width: square.right - square.left, height: corridorThickness } },
  { id: 'corridor_south', rect: { x: square.left, y: square.bottom - corridorThickness, width: square.right - square.left, height: corridorThickness } },
  { id: 'corridor_west', rect: { x: square.left, y: square.top + corridorThickness, width: corridorThickness, height: square.bottom - square.top - corridorThickness * 2 } },
  { id: 'corridor_east', rect: { x: square.right - corridorThickness, y: square.top + corridorThickness, width: corridorThickness, height: square.bottom - square.top - corridorThickness * 2 } }
];

layoutGrid.reset();
perimeterCorridors.forEach((corridor) => tagRect(corridor.rect, CellType.CORRIDOR));

const roomRecords = [];
const doorRecords = [];
const ventCellMask = new Uint8Array(layout.gridWidth * layout.gridHeight);
const fastLaneCellMask = new Uint8Array(layout.gridWidth * layout.gridHeight);

const cloneRectCells = (rect) => ({ x: rect.x, y: rect.y, width: rect.width, height: rect.height });
const roomCenter = (room) => ({
  x: room.rectCells.x + Math.floor(room.rectCells.width / 2),
  y: room.rectCells.y + Math.floor(room.rectCells.height / 2)
});

const markCells = (rect, mask) => {
  for (let row = rect.y; row < rect.y + rect.height; row += 1) {
    if (row < 0 || row >= layout.gridHeight) continue;
    for (let col = rect.x; col < rect.x + rect.width; col += 1) {
      if (col < 0 || col >= layout.gridWidth) continue;
      mask[row * layout.gridWidth + col] = 1;
    }
  }
};

const markVentCells = (rect) => markCells(rect, ventCellMask);
const markFastLaneCells = (rect) => markCells(rect, fastLaneCellMask);

const addRoom = (room, doorSide) => {
  tagRect(room.rectCells, CellType.ROOM);
  const worldRect = rectFromCells(room.rectCells);
  const record = {
    id: room.id,
    name: room.name,
    side: doorSide,
    ...worldRect,
    rectCells: cloneRectCells(room.rectCells)
  };
  roomRecords.push(record);
  doorRecords.push(makeDoor(record, doorSide === 'north' ? 'south' : doorSide === 'south' ? 'north' : doorSide === 'west' ? 'east' : 'west'));
};

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

const buildNorthRooms = () => {
  const cfg = layout.rooms.northSouth;
  cfg.fractions.forEach((fraction, index) => {
    const center = lerp(
      square.left + corridorThickness + cfg.widthCells / 2,
      square.right - corridorThickness - cfg.widthCells / 2,
      fraction
    );
    const rectCells = {
      x: Math.round(center - cfg.widthCells / 2),
      y: square.top - cfg.depthCells,
      width: cfg.widthCells,
      height: cfg.depthCells
    };
    addRoom({
      id: index === 0 ? 'bridge' : 'medbay',
      name: index === 0 ? 'Bridge' : 'Medbay',
      rectCells
    }, 'north');
  });
};

const buildSouthRooms = () => {
  const cfg = layout.rooms.northSouth;
  const ids = ['kitchen', 'quarters'];
  const names = ['Kitchen', 'Quarters'];
  cfg.fractions.forEach((fraction, index) => {
    const center = lerp(
      square.left + corridorThickness + cfg.widthCells / 2,
      square.right - corridorThickness - cfg.widthCells / 2,
      fraction
    );
    const rectCells = {
      x: Math.round(center - cfg.widthCells / 2),
      y: square.bottom,
      width: cfg.widthCells,
      height: cfg.depthCells
    };
    addRoom({ id: ids[index], name: names[index], rectCells }, 'south');
  });
};

const buildSideRooms = (side) => {
  const cfg = layout.rooms.eastWest;
  const ids = side === 'west' ? ['engineering', 'maintenance'] : ['hydroponics', 'ai_core'];
  const names = {
    engineering: 'Engineering',
    maintenance: 'Maintenance',
    hydroponics: 'Hydroponics',
    ai_core: 'AI Core'
  };
  cfg.fractions.forEach((fraction, index) => {
    const center = lerp(
      square.top + corridorThickness + cfg.heightCells / 2,
      square.bottom - corridorThickness - cfg.heightCells / 2,
      fraction
    );
    const rectCells = {
      x: side === 'west' ? square.left - cfg.depthCells : square.right,
      y: Math.round(center - cfg.heightCells / 2),
      width: cfg.depthCells,
      height: cfg.heightCells
    };
    addRoom({ id: ids[index], name: names[ids[index]], rectCells }, side);
  });
};

buildNorthRooms();
buildSouthRooms();
buildSideRooms('west');
buildSideRooms('east');

const averageSideCenter = (side, axis) => {
  const rooms = roomRecords.filter((room) => room.side === side);
  if (!rooms.length) {
    const fallback = axis === 'x'
      ? (square.left + square.right) / 2
      : (square.top + square.bottom) / 2;
    return Math.round(fallback);
  }
  const total = rooms.reduce((sum, room) => sum + roomCenter(room)[axis], 0);
  return Math.round(total / rooms.length);
};

const ventRingCenters = Object.freeze({
  north: averageSideCenter('north', 'y') - ventOffset,
  south: averageSideCenter('south', 'y') + ventOffset,
  west: averageSideCenter('west', 'x') - ventOffset,
  east: averageSideCenter('east', 'x') + ventOffset
});

const gatherCenters = (sides, axis) => {
  const values = roomRecords
    .filter((room) => sides.includes(room.side))
    .map((room) => (
      axis === 'x'
        ? room.rectCells.x + Math.floor(room.rectCells.width / 2)
        : room.rectCells.y + Math.floor(room.rectCells.height / 2)
    ));
  return [...new Set(values)].sort((a, b) => a - b);
};

const clampLaneCenter = (axis, value) => (
  axis === 'vertical'
    ? clamp(value, centerBounds.left + laneHalf, centerBounds.right - laneHalf)
    : clamp(value, centerBounds.top + laneHalf, centerBounds.bottom - laneHalf)
);

const centerLanes = [];
const verticalLaneData = [];
const horizontalLaneData = [];

const addCenterLane = (axis, center, index) => {
  const laneCenter = clampLaneCenter(axis, center);
  const rect = axis === 'vertical'
    ? {
        x: Math.round(laneCenter - laneHalf),
        y: centerBounds.top,
        width: laneThickness,
        height: Math.max(1, centerBounds.bottom - centerBounds.top)
      }
    : {
        x: centerBounds.left,
        y: Math.round(laneCenter - laneHalf),
        width: Math.max(1, centerBounds.right - centerBounds.left),
        height: laneThickness
      };
  tagRect(rect, CellType.CORRIDOR);
  markFastLaneCells(rect);
  const record = { id: `center_${axis}_${index}`, rect, type: 'fast_lane', axis, laneCenter };
  centerLanes.push(record);
  if (axis === 'vertical') verticalLaneData.push(record);
  else horizontalLaneData.push(record);
};

const verticalLaneCenters = gatherCenters(['north', 'south'], 'x');
const horizontalLaneCenters = gatherCenters(['west', 'east'], 'y');
verticalLaneCenters.forEach((center, index) => addCenterLane('vertical', center, index));
horizontalLaneCenters.forEach((center, index) => addCenterLane('horizontal', center, index));

const buildConnectors = () => {
  if (!centerLanes.length) return [];
  const connectors = [];
  const horizontalSorted = [...horizontalLaneData].sort((a, b) => a.rect.y - b.rect.y);
  const verticalSorted = [...verticalLaneData].sort((a, b) => a.rect.x - b.rect.x);

  const clampEntryX = (value) => clamp(Math.round(value - laneHalf), innerCorridorBounds.left, innerCorridorBounds.right - laneThickness);
  const clampEntryY = (value) => clamp(Math.round(value - laneHalf), innerCorridorBounds.top, innerCorridorBounds.bottom - laneThickness);

  const addConnector = (room, rect) => {
    if (rect.width <= 0 || rect.height <= 0) return;
    connectors.push({ id: `${room.id}_connector`, rect, type: 'connector' });
  };

  roomRecords.forEach((room) => {
    const centerX = room.rectCells.x + room.rectCells.width / 2;
    const centerY = room.rectCells.y + room.rectCells.height / 2;
    if (room.side === 'north' && horizontalSorted.length) {
      const lane = horizontalSorted[0];
      const x = clampEntryX(centerX);
      const height = lane.rect.y - innerCorridorBounds.top;
      addConnector(room, {
        x,
        y: innerCorridorBounds.top,
        width: laneThickness,
        height: Math.max(0, height)
      });
    } else if (room.side === 'south' && horizontalSorted.length) {
      const lane = horizontalSorted[horizontalSorted.length - 1];
      const x = clampEntryX(centerX);
      const startY = lane.rect.y + lane.rect.height;
      const height = innerCorridorBounds.bottom - startY;
      addConnector(room, {
        x,
        y: startY,
        width: laneThickness,
        height: Math.max(0, height)
      });
    } else if (room.side === 'west' && verticalSorted.length) {
      const lane = verticalSorted[0];
      const y = clampEntryY(centerY);
      const width = lane.rect.x - innerCorridorBounds.left;
      addConnector(room, {
        x: innerCorridorBounds.left,
        y,
        width: Math.max(0, width),
        height: laneThickness
      });
    } else if (room.side === 'east' && verticalSorted.length) {
      const lane = verticalSorted[verticalSorted.length - 1];
      const y = clampEntryY(centerY);
      const startX = lane.rect.x + lane.rect.width;
      const width = innerCorridorBounds.right - startX;
      addConnector(room, {
        x: startX,
        y,
        width: Math.max(0, width),
        height: laneThickness
      });
    }
  });

  return connectors.filter((connector) => connector.rect.width > 0 && connector.rect.height > 0);
};

const connectorCorridors = buildConnectors();
connectorCorridors.forEach((connector) => {
  tagRect(connector.rect, CellType.CORRIDOR);
  markFastLaneCells(connector.rect);
});

const buildVents = () => {
  const vents = [];
  const addVent = (id, rect, type) => {
    if (rect.width <= 0 || rect.height <= 0) return;
    markVentCells(rect);
    vents.push({ id, rect, type });
  };

  const horizontalSpan = Math.max(1, ventRingCenters.east - ventRingCenters.west);
  const verticalSpan = Math.max(1, ventRingCenters.south - ventRingCenters.north);

  addVent('vent_ring_north', {
    x: Math.round(ventRingCenters.west - ventHalf),
    y: Math.round(ventRingCenters.north - ventHalf),
    width: Math.round(horizontalSpan + ventThickness),
    height: ventThickness
  }, 'vent_ring');

  addVent('vent_ring_south', {
    x: Math.round(ventRingCenters.west - ventHalf),
    y: Math.round(ventRingCenters.south - ventHalf),
    width: Math.round(horizontalSpan + ventThickness),
    height: ventThickness
  }, 'vent_ring');

  addVent('vent_ring_west', {
    x: Math.round(ventRingCenters.west - ventHalf),
    y: Math.round(ventRingCenters.north - ventHalf),
    width: ventThickness,
    height: Math.round(verticalSpan + ventThickness)
  }, 'vent_ring');

  addVent('vent_ring_east', {
    x: Math.round(ventRingCenters.east - ventHalf),
    y: Math.round(ventRingCenters.north - ventHalf),
    width: ventThickness,
    height: Math.round(verticalSpan + ventThickness)
  }, 'vent_ring');

  if (ventIncludeConnectors) {
    const connectorForRoom = (room) => {
      const center = roomCenter(room);
      if (room.side === 'north') {
        const yStart = Math.min(center.y, ventRingCenters.north);
        const yEnd = Math.max(center.y, ventRingCenters.north);
        return {
        x: Math.round(center.x - ventHalf),
        y: Math.round(yStart),
        width: ventThickness,
        height: Math.max(1, Math.round(yEnd - yStart))
      };
    }
    if (room.side === 'south') {
      const yStart = Math.min(ventRingCenters.south, center.y);
      const yEnd = Math.max(ventRingCenters.south, center.y);
      return {
        x: Math.round(center.x - ventHalf),
        y: Math.round(yStart),
        width: ventThickness,
        height: Math.max(1, Math.round(yEnd - yStart))
      };
    }
    if (room.side === 'west') {
      const xStart = Math.min(center.x, ventRingCenters.west);
      const xEnd = Math.max(center.x, ventRingCenters.west);
      return {
        x: Math.round(xStart),
        y: Math.round(center.y - ventHalf),
        width: Math.max(1, Math.round(xEnd - xStart)),
        height: ventThickness
      };
    }
    const xStart = Math.min(ventRingCenters.east, center.x);
    const xEnd = Math.max(ventRingCenters.east, center.x);
      return {
        x: Math.round(xStart),
        y: Math.round(center.y - ventHalf),
        width: Math.max(1, Math.round(xEnd - xStart)),
        height: ventThickness
      };
    };

    roomRecords.forEach((room) => {
      const rect = connectorForRoom(room);
      addVent(`${room.id}_vent`, rect, 'vent_connector');
    });
  }

  return vents;
};

const ventSegments = buildVents();
ventSegments.forEach((segment) => tagRect(segment.rect, CellType.VENT));

const reportMaskedCells = (label, mask) => {
  let count = 0;
  for (let i = 0; i < mask.length; i += 1) {
    if (mask[i]) count += 1;
  }
  console.log(`[mapState] ${label} cells marked:`, count);
};

reportMaskedCells('vent', ventCellMask);
reportMaskedCells('fast-lane', fastLaneCellMask);

export const rooms = Object.freeze(roomRecords);
export const doors = Object.freeze(doorRecords);

export const corridors = Object.freeze([
  ...perimeterCorridors.map((corridor) => ({ id: corridor.id, ...rectFromCells(corridor.rect), type: corridor.type || 'perimeter' })),
  ...centerLanes.map((lane) => ({ id: lane.id, ...rectFromCells(lane.rect), type: lane.type })),
  ...connectorCorridors.map((corridor) => ({ id: corridor.id, ...rectFromCells(corridor.rect), type: corridor.type }))
]);

export const vents = Object.freeze(
  ventSegments.map((segment) => ({ id: segment.id, ...rectFromCells(segment.rect), type: segment.type }))
);

export const ventCells = ventCellMask;
export const fastLaneCells = fastLaneCellMask;

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

export const roomById = Object.freeze(buildRoomIndex(roomRecords));

export const mapState = Object.freeze({
  rooms,
  corridors,
  vents,
  shafts,
  doors,
  roomById,
  corridorOuter,
  corridorInner,
  corridorThickness: corridorThickness * layout.cellSize
});
