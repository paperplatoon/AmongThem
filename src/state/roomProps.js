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
  { type: 'cabinet', label: 'Cabinet', count: 20, allowsKeycard: true },
  { type: 'trash', label: 'Trash Can', count: 10, allowsKeycard: false }
]);

const shouldPopulate = (propType) => (
  Math.random() < (PROP_CONTENT_CHANCE[propType] ?? 0)
);

const buildContents = (prop, idPrefix) => {
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

const pointOnWall = (rect) => {
  const side = Math.floor(Math.random() * 4);
  const inset = config.cellSize * 0.75;
  if (side === 0) {
    return { x: randomBetween(rect.x + inset, rect.x + rect.width - inset), y: rect.y + inset };
  }
  if (side === 1) {
    return { x: randomBetween(rect.x + inset, rect.x + rect.width - inset), y: rect.y + rect.height - inset };
  }
  if (side === 2) {
    return { x: rect.x + inset, y: randomBetween(rect.y + inset, rect.y + rect.height - inset) };
  }
  return { x: rect.x + rect.width - inset, y: randomBetween(rect.y + inset, rect.y + rect.height - inset) };
};

const createHallProp = (configEntry, index) => {
  const rect = randomCorridor();
  const point = pointOnWall(rect);
  const cell = worldPointToCell(point);
  const { x, y } = cellToWorldCenter(cell.x, cell.y);
  const contents = buildContents({ type: configEntry.type }, `${configEntry.type}_${index}`);
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
  HALL_PROP_CONFIG.flatMap((entry) => (
    Array.from({ length: entry.count }, (_, index) => createHallProp(entry, index))
  ))
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
