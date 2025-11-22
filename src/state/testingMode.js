import { gameState } from './gameState.js';
const CREDIT_BONUS = 1000;

export const isTestingModeEnabled = () => Boolean(gameState.testingModeEnabled);

export const setTestingModeEnabled = (enabled) => {
  if (gameState.testingModeEnabled === enabled) return;
  gameState.testingModeEnabled = enabled;
  gameState.player.upgrades.testingMasterVirus = enabled;
  gameState.player.upgrades.testingSkeletonKey = enabled;
  if (enabled) {
    gameState.player.money += CREDIT_BONUS;
  }
};

export const toggleTestingMode = () => {
  setTestingModeEnabled(!isTestingModeEnabled());
};
