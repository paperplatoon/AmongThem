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
    personName: randomCrewName(roleId)
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
};

export const markKillerRole = (roleId) => {
  const entry = byId[roleId];
  if (!entry) return;
  entry.isKiller = true;
};

export const markVictimIdentified = (roleId) => {
  const entry = byId[roleId];
  if (!entry) return;
  entry.victimIdentified = true;
};

export const markKillerConfirmed = (roleId) => {
  const entry = byId[roleId];
  if (!entry) return;
  entry.killerConfirmed = true;
};

export const addEvidenceToJournal = (roleId, evidence) => {
  const entry = byId[roleId];
  if (!entry || !evidence) return;
  entry.evidence.push({ ...evidence });
};
