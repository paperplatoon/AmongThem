import { gameState } from './gameState.js';
import { cellToWorldCenter, worldPointToCell, markCell, WORLD_SOLID } from './gridState.js';
import { markVictimRole, markKillerRole, markVictimIdentified, markInnocenceEvidence, markWeaponCategory } from './journalState.js';
import { EVIDENCE_TYPES } from '../evidence/evidenceHandlers.js';
import { seedComputerLocks } from '../hacking/hackingState.js';
import { initializeTestingStation, generateWeaponTestResults } from './weaponTestingState.js';

const roleKeys = Object.keys(gameState.config.roles);

const WEAPON_CATEGORIES = Object.freeze([
  { key: 'poisoning', label: 'Poisoning', lockerLabel: 'Poison' },
  { key: 'stabbing', label: 'Stabbing', lockerLabel: 'Stabbing weapon' },
  { key: 'blunt', label: 'Blunt Impact', lockerLabel: 'Blunt weapon' },
  { key: 'gun', label: 'Gunshot', lockerLabel: 'Gun' },
  { key: 'strangulation', label: 'Strangulation', lockerLabel: 'Strangling weapon' }
]);

const randomRoleKey = () => roleKeys[Math.floor(Math.random() * roleKeys.length)];

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
  if (cellX != null && cellY != null) {
    markCell(cellX, cellY, WORLD_SOLID);
  }
  const stationX = gameState.testingStation.cellX;
  const stationY = gameState.testingStation.cellY;
  if (stationX != null && stationY != null) {
    markCell(stationX, stationY, WORLD_SOLID);
  }
  gameState.props.forEach((prop) => {
    if (prop.cellX == null) return;
    markCell(prop.cellX, prop.cellY, WORLD_SOLID);
  });
};

const seedVictim = () => {
  const roleKey = chooseVictimRole();
  const role = gameState.config.roles[roleKey];
  const entry = gameState.journal.byId[roleKey];
  const method = WEAPON_CATEGORIES[Math.floor(Math.random() * WEAPON_CATEGORIES.length)];
  const victimName = entry?.personName ?? role.names[0] ?? role.name;
  const timeWindow = randomTimeWindow();
  gameState.case.victim = {
    roleKey,
    roleName: role.name,
    methodCategory: method.key,
    methodName: method.label
  };
  markVictimRole(roleKey);
  gameState.case.methodCategory = method.label;
  gameState.case.murderWeaponCategory = method.key;
  gameState.case.victimName = '???';
  gameState.case.victimOccupation = '???';
  gameState.case.timeWindow = '???';
  gameState.case.pending = Object.seal({
    victimName,
    victimOccupation: role.name,
    methodCategory: method.label,
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
  return killerRole;
};

const buildSuspectPools = (victimRole, killerRole) => {
  const pool = roleKeys.filter((role) => role !== victimRole && role !== killerRole);
  const innocents = [];
  while (innocents.length < 2 && pool.length) {
    const index = Math.floor(Math.random() * pool.length);
    const role = pool.splice(index, 1)[0];
    if (role) innocents.push(role);
  }
  const motiveCandidates = [killerRole];
  while (motiveCandidates.length < 3 && pool.length) {
    const index = Math.floor(Math.random() * pool.length);
    const role = pool.splice(index, 1)[0];
    if (role) motiveCandidates.push(role);
  }
  const remaining = [...pool];
  gameState.case.suspects = motiveCandidates;
  return { innocents, motiveCandidates, remainingInnocents: remaining };
};

const randomWeaponCategory = (excludeKey = null) => {
  const pool = WEAPON_CATEGORIES.filter((cat) => cat.key !== excludeKey);
  if (!pool.length) return WEAPON_CATEGORIES[0];
  return pool[Math.floor(Math.random() * pool.length)];
};

const assignLockerWeaponCategories = (victimRole, killerRole, motiveCandidates, nonMotiveRoles) => {
  const assignments = new Map();
  const murderCategory = WEAPON_CATEGORIES.find((cat) => cat.key === gameState.case.murderWeaponCategory) || randomWeaponCategory();
  assignments.set(killerRole, murderCategory);
  const murderPartnerCount = Math.min(2, nonMotiveRoles.length);
  const murderPartners = nonMotiveRoles.slice(0, murderPartnerCount);
  murderPartners.forEach((roleId) => assignments.set(roleId, murderCategory));
  motiveCandidates.forEach((roleId) => {
    if (roleId === killerRole) return;
    assignments.set(roleId, assignments.get(roleId) || randomWeaponCategory(murderCategory.key));
  });
  roleKeys.forEach((roleId) => {
    if (roleId === victimRole) {
      if (!assignments.has(roleId)) assignments.set(roleId, randomWeaponCategory());
      return;
    }
    if (!assignments.has(roleId)) assignments.set(roleId, randomWeaponCategory());
  });
  gameState.props.forEach((prop) => {
    if (prop.type !== 'locker' || !prop.roomId) return;
    const category = assignments.get(prop.roomId);
    if (!category) return;
    prop.contents = prop.contents || [];
    prop.contents = prop.contents.filter((item) => item.type !== 'weapon_category');
    prop.contents.push({
      id: `weapon_${prop.roomId}`,
      type: 'weapon_category',
      label: category.lockerLabel || category.label,
      category: category.key,
      persistent: false
    });
    prop.promptText = 'CLICK TO SEARCH';
    prop.isEmpty = false;
  });
};

const populateSuspectTerminals = (suspects, killerRole, motiveSuspects, innocenceSuspects) => {
  suspects.forEach((roleId) => {
    const computer = gameState.props.find((prop) => prop.roomId === roleId && prop.type === 'computer');
    if (!computer) return;
    computer.contents = computer.contents || [];
    computer.contents = computer.contents.filter((item) => item.type !== EVIDENCE_TYPES.INCRIMINATING && item.type !== EVIDENCE_TYPES.CLEAN_ALIBI);
    if (motiveSuspects.includes(roleId)) {
      computer.contents.push({
        id: `computer_motive_${roleId}`,
        type: EVIDENCE_TYPES.MOTIVE,
        label: `Possible Motive: ${gameState.config.roles[roleId].name}`,
        roleId,
        persistent: true
      });
    }
    if (innocenceSuspects.includes(roleId)) {
      computer.contents.push({
        id: `computer_innocence_${roleId}`,
        type: EVIDENCE_TYPES.INNOCENCE,
        label: `Terminal Log: ${gameState.config.roles[roleId].name} accounted for`,
        roleId,
        persistent: true
      });
      markInnocenceEvidence(roleId);
    }
    computer.promptText = 'CLICK TO SEARCH';
    computer.isEmpty = false;
  });
};

const addInnocenceEvidenceToVictimComputer = (victimRole, innocents) => {
  const computer = gameState.props.find((prop) => prop.roomId === victimRole && prop.type === 'computer');
  if (!computer) return;

  computer.contents = computer.contents || [];
  computer.contents = computer.contents.filter((item) => item.type !== EVIDENCE_TYPES.INNOCENCE);
  innocents.forEach((roleId) => {
    const roleName = gameState.config.roles[roleId].name;
    computer.contents.push({
      id: `innocence_${victimRole}_${roleId}`,
      type: EVIDENCE_TYPES.INNOCENCE,
      label: `Terminal Log: ${roleName} accounted for`,
      roleId,
      persistent: true
    });
    markInnocenceEvidence(roleId);
  });
  computer.promptText = 'CLICK TO REVIEW';
  computer.isEmpty = false;
};

export const initializeCase = () => {
  const victimRole = seedVictim();
  const killerRole = seedKiller(victimRole);
  const { innocents, motiveCandidates, remainingInnocents } = buildSuspectPools(victimRole, killerRole);
  addInnocenceEvidenceToVictimComputer(victimRole, innocents);
  gameState.case.innocents = [...innocents, ...remainingInnocents];
  populateSuspectTerminals([...motiveCandidates, ...remainingInnocents], killerRole, motiveCandidates, remainingInnocents);
  assignLockerWeaponCategories(victimRole, killerRole, motiveCandidates, remainingInnocents);
  spawnBody(victimRole);
  spawnScanner();
  initializeTestingStation();
  gameState.case.weaponTestResults = generateWeaponTestResults();
  seedComputerLocks();
};
