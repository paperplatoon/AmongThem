import { config } from './config.js';
import { rooms, corridors, shafts, doors, roomById } from './mapState.js';
import { playerState } from './playerState.js';
import { doorState } from './doorState.js';
import { cameraState } from './cameraState.js';
import { uiState } from './uiState.js';
import { itemState } from './itemState.js';

export const gameState = Object.seal({
  config,
  rooms,
  corridors,
  shafts,
  doors,
  roomById,
  player: playerState,
  doorsById: doorState.byId,
  doorList: doorState.all,
  pressedKeys: new Set(),
  lastFrameTime: 0,
  camera: cameraState,
  ui: uiState,
  items: itemState.all,
  itemsById: itemState.byId,
  inventory: []
});
