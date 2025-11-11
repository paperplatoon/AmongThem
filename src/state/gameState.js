import { config } from './config.js';
import { rooms, corridors, vents, shafts, doors, roomById, cellTraitMask, CELL_TRAITS } from './mapState.js';
import { playerState } from './playerState.js';
import { doorState } from './doorState.js';
import { cameraState } from './cameraState.js';
import { uiState } from './uiState.js';
import { gridState } from './gridState.js';
import { generateRoomProps } from './roomProps.js';
import { journalState } from './journalState.js';

export const gameState = Object.seal({
  config,
  grid: gridState,
  map: Object.freeze({ rooms, corridors, vents, shafts, doors, roomById, cellTraits: cellTraitMask, cellTraitFlags: CELL_TRAITS }),
  player: playerState,
  doors: doorState.all,
  doorsById: doorState.byId,
  ui: uiState,
  camera: cameraState,
  journal: journalState,
  inventory: [],
  pressedKeys: new Set(),
  lastFrameTime: 0,
  case: {
    victim: null,
    victimName: '???',
    victimOccupation: '???',
    timeWindow: '???',
    identified: false,
    methodCategory: '???',
    methodExact: null
  },
  body: {
    cellX: null,
    cellY: null,
    x: null,
    y: null,
    collectedSample: false
  },
  scanner: {
    cellX: null,
    cellY: null,
    x: null,
    y: null,
    promptActive: false
  },
  props: generateRoomProps(),
  interactions: {
    clickZones: []
  }
});
