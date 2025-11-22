import { gameState } from './gameState.js';
import { cellToWorldCenter, worldPointToCell, markCell, WORLD_SOLID } from './gridState.js';
import { markVictimRole, markKillerRole, markVictimIdentified, markInnocenceEvidence } from './journalState.js';
import { addIncriminatingEvidence } from './roomProps.js';
import { EVIDENCE_TYPES } from '../evidence/evidenceHandlers.js';
import { seedComputerLocks } from '../hacking/hackingState.js';

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
  return killerRole;
};

const selectSuspects = (victimRole, killerRole) => {
  const pool = roleKeys.filter((role) => role !== victimRole && role !== killerRole);
  const suspects = [killerRole];
  while (suspects.length < 3 && pool.length) {
    const index = Math.floor(Math.random() * pool.length);
    const role = pool.splice(index, 1)[0];
    if (role) suspects.push(role);
  }
  gameState.case.suspects = suspects;
  return suspects;
};

const selectInnocents = (victimRole, killerRole, count = 2) => {
  const pool = roleKeys.filter((role) => role !== victimRole && role !== killerRole);
  const innocents = [];
  while (innocents.length < count && pool.length) {
    const index = Math.floor(Math.random() * pool.length);
    const role = pool.splice(index, 1)[0];
    if (role) innocents.push(role);
  }
  return innocents;
};

const populateSuspectTerminals = (suspects, killerRole) => {
  suspects.forEach((roleId) => {
    const desk = gameState.props.find((prop) => prop.roomId === roleId && prop.type === 'desk');
    if (!desk) return;
    desk.contents = desk.contents || [];
    desk.contents = desk.contents.filter((item) => item.type !== EVIDENCE_TYPES.INCRIMINATING && item.type !== EVIDENCE_TYPES.CLEAN_ALIBI);
    if (roleId === killerRole) {
      desk.contents.push({
        id: `desk_evidence_${roleId}`,
        type: EVIDENCE_TYPES.INCRIMINATING,
        label: 'Incriminating Evidence',
        roleId: killerRole
      });
    } else {
      desk.contents.push({
        id: `desk_alibi_${roleId}`,
        type: EVIDENCE_TYPES.CLEAN_ALIBI,
        label: 'Clean Alibi',
        roleId
      });
    }
    desk.promptText = 'CLICK TO SEARCH';
    desk.isEmpty = false;
  });
};

const addInnocenceEvidenceToVictimDesk = (victimRole, innocents) => {
  const desk = gameState.props.find((prop) => prop.roomId === victimRole && prop.type === 'desk');
  if (!desk) return;

  desk.contents = desk.contents || [];
  desk.contents = desk.contents.filter((item) => item.type !== EVIDENCE_TYPES.INNOCENCE);
  innocents.forEach((roleId) => {
    const roleName = gameState.config.roles[roleId].name;
    desk.contents.push({
      id: `innocence_${victimRole}_${roleId}`,
      type: EVIDENCE_TYPES.INNOCENCE,
      label: `Terminal Log: ${roleName} accounted for`,
      roleId,
      persistent: true
    });
    markInnocenceEvidence(roleId);
  });
  desk.promptText = 'CLICK TO REVIEW';
  desk.isEmpty = false;
};

export const initializeCase = () => {
  const victimRole = seedVictim();
  const killerRole = seedKiller(victimRole);
  const suspects = selectSuspects(victimRole, killerRole);
  const innocents = selectInnocents(victimRole, killerRole);
  addInnocenceEvidenceToVictimDesk(victimRole, innocents);
  gameState.case.innocents = innocents;
  populateSuspectTerminals(suspects, killerRole);
  spawnBody(victimRole);
  spawnScanner();
  seedComputerLocks();
};
