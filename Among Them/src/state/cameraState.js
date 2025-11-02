import { config } from './config.js';
import { playerState } from './playerState.js';

const half = (value) => value / 2;

export const cameraState = Object.seal({
  width: config.canvasWidth,
  height: config.canvasHeight,
  x: playerState.x - half(config.canvasWidth),
  y: playerState.y - half(config.canvasHeight)
});
