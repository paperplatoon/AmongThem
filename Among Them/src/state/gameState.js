import { config } from './config.js';
import { rooms, corridors, shafts, doors, roomById } from './mapState.js';
import { playerState } from './playerState.js';
import { doorState } from './doorState.js';
import { cameraState } from './cameraState.js';
import { uiState } from './uiState.js';
import { itemState } from './itemState.js';
import { gridState } from './gridState.js';

export const gameState = Object.seal({
  config,
  grid: gridState,
  map: Object.freeze({ rooms, corridors, shafts, doors, roomById }),
  player: playerState,
  doors: doorState.all,
  doorsById: doorState.byId,
  ui: uiState,
  camera: cameraState,
  items: itemState.all,
  inventory: [],
  pressedKeys: new Set(),
  lastFrameTime: 0
});
