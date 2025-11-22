import { gameState } from '../state/gameState.js';
const hasMedicalSample = () => Boolean(gameState.body.playerHasSample);

const addMedicalSample = () => {
  if (hasMedicalSample()) return;
  gameState.body.playerHasSample = true;
};

export const collectBodySample = () => {
  const body = gameState.body;
  if (body.x == null || body.collectedSample) return;
  addMedicalSample();
  body.collectedSample = true;
};
