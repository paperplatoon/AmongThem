import { mapState, cellTraitMask, CELL_TRAITS } from './mapState.js';
import { worldPointToCell, cellToWorldCenter, withinBounds as gridWithinBounds, isCellSolid } from './gridState.js';
import { createItemFromDefinition } from './itemDefinitions.js';
import { config } from './config.js';
import { registerLockpickForProp } from './lockpickState.js';

const ROOM_PROP_TYPES = ['desk', 'bed', 'trash', 'locker'];

const PROP_CONTENT_CHANCE = Object.freeze({
  locker: 0.25,
  desk: 0.25,
  bed: 0.25,
  trash: 0.10,
  table: 0.125,
  cabinet: 0.125
});

const HALL_PROP_CONFIG = Object.freeze([
  { type: 'table', label: 'Table', count: 10, allowsKeycard: true },
  { type: 'cabinet', label: 'Cabinet', count: 10, allowsKeycard: true },
  { type: 'trash', label: 'Trash Can', count: 10, allowsKeycard: false }
]);

const VENDING_OPTIONS = Object.freeze([
  Object.freeze({ itemId: 'energy_bar', label: 'Energy Bar', cost: 30 }),
  Object.freeze({ itemId: 'bandage', label: 'Bandage', cost: 50 }),
  Object.freeze({ itemId: 'taser', label: 'Taser', cost: config.taser.cost, unique: true }),
  Object.freeze({ itemId: 'keycard_locator', label: 'Keycard Locator', cost: 150, unique: true }),
  Object.freeze({ itemId: 'faster_hack', label: 'Faster Hack', cost: 100, unique: false })
]);

const INNER_CACHE_CONFIG = Object.freeze({
  marginCells: 6,
  maxSamples: 24,
  creditChance: 0.2,
  minSpacingCells: 8
});

const distanceChebyshev = (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));

const shouldPopulate = (propType) => (
  Math.random() < (PROP_CONTENT_CHANCE[propType] ?? 0)
);

const LOOT_TABLE = [
  { id: 'energy_bar', weight: 6 },
  { id: 'bandage', weight: 4 },
  { id: 'oxygen_canister', weight: 1 }
];

const pickWeightedItemId = () => {
  const total = LOOT_TABLE.reduce((sum, entry) => sum + entry.weight, 0);
  let roll = Math.random() * total;
  for (let i = 0; i < LOOT_TABLE.length; i += 1) {
    roll -= LOOT_TABLE[i].weight;
    if (roll <= 0) return LOOT_TABLE[i].id;
  }
  return LOOT_TABLE[LOOT_TABLE.length - 1].id;
};

const maybeAddCredits = (contents, idPrefix) => {
  if (Math.random() >= config.creditsChance) return;
  const amountRange = config.creditsMax - config.creditsMin;
  const amount = config.creditsMin + Math.floor(Math.random() * (amountRange + 1));
  const creditItem = createItemFromDefinition(`${idPrefix}_credits`, 'credits');
  if (!creditItem) return;
  creditItem.amount = amount;
  contents.push(creditItem);
};

const hallwayLoot = (idPrefix) => {
  const contents = [];
  maybeAddCredits(contents, idPrefix);
  if (!shouldPopulate('hallway')) return contents;
  const itemId = pickWeightedItemId();
  const item = createItemFromDefinition(`${idPrefix}_${itemId}`, itemId);
  if (item) contents.push(item);
  return contents;
};

const buildContents = (prop, idPrefix) => {
  const contents = [];
  maybeAddCredits(contents, idPrefix);
  if (prop.source === 'hallway') return [...contents, ...hallwayLoot(idPrefix)];
  if (!shouldPopulate(prop.type)) return contents;
  const itemId = pickWeightedItemId();
  const item = createItemFromDefinition(`${idPrefix}_${prop.type}`, itemId);
  if (item) contents.push(item);
  return contents;
};

const fastLaneCells = () => {
  const mask = cellTraitMask;
  const flags = CELL_TRAITS;
  if (!mask || !flags) return [];
  const cells = [];
  const width = config.gridWidth;
  for (let index = 0; index < mask.length; index += 1) {
    if (!(mask[index] & flags.FAST_LANE)) continue;
    if (mask[index] & flags.OUTER_HALL) continue;
    const x = index % width;
    const y = Math.floor(index / width);
    cells.push({ x, y });
  }
  return cells;
};

const pickSpacedCells = (candidates, count, minDistance = 2) => {
  const picked = [];
  const grid = candidates.reduce((acc, cell) => {
    if (!acc[cell.x]) acc[cell.x] = {};
    acc[cell.x][cell.y] = true;
    return acc;
  }, {});
  const step = Math.max(1, minDistance);
  for (let x = 0; x < config.gridWidth && picked.length < count; x += step) {
    for (let y = 0; y < config.gridHeight && picked.length < count; y += step) {
      if (!grid[x] || !grid[x][y]) continue;
      const cell = { x, y };
      if (picked.some((p) => distanceChebyshev(p, cell) < minDistance)) continue;
      picked.push(cell);
    }
  }
  if (picked.length < count) {
    const remaining = [...candidates];
    for (let i = 0; i < remaining.length && picked.length < count; i += 1) {
      const cell = remaining[i];
      if (picked.some((p) => distanceChebyshev(p, cell) < minDistance)) continue;
      picked.push(cell);
    }
  }
  return picked;
};

const innerBand = () => ({
  minX: INNER_CACHE_CONFIG.marginCells,
  maxX: config.gridWidth - INNER_CACHE_CONFIG.marginCells,
  minY: INNER_CACHE_CONFIG.marginCells,
  maxY: config.gridHeight - INNER_CACHE_CONFIG.marginCells
});

const withinInnerBand = (cell) => {
  const band = innerBand();
  return (
    cell.x >= band.minX &&
    cell.x <= band.maxX &&
    cell.y >= band.minY &&
    cell.y <= band.maxY
  );
};

const biasedFastLaneCells = () => fastLaneCells().filter(withinInnerBand);

const distanceFromCenter = (cell) => {
  const centerX = config.gridWidth / 2;
  const centerY = config.gridHeight / 2;
  return Math.hypot(cell.x - centerX, cell.y - centerY);
};

const shuffleCells = (cells) => {
  const list = [...cells];
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
};

const sampleBiasedCells = (cells, maxSamples, stretch = 6) => {
  const sorted = [...cells].sort((a, b) => distanceFromCenter(a) - distanceFromCenter(b));
  const windowSize = Math.min(sorted.length, maxSamples * stretch);
  const windowed = sorted.slice(0, windowSize);
  return shuffleCells(windowed);
};

const chebyshevDistance = (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));

const pickSpacedBiasedCells = (cells, maxSamples, spacing) => {
  const minSpacing = Math.max(0, spacing || 0);
  if (!minSpacing) return cells.slice(0, maxSamples);
  const picked = [];
  const candidates = cells;
  for (let i = 0; i < candidates.length && picked.length < maxSamples; i += 1) {
    const candidate = candidates[i];
    if (picked.every((entry) => chebyshevDistance(entry, candidate) >= minSpacing)) {
      picked.push(candidate);
    }
  }
  return picked;
};

const assureWallNudge = (cell) => {
  const offsets = [
    { dx: -1, dy: 0 },
    { dx: 1, dy: 0 },
    { dx: 0, dy: -1 },
    { dx: 0, dy: 1 }
  ];
  for (const o of offsets) {
    const nx = cell.x + o.dx;
    const ny = cell.y + o.dy;
    if (!gridWithinBounds(nx, ny)) continue;
    if (isCellSolid(nx, ny)) return { x: cell.x + o.dx * 0.25, y: cell.y + o.dy * 0.25 };
  }
  return cell;
};

const fallbackSegments = (spacing) => (
  pickSpacedBiasedCells(
    shuffleCells(fastLaneCells()),
    INNER_CACHE_CONFIG.maxSamples,
    spacing
  )
);

const innerCacheCells = () => {
  const attempts = [
    INNER_CACHE_CONFIG.minSpacingCells,
    Math.max(4, INNER_CACHE_CONFIG.minSpacingCells - 2),
    0
  ];
  for (let i = 0; i < attempts.length; i += 1) {
    const spacing = attempts[i];
    const biased = pickSpacedBiasedCells(
      sampleBiasedCells(biasedFastLaneCells(), INNER_CACHE_CONFIG.maxSamples),
      INNER_CACHE_CONFIG.maxSamples,
      spacing
    );
    if (biased.length >= INNER_CACHE_CONFIG.maxSamples) return biased;
    const fallback = fallbackSegments(spacing);
    if (fallback.length >= INNER_CACHE_CONFIG.maxSamples) return fallback;
    if (biased.length) return biased;
    if (fallback.length) return fallback;
  }
  return fallbackSegments(0);
};

const maybeAddInnerCacheCredits = (contents, idPrefix) => {
  const creditItem = createItemFromDefinition(`${idPrefix}_credits`, 'credits');
  if (!creditItem) return;
  creditItem.amount = 20 + Math.floor(Math.random() * 11);
  contents.push(creditItem);
};

const ensureCacheContents = (contents, idPrefix) => {
  if (contents.length) return;
  const fallback = createItemFromDefinition(`${idPrefix}_fallback`, 'energy_bar');
  if (fallback) contents.push(fallback);
};

const createInnerCorridorLoot = () => {
  const points = innerCacheCells();
  const caches = [];
  points.sort((a, b) => (a.y * config.gridWidth + a.x) - (b.y * config.gridWidth + b.x));
  points.forEach((cell, idx) => {
    const nudged = assureWallNudge(cell);
    const snappedX = Math.round(nudged.x);
    const snappedY = Math.round(nudged.y);
    const { x, y } = cellToWorldCenter(snappedX, snappedY);
    const contents = [];
    maybeAddInnerCacheCredits(contents, `inner_cache_${idx}`);
    if (Math.random() < 0.1) {
      const energy = createItemFromDefinition(`inner_cache_${idx}_energy`, 'energy_bar');
      if (energy) contents.push(energy);
    }
    if (Math.random() < 0.1) {
      const oxygen = createItemFromDefinition(`inner_cache_${idx}_oxygen`, 'oxygen_canister');
      if (oxygen) contents.push(oxygen);
    }
    ensureCacheContents(contents, `inner_cache_${idx}`);
    caches.push(Object.seal({
      id: `inner_cache_${idx}`,
      roomId: 'fast_lane',
      type: 'cache',
      label: 'Cache',
      cellX: snappedX,
      cellY: snappedY,
      x,
      y,
      lockId: null,
      requiresKey: false,
      contents,
      promptActive: false,
      promptText: 'CLICK TO SEARCH',
      isEmpty: false,
      searched: false,
      source: 'inner_corridor',
      allowsKeycard: false,
      containsKeycard: false,
      keycardRoleId: null,
      highlightKeycard: false
    }));
  });
  return caches.slice(0, 20);
};

const createVendingMachine = (corridorId, suffix) => {
  const corridor = mapState.corridors.find((entry) => entry.id === corridorId);
  if (!corridor) return null;
  const center = {
    x: corridor.x + corridor.width / 2,
    y: corridor.y + corridor.height / 2
  };
  const cell = worldPointToCell(center);
  const { x, y } = cellToWorldCenter(cell.x, cell.y);
  return Object.seal({
    id: `vending_${suffix}`,
    roomId: 'corridor',
    type: 'vending_machine',
    label: 'Vending',
    cellX: cell.x,
    cellY: cell.y,
    x,
    y,
    lockId: null,
    requiresKey: false,
    contents: [],
    promptActive: false,
    promptText: 'CLICK TO BUY',
    isEmpty: false,
    searched: false,
    source: 'vending',
    allowsKeycard: false,
    containsKeycard: false,
    keycardRoleId: null,
    highlightKeycard: false,
    vendingOptions: VENDING_OPTIONS.map((option) => ({ ...option }))
  });
};

const createVendingMachines = () => [
  createVendingMachine('corridor_west', 'west'),
  createVendingMachine('corridor_east', 'east')
].filter(Boolean);

const createRoomProp = (room, propType, index) => {
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
  const isLocker = propType === 'locker';
  const contents = buildContents({ type: propType }, room.id);
  const lockId = isLocker ? `${room.id}_locker` : null;
  const prop = {
    id: `${room.id}_${propType}_${index}`,
    roomId: room.id,
    type: propType,
    label: propType.charAt(0).toUpperCase() + propType.slice(1),
    cellX: cell.x,
    cellY: cell.y,
    x,
    y,
    lockId,
    requiresKey: false,
    computerLockId: null,
    contents,
    promptActive: false,
    promptText: 'CLICK TO SEARCH',
    isEmpty: false,
    searched: false,
    source: 'room',
    allowsKeycard: false,
    containsKeycard: false,
    keycardRoleId: null,
    highlightKeycard: false,
    lockpickId: null,
    lockpickUnlocked: !isLocker
  };
  if (isLocker) {
    const lock = registerLockpickForProp(prop.id);
    prop.lockpickId = lock?.id ?? prop.id;
    prop.lockpickUnlocked = Boolean(lock?.isUnlocked);
  }
  return Object.seal(prop);
};

const perimeterCorridors = mapState.corridors.filter((corridor) => corridor.type === 'perimeter');
const randomCorridor = () => perimeterCorridors[Math.floor(Math.random() * perimeterCorridors.length)];

const randomBetween = (min, max) => min + Math.random() * (max - min);

const wallPoint = (rect, side) => {
  const inset = config.cellSize * 0.75;
  const clearance = config.cellSize * 2.5;
  if (side === 0) return { x: randomBetween(rect.x + clearance, rect.x + rect.width - clearance), y: rect.y + inset };
  if (side === 1) return { x: randomBetween(rect.x + clearance, rect.x + rect.width - clearance), y: rect.y + rect.height - inset };
  if (side === 2) return { x: rect.x + inset, y: randomBetween(rect.y + clearance, rect.y + rect.height - clearance) };
  return { x: rect.x + rect.width - inset, y: randomBetween(rect.y + clearance, rect.y + rect.height - clearance) };
};

const tooClose = (cell, taken) => taken.some((occupied) => (
  Math.abs(cell.x - occupied.x) < 2 && Math.abs(cell.y - occupied.y) < 2
));

const pointInsideRect = (point, rect) => (
  point.x >= rect.x && point.x <= rect.x + rect.width &&
  point.y >= rect.y && point.y <= rect.y + rect.height
);

const touchesWall = (point, side) => {
  const offset = config.cellSize * 0.8;
  const normal = [
    { x: 0, y: -offset },
    { x: 0, y: offset },
    { x: -offset, y: 0 },
    { x: offset, y: 0 }
  ][side];
  const probe = { x: point.x + normal.x, y: point.y + normal.y };
  return !mapState.corridors.some((rect) => pointInsideRect(probe, rect));
};

const doorCells = mapState.doors.flatMap((door) => {
  const cells = [];
  const min = worldPointToCell({ x: door.x, y: door.y });
  const max = worldPointToCell({ x: door.x + door.width, y: door.y + door.height });
  for (let x = min.x - 1; x <= max.x + 1; x++) {
    for (let y = min.y - 1; y <= max.y + 1; y++) cells.push({ x, y });
  }
  return cells;
});

const nearDoor = (cell) => doorCells.some((doorCell) => (
  Math.abs(cell.x - doorCell.x) <= 1 && Math.abs(cell.y - doorCell.y) <= 1
));

const pickHallCell = (taken) => {
  for (let attempts = 0; attempts < 40; attempts++) {
    const corridor = randomCorridor();
    const side = Math.floor(Math.random() * 4);
    const point = wallPoint(corridor, side);
    const cell = worldPointToCell(point);
    if (tooClose(cell, taken)) continue;
    if (!touchesWall(point, side)) continue;
     if (nearDoor(cell)) continue;
    taken.push(cell);
    return cell;
  }
  return null;
};

const createHallProp = (configEntry, index, taken) => {
  const cell = pickHallCell(taken);
  if (!cell) return null;
  const { x, y } = cellToWorldCenter(cell.x, cell.y);
  const contents = buildContents({ type: configEntry.type, source: 'hallway' }, `${configEntry.type}_${index}`);
  return Object.seal({
    id: `hall_${configEntry.type}_${index}`,
    roomId: 'corridor',
    type: configEntry.type,
    label: configEntry.label,
    cellX: cell.x,
    cellY: cell.y,
    x,
    y,
    lockId: null,
    requiresKey: false,
    contents,
    promptActive: false,
    promptText: 'CLICK TO SEARCH',
    isEmpty: false,
    searched: false,
    source: 'hallway',
    allowsKeycard: configEntry.allowsKeycard,
    containsKeycard: false,
    keycardRoleId: null,
    highlightKeycard: false
  });
};

const createHallProps = () => (
  (() => {
    const taken = [];
    return HALL_PROP_CONFIG.flatMap((entry) => (
      Array.from({ length: entry.count }, (_, index) => createHallProp(entry, index, taken)).filter(Boolean)
    ));
  })()
);

const createRoomProps = () => (
  mapState.rooms.flatMap((room) => (
    ROOM_PROP_TYPES.map((type, index) => createRoomProp(room, type, index))
  ))
);

const keycardRoleIds = Object.keys(config.roles);

const createKeycardItem = (roleId) => ({
  id: `keycard_${roleId}`,
  type: 'keycard',
  label: `${config.roles[roleId].name} Keycard`,
  lockerId: `${roleId}_locker`,
  roleId
});

const assignKeycardsToProps = (props) => {
  const eligible = props.filter((prop) => prop.allowsKeycard && prop.type !== 'trash');
  keycardRoleIds.forEach((roleId) => {
    if (!eligible.length) return;
    const index = Math.floor(Math.random() * eligible.length);
    const prop = eligible.splice(index, 1)[0];
    const item = createKeycardItem(roleId);
    prop.contents.push(item);
    prop.promptText = 'CLICK TO SEARCH';
    prop.isEmpty = false;
    prop.containsKeycard = true;
    prop.keycardRoleId = roleId;
  });
};

export const addIncriminatingEvidence = (props, killerRoleId) => {
  if (!killerRoleId) return;
  const locker = props.find((prop) => prop.lockId === `${killerRoleId}_locker`);
  if (!locker) return;
  locker.contents.push({
    id: `evidence_${killerRoleId}`,
    type: 'incriminating_evidence',
    label: 'Incriminating Evidence',
    roleId: killerRoleId
  });
  locker.promptText = 'CLICK TO SEARCH';
  locker.isEmpty = false;
};

export const generateRoomProps = () => {
  const props = [
    ...createRoomProps(),
    ...createHallProps(),
    ...createInnerCorridorLoot(),
    ...createVendingMachines()
  ];
  assignKeycardsToProps(props);
  return props;
};
