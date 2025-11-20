import { config } from './config.js';
import { mapState } from './mapState.js';
import { worldPointToCell } from './gridState.js';

const startX = (mapState.corridorOuter.left + mapState.corridorOuter.right) / 2;
const startY = mapState.corridorOuter.top + mapState.corridorThickness / 2;

const startCell = worldPointToCell({ x: startX, y: startY });

export const playerState = Object.seal({
  x: startX,
  y: startY,
  cellX: startCell.x,
  cellY: startCell.y,
  angle: 0,
  velocityX: 0,
  velocityY: 0,
  lastMoveDirection: { x: 0, y: 1 },
  walkSpeed: config.walkSpeed,
  stamina: Object.seal({
    current: config.stamina.max,
    max: config.stamina.max,
    drainTimer: 0,
    isSprinting: false
  }),
  oxygen: Object.seal({
    current: config.oxygen.max,
    max: config.oxygen.max,
    secondsRemaining: config.oxygen.depletionSeconds,
    depleted: false
  }),
  money: 0,
  health: Object.seal({
    current: config.player.healthMax,
    max: config.player.healthMax
  }),
  keycards: new Set(),
  taser: Object.seal({
    hasTaser: false,
    cooldownRemaining: 0,
    bursts: []
  }),
  upgrades: Object.seal({
    keycardLocator: false,
    hackSpeedMultiplier: 1
  })
});
