import { gameState } from '../state/gameState.js';
import { PASSWORD_WORDS } from '../state/passwords.js';
import { hasMasterVirusUpgrade } from '../state/upgradeSelectors.js';
import { consumeInventoryItemByType, countInventoryItem } from '../lockpick/lockpickSystem.js';
import { openOverlay, OverlayId } from '../state/overlayManager.js';

const uppercaseWord = (word) => (word || '').toUpperCase();

const defaultHackingSession = () => ({
  active: false,
  lockId: null,
  input: '',
  state: 'idle',
  feedback: null
});

const setFeedback = (message, type = 'info', duration = 1.5) => {
  const now = nowSeconds();
  gameState.hacking.feedback = { message, type, expiresAt: now + duration };
};

const defaultModifiers = () => Object.seal({
  revealSpeed: 1,
  sortSpeed: 1,
  autoCompleteSpeed: 1,
  orderedReveal: false
});

const hasEfficientHack = () => Boolean(gameState.player.upgrades?.efficientHack);
const nowSeconds = () => (gameState.lastFrameTime || performance.now()) / 1000;

const applyEfficientHackToLock = (lock) => {
  if (!lock || !hasEfficientHack()) return;
  lock.scrambled = [...lock.letters];
  lock.modifiers.orderedReveal = true;
};

const shuffleArray = (letters) => {
  const array = [...letters];
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

const createLockEntry = (prop, password) => {
  const normalized = uppercaseWord(password).slice(0, gameState.config.hacking.passwordLength);
  const letters = normalized.split('');
  const scrambled = shuffleArray(letters);
  return Object.seal({
    id: prop.id,
    propId: prop.id,
    roleId: prop.roomId,
    password: normalized,
    letters,
    scrambled,
    revealed: Array(letters.length).fill(false),
    sorted: Array(letters.length).fill(false),
    status: 'locked',
    revealElapsed: 0,
    sortElapsed: 0,
    autoCompleteElapsed: 0,
    sortIndex: 0,
    started: false,
    modifiers: defaultModifiers()
  });
};

const findPropById = (propId) => gameState.props.find((prop) => prop.id === propId);

const setHackingSession = (partial) => {
  Object.assign(gameState.hacking, partial);
};

const resetHackingSession = () => {
  setHackingSession(defaultHackingSession());
};

const isLockHacked = (lock) => lock?.status === 'hacked';

const shufflePasswords = (words) => {
  const pool = [...words];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool;
};

const listRoleOrder = () => Object.keys(gameState.config.roles);

const indexComputersByRoom = () => {
  const map = new Map();
  gameState.props.forEach((prop) => {
    if (prop.type !== 'computer') return;
    if (!prop.roomId) return;
    map.set(prop.roomId, prop);
  });
  return map;
};

const clearExistingLocks = () => {
  const { computerLocks } = gameState;
  computerLocks.locks.length = 0;
  const map = computerLocks.byPropId;
  Object.keys(map).forEach((key) => delete map[key]);
};

const samplePasswords = (count) => {
  if (count <= 0) return [];
  const candidates = PASSWORD_WORDS.filter((word) => word.length === gameState.config.hacking.passwordLength);
  if (count > candidates.length) {
    throw new Error(`[hacking] Not enough passwords to assign ${count} locks.`);
  }
  return shufflePasswords(candidates).slice(0, count).map(uppercaseWord);
};

export const seedComputerLocks = () => {
  exitHackingSession();
  clearExistingLocks();
  const computers = indexComputersByRoom();
  const roles = listRoleOrder().filter((roleId) => computers.has(roleId));
  if (!roles.length) return;
  const passwords = samplePasswords(roles.length);
  roles.forEach((roleId, index) => {
    const prop = computers.get(roleId);
    if (!prop) return;
    const password = passwords[index];
    if (!password) return;
    const lock = createLockEntry(prop, password);
    applyEfficientHackToLock(lock);
    gameState.computerLocks.locks.push(lock);
    gameState.computerLocks.byPropId[prop.id] = lock;
    prop.computerLockId = lock.id;
  });
};

export const getComputerLockByPropId = (propId) => (
  propId ? gameState.computerLocks.byPropId[propId] ?? null : null
);

export const listComputerLocks = () => gameState.computerLocks.locks;

export const isPropComputerLocked = (prop) => {
  if (!prop) return false;
  const lock = getComputerLockByPropId(prop.id);
  if (!lock) return false;
  return !isLockHacked(lock);
};

export const applyEfficientHackToLocks = () => {
  if (!hasEfficientHack()) return;
  listComputerLocks().forEach((lock) => applyEfficientHackToLock(lock));
};

export const startHackingForProp = (propId) => {
  const lock = getComputerLockByPropId(propId);
  if (!lock) return false;
  if (isLockHacked(lock)) return false;
  setHackingSession({
    active: true,
    lockId: lock.id,
    input: '',
    state: 'revealing'
  });
  if (!lock.started) {
    lock.started = true;
    lock.revealElapsed = 0;
    revealNextLetter(lock);
  }
  return true;
};

export const exitHackingSession = () => {
  resetHackingSession();
};

const unlockComputerLock = (lock) => {
  if (!lock) return;
  if (isLockHacked(lock)) return;
  lock.status = 'hacked';
  lock.revealed.fill(true);
  lock.sorted.fill(true);
  lock.scrambled = [...lock.letters];
  const prop = findPropById(lock.propId);
  if (prop) {
    prop.computerLockId = null;
  }
};

const openComputerOverlay = (lock) => {
  if (!lock) return;
  const prop = findPropById(lock.propId);
  if (!prop) return;
  gameState.ui.openContainerId = prop.id;
  openOverlay(OverlayId.CONTAINER);
};

export const useComputerVirusOnActiveLock = () => {
  const lock = activeLock();
  if (!lock || isLockHacked(lock)) return false;
  if (countInventoryItem('computer_virus') <= 0) return false;
  if (!consumeInventoryItemByType('computer_virus')) return false;
  unlockComputerLock(lock);
  exitHackingSession();
  openComputerOverlay(lock);
  return true;
};

export const useMasterVirusOnActiveLock = () => {
  if (!hasMasterVirusUpgrade()) return false;
  const lock = activeLock();
  if (!lock || isLockHacked(lock)) return false;
  unlockComputerLock(lock);
  exitHackingSession();
  openComputerOverlay(lock);
  return true;
};

const activeLock = () => getComputerLockByPropId(gameState.hacking.lockId);

const maxInputLength = () => gameState.config.hacking.passwordLength;

const setInput = (value) => {
  gameState.hacking.input = value.toUpperCase().slice(0, maxInputLength());
  gameState.hacking.feedback = null;
  tryAutoSubmit();
};

const appendLetter = (letter) => {
  if (gameState.hacking.input.length >= maxInputLength()) return;
  setInput(`${gameState.hacking.input}${letter}`);
};

const deleteLetter = () => {
  if (!gameState.hacking.input.length) return;
  setInput(gameState.hacking.input.slice(0, -1));
};

const tryAutoSubmit = () => {
  if (!gameState.hacking.active) return;
  const lock = activeLock();
  if (!lock) return;
  const guess = gameState.hacking.input;
  if (guess.length !== lock.password.length) return;
  if (guess !== lock.password) return;
  unlockComputerLock(lock);
  exitHackingSession();
  openComputerOverlay(lock);
};

export const submitHackingInput = () => {
  const lock = activeLock();
  if (!lock) return false;
  const guess = gameState.hacking.input;
  if (!guess || guess.length !== lock.password.length) return false;
  if (guess === lock.password) {
    unlockComputerLock(lock);
    exitHackingSession();
    openComputerOverlay(lock);
    return true;
  }
  setFeedback('Incorrect password', 'error');
  return false;
};

const isLetterKey = (key) => key.length === 1 && key >= 'a' && key <= 'z';

export const handleHackingKeyInput = (key) => {
  if (!gameState.hacking.active) return false;
  if (key === 'Backspace') {
    deleteLetter();
    return true;
  }
  if (key === 'Enter') {
    submitHackingInput();
    return true;
  }
  if (key === 'Escape') {
    exitHackingSession();
    return true;
  }
  if (isLetterKey(key)) {
    appendLetter(key.toUpperCase());
    return true;
  }
  return true;
};

export const isHackingActive = () => gameState.hacking.active;

const unrevealedIndices = (lock) => lock.revealed.reduce((acc, flag, index) => {
  if (!flag) acc.push(index);
  return acc;
}, []);

function revealNextLetter(lock) {
  const indices = unrevealedIndices(lock);
  if (!indices.length) return false;
  const ordered = lock.modifiers.orderedReveal;
  const index = ordered
    ? Math.min(...indices)
    : indices[Math.floor(Math.random() * indices.length)];
  lock.revealed[index] = true;
  return true;
}

const allLettersRevealed = (lock) => lock.revealed.every(Boolean);
const allLettersSorted = (lock) => lock.sortIndex >= lock.scrambled.length;
const isScrambledSolved = (lock) => lock.scrambled.join('') === lock.password;

function sortNextLetter(lock) {
  const targetIndex = lock.sortIndex;
  if (targetIndex >= lock.scrambled.length) return false;
  const desired = lock.password[targetIndex];
  if (lock.scrambled[targetIndex] === desired) {
    lock.sorted[targetIndex] = true;
    lock.sortIndex += 1;
    return true;
  }
  const currentIndex = lock.scrambled.findIndex((letter, idx) => letter === desired && idx !== targetIndex);
  if (currentIndex === -1) {
    lock.sortIndex += 1;
    return true;
  }
  const tempLetter = lock.scrambled[targetIndex];
  lock.scrambled[targetIndex] = lock.scrambled[currentIndex];
  lock.scrambled[currentIndex] = tempLetter;
  const tempReveal = lock.revealed[targetIndex];
  lock.revealed[targetIndex] = lock.revealed[currentIndex];
  lock.revealed[currentIndex] = tempReveal;
  lock.sorted[targetIndex] = true;
  lock.sortIndex += 1;
  return true;
}

const globalHackSpeed = () => Math.max(gameState.player.upgrades?.hackSpeedMultiplier || 1, 1);

function revealIntervalForLock(lock) {
  const base = gameState.config.hacking.revealIntervalSeconds;
  const modifier = Math.max(lock.modifiers.revealSpeed || 1, 0.1) * globalHackSpeed();
  return Math.max(0.2, base / modifier);
}

function sortIntervalForLock(lock) {
  const base = gameState.config.hacking.sortingIntervalSeconds;
  const modifier = Math.max(lock.modifiers.sortSpeed || 1, 0.1) * globalHackSpeed();
  return Math.max(0.2, base / modifier);
}

function autoCompleteDelayForLock(lock) {
  const base = gameState.config.hacking.autoCompleteDelaySeconds;
  const modifier = Math.max(lock.modifiers.autoCompleteSpeed || 1, 0.1) * globalHackSpeed();
  return Math.max(0.5, base / modifier);
}

export const updateHackingSystem = (deltaSeconds) => {
  clearExpiredFeedback();
  if (!gameState.hacking.active) return;
  const lock = activeLock();
  if (!lock || isLockHacked(lock)) return;
  if (!lock.started) {
    lock.started = true;
    lock.revealElapsed = 0;
    revealNextLetter(lock);
  }
  if (!allLettersRevealed(lock)) {
    lock.revealElapsed += deltaSeconds;
    const interval = revealIntervalForLock(lock);
    while (lock.revealElapsed >= interval && !allLettersRevealed(lock)) {
      lock.revealElapsed -= interval;
      revealNextLetter(lock);
    }
    return;
  }
  if (!allLettersSorted(lock)) {
    lock.sortElapsed += deltaSeconds;
    const interval = sortIntervalForLock(lock);
    while (lock.sortElapsed >= interval && !allLettersSorted(lock)) {
      lock.sortElapsed -= interval;
      sortNextLetter(lock);
    }
    if (allLettersRevealed(lock) && isScrambledSolved(lock)) {
      unlockComputerLock(lock);
      exitHackingSession();
    }
    return;
  }
  lock.autoCompleteElapsed += deltaSeconds;
  if (isScrambledSolved(lock)) {
    unlockComputerLock(lock);
    exitHackingSession();
    return;
  }
  if (lock.autoCompleteElapsed >= autoCompleteDelayForLock(lock)) {
    unlockComputerLock(lock);
    exitHackingSession();
  }
};

const clearExpiredFeedback = () => {
  const feedback = gameState.hacking.feedback;
  if (!feedback) return;
  if (feedback.expiresAt && feedback.expiresAt <= nowSeconds()) {
    gameState.hacking.feedback = null;
  }
};

export const describeHackingPhase = (lock) => {
  if (!lock) return 'idle';
  if (isLockHacked(lock)) return 'complete';
  if (!lock.started || !allLettersRevealed(lock)) return 'revealing';
  if (!allLettersSorted(lock)) return 'sorting';
  return 'auto_complete';
};

export const timeUntilNextEvent = (lock) => {
  if (!lock) return 0;
  const phase = describeHackingPhase(lock);
  if (phase === 'revealing') {
    const interval = revealIntervalForLock(lock);
    return Math.max(0, interval - (lock.revealElapsed || 0));
  }
  if (phase === 'sorting') {
    const interval = sortIntervalForLock(lock);
    return Math.max(0, interval - (lock.sortElapsed || 0));
  }
  if (phase === 'auto_complete') {
    const delay = autoCompleteDelayForLock(lock);
    return Math.max(0, delay - (lock.autoCompleteElapsed || 0));
  }
  return 0;
};
