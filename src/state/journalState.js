import { config } from './config.js';

const buildEntry = (roleId) => {
  const role = config.roles[roleId];
  return Object.seal({
    id: roleId,
    roleName: role.name,
    roomId: roleId,
    knownName: false,
    hasKeycard: false,
    evidence: []
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

export const markKeycardKnown = (roleId) => {
  const entry = byId[roleId];
  if (!entry) return;
  entry.hasKeycard = true;
  entry.knownName = true;
};

export const addEvidenceToJournal = (roleId, evidence) => {
  const entry = byId[roleId];
  if (!entry || !evidence) return;
  entry.evidence.push({ ...evidence });
};
