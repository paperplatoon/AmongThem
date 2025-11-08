import { gameState } from './gameState.js';
import { cellToWorldCenter, worldPointToCell, markCell, WORLD_SOLID } from './gridState.js';
import { markVictimRole, markKillerRole, markVictimIdentified } from './journalState.js';
import { addIncriminatingEvidence } from './roomProps.js';

const roleKeys = Object.keys(gameState.config.roles);

const randomRoleKey = () => roleKeys[Math.floor(Math.random() * roleKeys.length)];

const randomMethod = (roleKey) => {
  const methods = gameState.config.roles[roleKey].methods;
  return methods[Math.floor(Math.random() * methods.length)];
};

const chooseVictimRole = () => randomRoleKey();

const chooseKillerRole = (victimRole) => {
  const pool = roleKeys.filter((role) => role !== victimRole);
  return pool[Math.floor(Math.random() * pool.length)];
};

const randomTimeWindow = () => {
  const startHour = Math.floor(Math.random() * 9); // 0-8 inclusive
  const endHour = startHour + 16;
  const format = (hour) => `${hour.toString().padStart(2, '0')}00`;
  return `${format(startHour)}-${format(endHour)}`;
};

const randomRoom = () => gameState.map.rooms[Math.floor(Math.random() * gameState.map.rooms.length)];

const randomCellInsideRoom = (room) => {
  const minCell = worldPointToCell({ x: room.x, y: room.y });
  const maxCell = worldPointToCell({ x: room.x + room.width, y: room.y + room.height });
  const cellX = Math.floor(Math.random() * (maxCell.x - minCell.x - 1)) + minCell.x + 1;
  const cellY = Math.floor(Math.random() * (maxCell.y - minCell.y - 1)) + minCell.y + 1;
  return { cellX, cellY };
};

const spawnBody = (victimRole) => {
  const room = gameState.map.rooms.find((r) => r.id === victimRole) || randomRoom();
  const { cellX, cellY } = randomCellInsideRoom(room);
  const { x, y } = cellToWorldCenter(cellX, cellY);
  Object.assign(gameState.body, { cellX, cellY, x, y, collectedSample: false });
};

const spawnScanner = () => {
  const medbay = gameState.map.rooms.find((room) => room.id === 'medbay');
  if (!medbay) return;
  const cell = worldPointToCell({ x: medbay.x + medbay.width / 2, y: medbay.y + medbay.height / 2 });
  const { x, y } = cellToWorldCenter(cell.x, cell.y);
  Object.assign(gameState.scanner, { cellX: cell.x, cellY: cell.y, x, y, promptActive: false });
};

export const applyCaseObstacles = () => {
  const cellX = gameState.scanner.cellX;
  const cellY = gameState.scanner.cellY;
  if (cellX == null || cellY == null) return;
  markCell(cellX, cellY, WORLD_SOLID);
  gameState.props.forEach((prop) => {
    if (prop.cellX == null) return;
    markCell(prop.cellX, prop.cellY, WORLD_SOLID);
  });
};

const seedVictim = () => {
  const roleKey = chooseVictimRole();
  const role = gameState.config.roles[roleKey];
  const entry = gameState.journal.byId[roleKey];
  const method = randomMethod(roleKey);
  const victimName = entry?.personName ?? role.names[0] ?? role.name;
  const timeWindow = randomTimeWindow();
  gameState.case.victim = {
    roleKey,
    roleName: role.name,
    methodCategory: method.category,
    methodName: method.name
  };
  markVictimRole(roleKey);
  gameState.case.methodCategory = '???';
  gameState.case.victimName = '???';
  gameState.case.victimOccupation = '???';
  gameState.case.timeWindow = '???';
  gameState.case.pending = Object.seal({
    victimName,
    victimOccupation: role.name,
    methodCategory: method.category,
    timeWindow
  });
  return roleKey;
};

const seedKiller = (victimRole) => {
  const killerRole = chooseKillerRole(victimRole);
  markKillerRole(killerRole);
  gameState.case.killer = Object.seal({
    roleKey: killerRole
  });
  addIncriminatingEvidence(gameState.props, killerRole);
  const keyProp = gameState.props.find((prop) => prop.keycardRoleId === killerRole);
  if (keyProp) keyProp.highlightKeycard = true;
};

export const initializeCase = () => {
  const victimRole = seedVictim();
  seedKiller(victimRole);
  spawnBody(victimRole);
  spawnScanner();
};
