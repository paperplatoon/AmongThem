import { gameState } from './gameState.js';
const MONEY_FLOOR = 1000;

export const isTestingModeEnabled = () => Boolean(gameState.testingModeEnabled);

export const setTestingModeEnabled = (enabled) => {
  if (gameState.testingModeEnabled === enabled) return;
  gameState.testingModeEnabled = enabled;
  gameState.player.upgrades.testingMasterVirus = enabled;
  gameState.player.upgrades.testingSkeletonKey = enabled;
};

export const toggleTestingMode = () => {
  setTestingModeEnabled(!isTestingModeEnabled());
};

export const applyTestingModeEffects = () => {
  if (!isTestingModeEnabled()) return;
  if (gameState.player.money < MONEY_FLOOR) {
    gameState.player.money = MONEY_FLOOR;
  }
};
