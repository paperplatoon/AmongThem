import { config } from './config.js';

const randomCrewName = (roleId) => {
  const names = config.roles[roleId].names || [];
  if (!names.length) return `${config.roles[roleId].name} Crew`; 
  return names[Math.floor(Math.random() * names.length)];
};

const buildEntry = (roleId) => {
  const role = config.roles[roleId];
  return Object.seal({
    id: roleId,
    roleName: role.name,
    roomId: roleId,
    knownName: false,
    hasKeycard: false,
    evidence: [],
    isVictim: false,
    victimIdentified: false,
    isKiller: false,
    killerConfirmed: false,
    personName: randomCrewName(roleId),
    status: 'unknown'
  });
};

const entries = Object.keys(config.roles).map(buildEntry);

const byId = entries.reduce((acc, entry) => {
  acc[entry.id] = entry;
  return acc;
}, {});

export const journalState = Object.seal({
  entries,
  byId
});

const setNameKnown = (entry) => {
  entry.knownName = true;
};

export const markKeycardKnown = (roleId) => {
  const entry = byId[roleId];
  if (!entry) return;
  entry.hasKeycard = true;
  setNameKnown(entry);
};

export const markDeskDiscovered = (roleId) => {
  const entry = byId[roleId];
  if (!entry) return;
  setNameKnown(entry);
};

export const markVictimRole = (roleId) => {
  const entry = byId[roleId];
  if (!entry) return;
  entry.isVictim = true;
  entry.status = 'victim';
};

export const markKillerRole = (roleId) => {
  const entry = byId[roleId];
  if (!entry) return;
  entry.status = 'suspect';
};

export const markVictimIdentified = (roleId) => {
  const entry = byId[roleId];
  if (!entry) return;
  entry.victimIdentified = true;
  entry.status = 'victim';
};

export const markKillerConfirmed = (roleId) => {
  const entry = byId[roleId];
  if (!entry) return;
  entry.killerConfirmed = true;
  entry.status = 'killer';
  entry.isKiller = true;
  entry.killerConfirmed = true;
};
export const markRoleStatus = (roleId, status) => {
  const entry = byId[roleId];
  if (!entry) return;
  entry.status = status;
  if (status === 'suspect') {
    entry.isKiller = false;
  } else if (status === 'killer') {
    entry.isKiller = true;
    entry.killerConfirmed = true;
  } else if (status === 'victim') {
    entry.isVictim = true;
  } else if (status === 'cleared') {
    entry.isKiller = false;
  }
};

export const addEvidenceToJournal = (roleId, evidence) => {
  const entry = byId[roleId];
  if (!entry || !evidence) return;
  entry.evidence.push({ ...evidence });
};
