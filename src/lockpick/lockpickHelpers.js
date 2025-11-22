import { gameState } from '../state/gameState.js';
import { markLockpickUnlocked } from '../state/lockpickState.js';
import { openOverlay, OverlayId } from '../state/overlayManager.js';

const findPropByLockId = (lockId) => (
  gameState.props.find((prop) => prop.lockpickId === lockId) || null
);

export const finalizeLockUnlock = (lockId, { openContainer = true } = {}) => {
  if (!lockId) return;
  markLockpickUnlocked(lockId);
  const prop = findPropByLockId(lockId);
  if (prop) prop.lockpickUnlocked = true;
  if (gameState.lockpick.activeId === lockId) {
    gameState.lockpick.activeId = null;
    gameState.lockpick.leftHeld = false;
    gameState.lockpick.rightHeld = false;
    gameState.ui.openLockpickId = null;
  }
  if (openContainer && prop) {
    gameState.ui.openContainerId = prop.id;
    openOverlay(OverlayId.CONTAINER);
  }
};
