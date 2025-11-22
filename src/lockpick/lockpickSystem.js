import { gameState } from '../state/gameState.js';
import { getLockpickById, combinationLength, lockpickDirectionForStep } from '../state/lockpickState.js';
import { finalizeLockUnlock } from './lockpickHelpers.js';

const DIAL_RANGE = 10;
const DIAL_SPEED = 2.2;
const FINAL_HOLD_SECONDS = 1;

const normalize = (value) => {
  let v = value;
  while (v >= DIAL_RANGE) v -= DIAL_RANGE;
  while (v < 0) v += DIAL_RANGE;
  return v;
};

const floorDigit = (value) => Math.floor(normalize(value));
const requiredSteps = () => (gameState.player?.upgrades?.fastLockpick ? Math.min(3, combinationLength) : combinationLength);
const currentTarget = (lock) => (
  lock.stepIndex < requiredSteps() ? lock.combination[lock.stepIndex] : null
);

const resetAttempt = (lock, reason = null) => {
  lock.attemptDigits.length = 0;
  lock.stepIndex = 0;
  lock.state = 'searching';
  lock.dialValue = 0;
  lock.displayDialValue = 0;
  lock.confirmTimer = 0;
  lock.lastDigit = null;
  lock.failureReason = reason;
  if (reason) lock.feedback = { message: reason, expiresAt: performance.now() + 1200 };
};

const latchDigit = (lock) => {
  const index = lock.stepIndex;
  const maxSteps = requiredSteps();
  if (index >= maxSteps) return;
  const digit = lock.combination[index];
  lock.attemptDigits[index] = digit;
  if (lock.discoveredDigits[index] == null) lock.discoveredDigits[index] = digit;
  if (index === maxSteps - 1) {
    lock.state = 'final_hold';
    lock.confirmTimer = 0;
  } else {
    lock.state = 'latched';
  }
};

const directionFromDelta = (delta) => (delta > 0 ? 'right' : delta < 0 ? 'left' : null);

const updateDialValue = (lock, deltaSeconds) => {
  const { leftHeld, rightHeld } = gameState.lockpick;
  let delta = 0;
  if (leftHeld) delta -= DIAL_SPEED * deltaSeconds;
  if (rightHeld) delta += DIAL_SPEED * deltaSeconds;
  if (!delta) return { delta: 0, previousDigit: floorDigit(lock.dialValue) };
  const previousDigit = floorDigit(lock.dialValue);
  lock.dialValue = normalize(lock.dialValue + delta);
  return { delta, previousDigit };
};

const expectedBoundaryDigit = (digit, direction) => {
  if (direction === 'right') return (digit + 1) % 10;
  if (direction === 'left') return (digit + 9) % 10;
  return digit;
};

const handleTransition = (lock, previousDigit, currentDigit, moveDirection) => {
  const target = currentTarget(lock);
  if (lock.state === 'latched' && target != null) {
    if (previousDigit === target && currentDigit !== target) {
      const nextIndex = lock.stepIndex + 1;
      const requiredDirection = lockpickDirectionForStep(nextIndex);
      if (requiredDirection && moveDirection !== requiredDirection) {
        resetAttempt(lock, 'Wrong direction');
        return;
      }
      const expected = expectedBoundaryDigit(target, requiredDirection);
      if (currentDigit === expected) {
        lock.stepIndex = nextIndex;
        lock.state = 'searching';
      } else {
        resetAttempt(lock, 'Overshoot');
      }
    }
    return;
  }
  if (lock.state === 'searching' && target != null) {
    if (currentDigit === target) latchDigit(lock);
    return;
  }
  if (lock.state === 'final_hold') {
    if (currentDigit !== target) resetAttempt(lock, 'Overshoot');
  }
};

const updateFinalHold = (lock, deltaSeconds) => {
  if (lock.state !== 'final_hold') {
    lock.confirmTimer = 0;
    return;
  }
  const steps = requiredSteps();
  const target = lock.combination[Math.max(0, steps - 1)];
  if (floorDigit(lock.dialValue) !== target) {
    resetAttempt(lock, 'Overshoot');
    return;
  }
  lock.confirmTimer += deltaSeconds;
  if (lock.confirmTimer >= FINAL_HOLD_SECONDS) {
    finalizeLockUnlock(lock.id);
    lock.state = 'unlocked';
  }
};

const enforceDirectionInput = (lock, delta) => {
  if (lock.state !== 'searching') return true;
  if (!delta) return true;
  const required = lockpickDirectionForStep(lock.stepIndex);
  if (required === 'right' && delta < 0) {
    resetAttempt(lock, 'Wrong direction');
    return false;
  }
  if (required === 'left' && delta > 0) {
    resetAttempt(lock, 'Wrong direction');
    return false;
  }
  return true;
};

export const updateLockpickSystem = (deltaSeconds) => {
  const lockId = gameState.lockpick.activeId;
  if (!lockId) return;
  const lock = getLockpickById(lockId);
  if (!lock || lock.isUnlocked) return;
  const steps = requiredSteps();
  if (lock.stepIndex >= steps) {
    lock.stepIndex = steps;
    if (lock.state !== 'final_hold') lock.state = 'final_hold';
  }
  const result = updateDialValue(lock, deltaSeconds);
  const deltaMovement = result.delta;
  const previousDigit = result.previousDigit;
  if (!enforceDirectionInput(lock, deltaMovement)) return;
  const currentDigit = floorDigit(lock.dialValue);
  lock.lastDigit = currentDigit;
  if (currentDigit !== previousDigit) {
    const moveDirection = directionFromDelta(deltaMovement);
    handleTransition(lock, previousDigit, currentDigit, moveDirection);
  } else if (lock.state === 'searching') {
    const target = currentTarget(lock);
    if (target != null && currentDigit === target) latchDigit(lock);
  }
  updateFinalHold(lock, deltaSeconds);
  const smoothing = Math.min(1, deltaSeconds * 12);
  let displayDelta = lock.dialValue - lock.displayDialValue;
  if (displayDelta > 5) displayDelta -= 10;
  if (displayDelta < -5) displayDelta += 10;
  lock.displayDialValue = normalize(lock.displayDialValue + displayDelta * smoothing);
  if (lock.feedback && lock.feedback.expiresAt <= performance.now()) lock.feedback = null;
};

export const applyFastLockpickToLocks = () => {
  if (!gameState.player.upgrades?.fastLockpick) return;
  const locks = gameState.lockpicks?.all || [];
  locks.forEach((lock) => {
    if (!lock || lock.isUnlocked) return;
    const steps = requiredSteps();
    if (lock.stepIndex >= steps) {
      lock.stepIndex = steps;
      lock.state = 'final_hold';
      lock.confirmTimer = 0;
    }
  });
};

const countItemInInventory = (type) => (
  gameState.inventory.reduce((total, item) => (
    item?.type === type ? total + 1 : total
  ), 0)
);

const consumeInventoryItem = (type) => {
  const index = gameState.inventory.findIndex((item) => item?.type === type);
  if (index === -1) return false;
  gameState.inventory.splice(index, 1);
  return true;
};

export const useCrowbarOnActiveLock = () => {
  const activeId = gameState.lockpick.activeId;
  if (!activeId) return false;
  const lock = getLockpickById(activeId);
  if (!lock || lock.isUnlocked) return false;
  if (!countItemInInventory('crowbar')) return false;
  if (!consumeInventoryItem('crowbar')) return false;
  finalizeLockUnlock(activeId);
  return true;
};

export const countInventoryItem = (type) => countItemInInventory(type);
export const consumeInventoryItemByType = (type) => consumeInventoryItem(type);
