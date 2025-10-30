import { config } from './config.js';
import { mapState } from './mapState.js';

const startX = (mapState.corridorOuter.left + mapState.corridorOuter.right) / 2;
const startY = mapState.corridorOuter.top + mapState.constants.corridorThickness / 2;

export const playerState = Object.seal({
  x: startX,
  y: startY,
  angle: 0,
  velocityX: 0,
  velocityY: 0,
  walkSpeed: config.walkSpeed,
  sprintSpeed: config.sprintSpeed
});
