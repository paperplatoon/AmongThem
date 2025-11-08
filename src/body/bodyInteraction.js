import { gameState } from '../state/gameState.js';
const hasMedicalSample = () => (
  gameState.inventory.some((entry) => entry.type === 'medical_sample')
);

const addMedicalSample = () => {
  if (hasMedicalSample()) return;
  gameState.inventory.push({
    id: 'medical_sample',
    label: 'Medical Sample',
    type: 'medical_sample'
  });
};

export const collectBodySample = () => {
  const body = gameState.body;
  if (body.x == null || body.collectedSample) return;
  addMedicalSample();
  body.collectedSample = true;
};
