import { gameState } from '../state/gameState.js';
import { hasElectricBootsUpgrade } from '../state/upgradeSelectors.js';

const getConfig = () => gameState.config.stamina;

const hasSprintInput = () => (
  gameState.pressedKeys.has('Shift') &&
  (
    gameState.pressedKeys.has('w') ||
    gameState.pressedKeys.has('a') ||
    gameState.pressedKeys.has('s') ||
    gameState.pressedKeys.has('d') ||
    gameState.pressedKeys.has('ArrowUp') ||
    gameState.pressedKeys.has('ArrowDown') ||
    gameState.pressedKeys.has('ArrowLeft') ||
    gameState.pressedKeys.has('ArrowRight')
  )
);

const clampStamina = (stamina) => {
  if (stamina.current < 0) stamina.current = 0;
  if (stamina.current > stamina.max) stamina.current = stamina.max;
};

const applyDrain = (stamina, deltaSeconds) => {
  const config = getConfig();
  stamina.drainTimer += deltaSeconds;
  while (stamina.drainTimer >= config.drainIntervalSeconds) {
    stamina.drainTimer -= config.drainIntervalSeconds;
    stamina.current -= config.drainPerInterval;
    clampStamina(stamina);
    if (stamina.current <= 0) {
      stamina.isSprinting = false;
      break;
    }
  }
};

export const updateStamina = (deltaSeconds) => {
  const stamina = gameState.player.stamina;
  const config = getConfig();
  const wantsSprint = hasSprintInput();
  const canSprint = stamina.current > 0;
  stamina.isSprinting = wantsSprint && canSprint;
  if (!stamina.isSprinting) {
    stamina.drainTimer = 0;
    return;
  }
  applyDrain(stamina, deltaSeconds);
  if (stamina.current <= 0) stamina.isSprinting = false;
};

export const getCurrentSpeed = () => {
  const player = gameState.player;
  const baseSpeed = player.walkSpeed;
  const stamina = player.stamina;
  const bootMultiplier = hasElectricBootsUpgrade() ? 1.5 : 1;
  if (!stamina.isSprinting) return baseSpeed * bootMultiplier;
  return baseSpeed * gameState.config.stamina.sprintMultiplier * bootMultiplier;
};
