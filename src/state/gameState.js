import { config } from './config.js';
import { rooms, corridors, vents, shafts, doors, roomById, cellTraitMask, CELL_TRAITS } from './mapState.js';
import { playerState } from './playerState.js';
import { doorState } from './doorState.js';
import { cameraState } from './cameraState.js';
import { uiState } from './uiState.js';
import { gridState } from './gridState.js';
import { generateRoomProps } from './roomProps.js';
import { journalState } from './journalState.js';
import { villainState } from './villainState.js';
import { lockpickState } from './lockpickState.js';
import { visualEffectsState } from './visualEffects.js';

export const gameState = Object.seal({
  testingModeEnabled: false,
  config,
  grid: gridState,
  map: Object.freeze({ rooms, corridors, vents, shafts, doors, roomById, cellTraits: cellTraitMask, cellTraitFlags: CELL_TRAITS }),
  player: playerState,
  doors: doorState.all,
  doorsById: doorState.byId,
  ui: uiState,
  camera: cameraState,
  journal: journalState,
  lockpicks: lockpickState,
  inventory: [],
  pressedKeys: new Set(),
  lastFrameTime: 0,
  computerLocks: Object.seal({
    byPropId: {},
    locks: []
  }),
  hacking: Object.seal({
    active: false,
    lockId: null,
    input: '',
    state: 'idle',
    feedback: null,
    globalModifiers: Object.seal({
      revealSpeed: 1,
      sortSpeed: 1,
      autoCompleteSpeed: 1
    })
  }),
  case: {
    victim: null,
    victimName: '???',
    victimOccupation: '???',
    timeWindow: '???',
    identified: false,
    methodCategory: '???',
    methodExact: null,
    weaponTestResults: {},
    roomTraits: {},
    murderRoomId: null,
    murderCellX: null,
    murderCellY: null,
    npcBioData: {},
    bloodSampleCollected: false,
    timeOfDeath: null,
    timeOfDeathWindow8h: null,
    timeOfDeathWindow4h: null,
    doorLogs: {},
    redHerringRole: null,
    autopsyPerformed: false,

    // Trait-based motive system
    roleTraits: {},         // roleKey → { politicalIdeology, shipRank }
    canonicalMotive: null,  // 'ideology' | 'promotion'
    plausibleSuspects: [],  // array of roleKeys with compatible motives
    weaponEvidence: {},     // roleKey → weaponCategory (for lockers)

    // Debug info (optional, for development/tuning)
    murderDebug: {
      murderabilityScores: {},  // roleKey → murderability score
      killerMotiveScores: {}    // 'roleKey::motive' → final score
    }
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
  bloodDetector: Object.seal({
    active: false,
    countdownRemaining: 0,
    lastReading: null,
    hasBeenUsed: false
  }),
  testingStation: {
    cellX: null,
    cellY: null,
    x: null,
    y: null
  },
  bioDataTerminal: {
    cellX: null,
    cellY: null,
    x: null,
    y: null,
    promptActive: false
  },
  upgradeTerminal: Object.seal({
    cellX: null,
    cellY: null,
    x: null,
    y: null,
    promptActive: false,
    availableUpgrades: [],
    saleUpgradeId: null
  }),
  doorTerminals: [],
  props: generateRoomProps(),
  interactions: {
    clickZones: []
  },
  villain: { ...villainState },
  lockpick: Object.seal({
    activeId: null,
    leftHeld: false,
    rightHeld: false
  }),
  accusation: Object.seal({
    active: false,
    result: 'idle'
  }),
  visualEffects: visualEffectsState
});
