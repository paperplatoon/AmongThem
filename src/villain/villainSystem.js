import { gameState } from '../state/gameState.js';
import { cellToWorldCenter, worldPointToCell } from '../state/gridState.js';
import { hasLineOfSight } from '../utils/lineOfSight.js';
import { distanceBetween } from '../utils/geometry.js';

let fastLaneCells = null;

const getTraitMask = () => gameState.map.cellTraits;
const getTraitFlags = () => gameState.map.cellTraitFlags;
const withinBounds = (x, y) => x >= 0 && y >= 0 && x < gameState.grid.width && y < gameState.grid.height;

const isFastLaneCell = (x, y) => {
  if (!withinBounds(x, y)) return false;
  const mask = getTraitMask();
  const flags = getTraitFlags();
  if (!mask || !flags) return false;
  const index = y * gameState.grid.width + x;
  return Boolean(mask[index] & flags.FAST_LANE);
};

const gatherFastLaneCells = () => {
  if (fastLaneCells) return fastLaneCells;
  const mask = getTraitMask();
  const flags = getTraitFlags();
  if (!mask || !flags) {
    fastLaneCells = [];
    return fastLaneCells;
  }
  const cells = [];
  const width = gameState.grid.width;
  for (let index = 0; index < mask.length; index += 1) {
    if (!(mask[index] & flags.FAST_LANE)) continue;
    const cellX = index % width;
    const cellY = Math.floor(index / width);
    cells.push({ x: cellX, y: cellY });
  }
  fastLaneCells = cells;
  return fastLaneCells;
};

const randomFastLaneCell = () => {
  const cells = gatherFastLaneCells();
  if (!cells.length) return null;
  return cells[Math.floor(Math.random() * cells.length)];
};

const pickFastLaneNear = (targetCell, radius = 4) => {
  const cells = gatherFastLaneCells();
  if (!cells.length) return null;
  const radiusSq = radius * radius;
  const near = cells.filter((cell) => {
    const dx = cell.x - targetCell.x;
    const dy = cell.y - targetCell.y;
    return dx * dx + dy * dy <= radiusSq;
  });
  if (near.length) return near[Math.floor(Math.random() * near.length)];
  return nearestFastLaneCell(targetCell);
};

const nearestFastLaneCell = (targetCell) => {
  const cells = gatherFastLaneCells();
  if (!cells.length) return null;
  let best = cells[0];
  let bestDist = Infinity;
  cells.forEach((cell) => {
    const dx = cell.x - targetCell.x;
    const dy = cell.y - targetCell.y;
    const dist = dx * dx + dy * dy;
    if (dist < bestDist) {
      bestDist = dist;
      best = cell;
    }
  });
  return best;
};

const setVillainPosition = (villain, cell) => {
  if (!cell) return;
  const { x, y } = cellToWorldCenter(cell.x, cell.y);
  villain.x = x;
  villain.y = y;
  villain.cellX = cell.x;
  villain.cellY = cell.y;
};

const assignWanderTarget = (villain) => {
  const next = randomFastLaneCell();
  if (!next) return;
  villain.targetCellX = next.x;
  villain.targetCellY = next.y;
};

const ensureSpawned = (villain) => {
  if (villain.spawnInitialized) return;
  const startCell = randomFastLaneCell();
  if (!startCell) return;
  setVillainPosition(villain, startCell);
  assignWanderTarget(villain);
  villain.state = 'wander';
  villain.spawnInitialized = true;
};

const distanceToTarget = (villain, targetWorld) => (
  Math.hypot(targetWorld.x - villain.x, targetWorld.y - villain.y)
);

const normalize = (dx, dy) => {
  const length = Math.hypot(dx, dy);
  if (!length) return { x: 0, y: 0 };
  return { x: dx / length, y: dy / length };
};

const moveTowardsTarget = (villain, targetWorld, deltaSeconds, speed) => {
  const dx = targetWorld.x - villain.x;
  const dy = targetWorld.y - villain.y;
  const distance = Math.hypot(dx, dy);
  if (!distance) return true;
  const maxStep = speed * deltaSeconds;
  const reached = distance <= maxStep;
  const direction = normalize(dx, dy);
  const step = reached ? distance : maxStep;
  const nextX = villain.x + direction.x * step;
  const nextY = villain.y + direction.y * step;
  const cell = worldPointToCell({ x: nextX, y: nextY });
  if (!isFastLaneCell(cell.x, cell.y)) {
    assignWanderTarget(villain);
    return true;
  }
  villain.x = nextX;
  villain.y = nextY;
  villain.heading = Math.atan2(direction.y, direction.x);
  villain.cellX = cell.x;
  villain.cellY = cell.y;
  return reached;
};

const updateRoam = (villain, deltaSeconds, speed) => {
  if (villain.targetCellX == null || villain.targetCellY == null) assignWanderTarget(villain);
  if (villain.targetCellX == null || villain.targetCellY == null) return;
  const targetWorld = cellToWorldCenter(villain.targetCellX, villain.targetCellY);
  const reached = moveTowardsTarget(villain, targetWorld, deltaSeconds, speed);
  if (reached || distanceToTarget(villain, targetWorld) < 4) {
    assignWanderTarget(villain);
  }
};

const updateWander = (villain, deltaSeconds) => {
  updateRoam(villain, deltaSeconds, gameState.config.villain.wanderSpeed);
};

const updateLostRoam = (villain, deltaSeconds) => {
  updateRoam(villain, deltaSeconds, gameState.config.villain.lostSpeed);
};

const updateChase = (villain, deltaSeconds) => {
  const playerCell = worldPointToCell({ x: gameState.player.x, y: gameState.player.y });
  const targetWorld = cellToWorldCenter(playerCell.x, playerCell.y);
  const dx = gameState.player.x - villain.x;
  const dy = gameState.player.y - villain.y;
  const distanceCells = Math.hypot(dx, dy) / gameState.grid.cellSize;
  const slowDistance = gameState.config.villain.chaseSlowDistanceCells;
  const chaseSpeed = distanceCells > slowDistance
    ? gameState.config.villain.chaseSpeedFar
    : gameState.config.villain.chaseSpeed;
  moveTowardsTarget(villain, targetWorld, deltaSeconds, chaseSpeed);
};

const updateLostPlayer = (villain, deltaSeconds) => {
  if (!villain.isSearching) return;
  if (villain.searchTimer >= villain.searchUntil) {
    villain.isSearching = false;
    villain.searchOrigin = null;
    villain.searchTimer = 0;
    return;
  }
  if (!villain.searchOrigin) assignSearchOrigin(villain);
  if (!villain.searchOrigin) return;
  const targetWorld = villain.searchOrigin;
  const lostSpeed = gameState.config.villain.lostSpeed;
  const reached = moveTowardsTarget(villain, targetWorld, deltaSeconds, lostSpeed);
  if (reached) assignSearchOrigin(villain);
};

const angleBetween = (a, b) => {
  const dot = a.x * b.x + a.y * b.y;
  const mag = Math.hypot(a.x, a.y) * Math.hypot(b.x, b.y);
  if (!mag) return Math.PI;
  return Math.acos(Math.min(1, Math.max(-1, dot / mag)));
};

const villainCanSeePlayer = (villain) => {
  const player = gameState.player;
  const vectorToPlayer = { x: player.x - villain.x, y: player.y - villain.y };
  const distance = Math.hypot(vectorToPlayer.x, vectorToPlayer.y);
  const cellDistance = distance / gameState.grid.cellSize;
  if (cellDistance > gameState.config.villain.sightRangeCells) return false;
  const headingVector = { x: Math.cos(villain.heading), y: Math.sin(villain.heading) };
  const angle = angleBetween(headingVector, vectorToPlayer);
  const halfCone = (gameState.config.villain.sightAngleDeg * Math.PI) / 180 / 2;
  if (angle > halfCone) return false;
  const villainCell = { x: villain.cellX, y: villain.cellY };
  const playerCell = worldPointToCell({ x: player.x, y: player.y });
  return hasLineOfSight(villainCell, playerCell, gameState.config.villain.sightRangeCells);
};

const recordPlayerSight = (villain) => {
  villain.lastSeenPlayerAt = { x: gameState.player.x, y: gameState.player.y };
  villain.timeSinceLastSeen = 0;
};

const triggerSightedPlayer = (villain) => {
  villain.hasSeenPlayer = true;
  villain.state = 'chasePlayer';
  villain.jumpTimer = 0.3;
  recordPlayerSight(villain);
};

const decayTimers = (villain, deltaSeconds) => {
  if (villain.jumpTimer > 0) villain.jumpTimer = Math.max(0, villain.jumpTimer - deltaSeconds);
  if (villain.pauseTimer > 0) villain.pauseTimer = Math.max(0, villain.pauseTimer - deltaSeconds);
  villain.isPaused = villain.pauseTimer > 0;
  villain.timeSinceLastSeen += deltaSeconds;
  if (villain.isSearching) villain.searchTimer += deltaSeconds;
};

const assignSearchOrigin = (villain) => {
  const sourceWorld = villain.lastSeenPlayerAt || cellToWorldCenter(villain.cellX, villain.cellY);
  const sourceCell = worldPointToCell(sourceWorld);
  const chosen = pickFastLaneNear(sourceCell, 6);
  if (!chosen) {
    villain.searchOrigin = null;
    return;
  }
  villain.searchOrigin = cellToWorldCenter(chosen.x, chosen.y);
};

const enterLostPlayerState = (villain) => {
  if (!villain.lostPlayerState) villain.lostPlayerState = true;
  villain.state = 'lostPlayer';
  assignSearchOrigin(villain);
  villain.searchTimer = 0;
  villain.searchUntil = gameState.config.villain.searchDurationSeconds;
  villain.isSearching = true;
  villain.targetCellX = null;
  villain.targetCellY = null;
};

const applyPlayerDamage = (amount) => {
  const health = gameState.player.health;
  if (gameState.ui.showGameOver) return;
  health.current = Math.max(0, Math.min(health.max, health.current - amount));
  if (health.current <= 0) gameState.ui.showGameOver = true;
};

const tryImpactPlayer = (villain) => {
  if (villain.state !== 'chasePlayer') return;
  if (villain.isPaused) return;
  const player = gameState.player;
  const distance = distanceBetween(player, villain);
  const threshold = gameState.config.playerRadius * 2;
  if (distance > threshold) return;
  applyPlayerDamage(gameState.config.villain.impactDamage);
  villain.pauseTimer = gameState.config.villain.postImpactPauseSeconds;
  villain.isPaused = true;
};

export const updateVillain = (deltaSeconds = 0) => {
  const villain = gameState.villain;
  if (!villain) return;
  if (gameState.ui.showGameOver) return;
  ensureSpawned(villain);
  if (!villain.spawnInitialized) return;
  decayTimers(villain, deltaSeconds);
  const seesPlayer = villainCanSeePlayer(villain);
  if (seesPlayer) {
    recordPlayerSight(villain);
    if (villain.state !== 'chasePlayer') triggerSightedPlayer(villain);
  }
  const lostTimeout = gameState.config.villain.loseSightSeconds;
  if (!seesPlayer && villain.state === 'chasePlayer' && villain.timeSinceLastSeen >= lostTimeout) {
    enterLostPlayerState(villain);
  }
  if (villain.lostPlayerState && villain.state !== 'chasePlayer') {
    villain.state = 'lostPlayer';
  }
  if (villain.isPaused) return;
  if (villain.state === 'chasePlayer') {
    updateChase(villain, deltaSeconds);
    tryImpactPlayer(villain);
    return;
  }
  if (villain.lostPlayerState) {
    if (villain.isSearching) {
      updateLostPlayer(villain, deltaSeconds);
    } else {
      villain.searchTimer = 0;
      updateLostRoam(villain, deltaSeconds);
    }
    return;
  }
  updateWander(villain, deltaSeconds);
};
