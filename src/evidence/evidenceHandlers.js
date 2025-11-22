export const EVIDENCE_TYPES = Object.freeze({
  DEATH_THREAT: 'death_threat',
  INCRIMINATING: 'incriminating_evidence',
  CLEAN_ALIBI: 'clean_alibi',
  INNOCENCE: 'innocence_evidence',
  MOTIVE: 'motive_evidence',
  WEAPON_CATEGORY: 'weapon_category'
});

export const handleEvidenceItem = (item) => {
  if (!item || !item.type) return false;
  return Object.values(EVIDENCE_TYPES).includes(item.type);
};
