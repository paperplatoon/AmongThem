import { mapState } from './mapState.js';
import { worldPointToCell, cellToWorldCenter } from './gridState.js';
import { createItemFromDefinition } from './itemDefinitions.js';
import { config } from './config.js';

const ROOM_PROP_TYPES = ['desk', 'bed', 'trash', 'locker'];

const PROP_CONTENT_CHANCE = Object.freeze({
  locker: 0.25,
  desk: 0.10,
  trash: 0.05,
  bed: 0.01,
  table: 0.08,
  cabinet: 0.12
});

const HALL_PROP_CONFIG = Object.freeze([
  { type: 'table', label: 'Table', count: 20, allowsKeycard: true },
  { type: 'cabinet', label: 'Cabinet', count: 50, allowsKeycard: true },
  { type: 'trash', label: 'Trash Can', count: 10, allowsKeycard: false }
]);

const shouldPopulate = (propType) => (
  Math.random() < (PROP_CONTENT_CHANCE[propType] ?? 0)
);

const hallwayLoot = (idPrefix) => {
  if (Math.random() < 0.05) return [createItemFromDefinition(`${idPrefix}_energy`, 'energy_bar')];
  if (Math.random() < 0.05) return [createItemFromDefinition(`${idPrefix}_oxygen`, 'oxygen_canister')];
  return [];
};

const buildContents = (prop, idPrefix) => {
  if (prop.source === 'hallway') return hallwayLoot(idPrefix);
  if (!shouldPopulate(prop.type)) return [];
  const item = createItemFromDefinition(`${idPrefix}_${prop.type}`);
  return item ? [item] : [];
};

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
  return Object.seal({
    id: `${room.id}_${propType}_${index}`,
    roomId: room.id,
    type: propType,
    label: propType.charAt(0).toUpperCase() + propType.slice(1),
    cellX: cell.x,
    cellY: cell.y,
    x,
    y,
    lockId: isLocker ? `${room.id}_locker` : null,
    requiresKey: isLocker,
    contents,
    promptActive: false,
    promptText: 'CLICK TO SEARCH',
    isEmpty: false,
    searched: false,
    source: 'room',
    allowsKeycard: false,
    containsKeycard: false,
    keycardRoleId: null,
    highlightKeycard: false
  });
};

const randomCorridor = () => mapState.corridors[Math.floor(Math.random() * mapState.corridors.length)];

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
  const props = [...createRoomProps(), ...createHallProps()];
  assignKeycardsToProps(props);
  return props;
};
