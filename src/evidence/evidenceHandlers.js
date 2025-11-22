export const EVIDENCE_TYPES = Object.freeze({
  DEATH_THREAT: 'death_threat',
  INCRIMINATING: 'incriminating_evidence',
  CLEAN_ALIBI: 'clean_alibi'
});

export const handleEvidenceItem = (item) => {
  return Boolean(item && item.type && EVIDENCE_TYPES[item.type.toUpperCase()]);
};
