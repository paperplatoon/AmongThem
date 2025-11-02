import { gameState } from '../state/gameState.js';
import { distanceToRect } from '../utils/geometry.js';

const clamp01 = (value) => (value < 0 ? 0 : value > 1 ? 1 : value);

const OPEN_THRESHOLD = 0.6;
const CLOSED_THRESHOLD = 0.1;

const doorSpeed = () => 1 / gameState.config.doorAnimationSeconds;

const advanceProgress = (door, delta, speed) => {
  if (door.progress === door.target) return;
  const direction = door.target > door.progress ? 1 : -1;
  const step = delta * speed * direction;
  const next = door.progress + step;
  const reached = direction > 0 ? next >= door.target : next <= door.target;
  door.progress = clamp01(reached ? door.target : next);
};

const syncDoorFlags = (door) => {
  if (door.progress >= OPEN_THRESHOLD) {
    door.progress = Math.min(1, door.progress);
    door.isOpen = true;
    door.state = door.progress >= 1 ? 'open' : 'opening';
    door.target = 1;
    return;
  }
  if (door.progress <= CLOSED_THRESHOLD) {
    door.progress = Math.max(0, door.progress);
    door.isOpen = false;
    door.state = door.progress <= 0 ? 'closed' : 'closing';
    door.target = 0;
    return;
  }
  door.isOpen = door.target === 1;
  door.state = door.target === 1 ? 'opening' : 'closing';
};

const updateDoorTarget = (door, distance) => {
  const openRange = gameState.config.doorOpenRange;
  const closeRange = gameState.config.doorAutoCloseDistance || openRange;
  if (distance <= openRange) {
    door.target = 1;
    if (door.state === 'closed') door.state = 'opening';
    return;
  }
  if (distance >= closeRange) {
    door.target = 0;
    if (door.state === 'open') door.state = 'closing';
  }
};

const updateDoor = (door, delta, speed) => {
  const distance = distanceToRect(gameState.player, door.rect);
  updateDoorTarget(door, distance);
  advanceProgress(door, delta, speed);
  syncDoorFlags(door);
};

export const updateDoors = (deltaSeconds) => {
  const speed = doorSpeed();
  gameState.doors.forEach((door) => updateDoor(door, deltaSeconds, speed));
};
