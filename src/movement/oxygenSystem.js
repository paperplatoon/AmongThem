import { gameState } from '../state/gameState.js';

const getConfig = () => gameState.config.oxygen;

const secondsToPercent = (seconds, config) => (seconds / config.depletionSeconds) * config.max;

const updateOxygenValues = (oxygen) => {
  const config = getConfig();
  oxygen.current = Math.max(0, secondsToPercent(oxygen.secondsRemaining, config));
  oxygen.depleted = oxygen.secondsRemaining <= 0;
};

export const updateOxygen = (deltaSeconds) => {
  const oxygen = gameState.player.oxygen;
  if (oxygen.depleted) return;
  oxygen.secondsRemaining -= deltaSeconds;
  if (oxygen.secondsRemaining < 0) oxygen.secondsRemaining = 0;
  updateOxygenValues(oxygen);
};

export const syncOxygenState = () => {
  const oxygen = gameState.player.oxygen;
  if (oxygen.secondsRemaining < 0) oxygen.secondsRemaining = 0;
  if (oxygen.secondsRemaining > getConfig().depletionSeconds) oxygen.secondsRemaining = getConfig().depletionSeconds;
  updateOxygenValues(oxygen);
};
