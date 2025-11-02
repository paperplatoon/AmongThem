import { gameState } from '../state/gameState.js';
import { distanceBetween } from '../utils/geometry.js';

const pickupRange = 64;

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

export const handleBodyInteraction = () => {
  const body = gameState.body;
  if (body.x == null || body.collectedSample) return;
  if (!gameState.pressedKeys.has('e')) return;
  const distance = distanceBetween(gameState.player, body);
  if (distance > pickupRange) return;
  addMedicalSample();
  body.collectedSample = true;
  gameState.pressedKeys.delete('e');
};
