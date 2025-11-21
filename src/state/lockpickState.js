const DIGIT_COUNT = 10;
const COMBINATION_LENGTH = 5;
export const lockpickDirections = Object.freeze(['right', 'left', 'right', 'left', 'right']);

export const lockpickDirectionForStep = (index) => lockpickDirections[index] || lockpickDirections[lockpickDirections.length - 1];

const randomDigit = () => Math.floor(Math.random() * DIGIT_COUNT);

const createCombination = () => {
  const digits = [];
  for (let i = 0; i < COMBINATION_LENGTH; i += 1) {
    let digit = randomDigit();
    while (i > 0 && digit === digits[i - 1]) {
      digit = randomDigit();
    }
    digits.push(digit);
  }
  return digits;
};

const defaultLockpickEntry = (id, propId) => Object.seal({
  id,
  propId,
  combination: createCombination(),
  discoveredDigits: Array(COMBINATION_LENGTH).fill(null),
  attemptDigits: [],
  dialValue: 0,
  displayDialValue: 0,
  stepIndex: 0,
  state: 'searching',
  lastDigit: null,
  status: 'locked',
  isUnlocked: false,
  failureReason: null,
  confirmTimer: 0,
  feedback: null
});

export const lockpickState = Object.seal({
  byId: Object.create(null),
  all: []
});

export const getLockpickById = (id) => (
  id ? lockpickState.byId[id] ?? null : null
);

export const registerLockpickForProp = (propId) => {
  if (!propId) return null;
  const existing = lockpickState.byId[propId];
  if (existing) return existing;
  const entry = defaultLockpickEntry(propId, propId);
  lockpickState.byId[propId] = entry;
  lockpickState.all.push(entry);
  return entry;
};

export const markLockpickUnlocked = (lockId) => {
  const lock = getLockpickById(lockId);
  if (!lock) return;
  lock.isUnlocked = true;
  lock.status = 'unlocked';
  lock.failureReason = null;
};

export const combinationLength = COMBINATION_LENGTH;
