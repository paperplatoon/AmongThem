import { config } from './config.js';

const defaultLocation = Object.freeze({
  x: null,
  y: null,
  cellX: null,
  cellY: null
});

export const villainState = Object.seal({
  ...defaultLocation,
  heading: 0,
  speed: config.villain.wanderSpeed,
  state: 'idle',
  hasSeenPlayer: false,
  jumpTimer: 0,
  pauseTimer: 0,
  isPaused: false,
  lastSeenPlayerAt: null,
  lastSeenTimestamp: 0,
  timeSinceLastSeen: Infinity,
  searchUntil: 0,
  searchTimer: 0,
  isSearching: false,
  searchOrigin: null,
  lostPlayerState: false,
  spawnInitialized: false,
  targetCellX: null,
  targetCellY: null,
  isEscaped: false,
  escapeAccumulated: 0,
  canEscapeAt: 0
});
