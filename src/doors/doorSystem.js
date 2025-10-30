import { gameState } from '../state/gameState.js';
import { getDoorDefinition } from '../state/selectors.js';
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

const isPlayerBeyondDoor = (doorDefinition) => {
  const centerX = doorDefinition.x + doorDefinition.width / 2;
  const centerY = doorDefinition.y + doorDefinition.height / 2;
  const player = gameState.player;
  if (doorDefinition.side === 'north') return player.y > centerY;
  if (doorDefinition.side === 'south') return player.y < centerY;
  if (doorDefinition.side === 'west') return player.x > centerX;
  return player.x < centerX;
};

const updateDoorTarget = (door, distance, inRoom) => {
  const openRange = gameState.config.doorOpenRange;
  const closeRange = gameState.config.doorAutoCloseDistance;
  if (distance <= openRange) {
    door.target = 1;
    if (door.state === 'closed') door.state = 'opening';
    return;
  }
  if (distance >= closeRange && !inRoom) {
    door.target = 0;
    if (door.state === 'open') door.state = 'closing';
  }
};

const updateDoor = (door, delta, speed) => {
  const rect = getDoorDefinition(door);
  const distance = distanceToRect(gameState.player, rect);
  const inRoom = isPlayerBeyondDoor(rect);
  updateDoorTarget(door, distance, inRoom);
  advanceProgress(door, delta, speed);
  syncDoorFlags(door);
};

export const updateDoors = (deltaSeconds) => {
  const speed = doorSpeed();
  gameState.doorList.forEach((door) => updateDoor(door, deltaSeconds, speed));
};
