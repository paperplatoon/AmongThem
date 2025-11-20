import { markRoleStatus } from '../state/journalState.js';

export const EVIDENCE_TYPES = Object.freeze({
  DEATH_THREAT: 'death_threat',
  INCRIMINATING: 'incriminating_evidence',
  CLEAN_ALIBI: 'clean_alibi'
});

const handlers = Object.freeze({
  [EVIDENCE_TYPES.DEATH_THREAT]: (evidence) => {
    if (!evidence?.roleId) return;
    markRoleStatus(evidence.roleId, 'suspect');
  },
  [EVIDENCE_TYPES.INCRIMINATING]: (evidence) => {
    if (!evidence?.roleId) return;
    markRoleStatus(evidence.roleId, 'killer');
  },
  [EVIDENCE_TYPES.CLEAN_ALIBI]: (evidence) => {
    if (!evidence?.roleId) return;
    markRoleStatus(evidence.roleId, 'cleared');
  }
});

export const handleEvidenceItem = (item) => {
  if (!item || !item.type) return false;
  const handler = handlers[item.type];
  if (!handler) return false;
  handler(item);
  return true;
};
