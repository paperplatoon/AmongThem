import { gameState } from '../state/gameState.js';
import { cellToWorldCenter, worldPointToCell, isCellSolid, withinBounds as gridWithinBounds, toIndex } from '../state/gridState.js';
import { doorState } from '../state/doorState.js';
import { hasLineOfSight } from '../utils/lineOfSight.js';
import { distanceBetween } from '../utils/geometry.js';

let fastLaneCells = null;
let perimeterCells = null;

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

const isPerimeterCell = (x, y) => {
  if (!withinBounds(x, y)) return false;
  const mask = getTraitMask();
  const flags = getTraitFlags();
  if (!mask || !flags) return false;
  const index = y * gameState.grid.width + x;
  return Boolean(mask[index] & flags.OUTER_HALL);
};

const canWalkAny = (x, y) => gridWithinBounds(x, y) && !isCellSolid(x, y);
const canWalkFastLane = (x, y) => isFastLaneCell(x, y);
const canWalkPerimeter = (x, y) => isPerimeterCell(x, y);
const canWalkFastOrPerimeter = (x, y) => canWalkFastLane(x, y) || canWalkPerimeter(x, y);
const isInFastLane = (x, y) => isFastLaneCell(x, y);

const isDoorOpenAt = (x, y) => {
  const id = doorState.cells.get(toIndex(x, y));
  if (!id) return true;
  const door = doorState.byId[id];
  return door ? door.isOpen : false;
};

const findNextStep = (start, goal, canWalk) => {
  if (!start || !goal) return null;
  const width = gameState.grid.width;
  const height = gameState.grid.height;
  const visited = new Uint8Array(width * height);
  const queue = [{ x: start.x, y: start.y, prev: null }];
  visited[toIndex(start.x, start.y)] = 1;
  let found = null;
  let queueIndex = 0;
  while (queueIndex < queue.length) {
    const current = queue[queueIndex++];
    if (current.x === goal.x && current.y === goal.y) {
      found = current;
      break;
    }
    const neighbors = [
      { x: current.x + 1, y: current.y, prev: current },
      { x: current.x - 1, y: current.y, prev: current },
      { x: current.x, y: current.y + 1, prev: current },
      { x: current.x, y: current.y - 1, prev: current }
    ];
    for (const n of neighbors) {
      if (!canWalk(n.x, n.y)) continue;
      if (!isDoorOpenAt(n.x, n.y)) continue;
      const idx = toIndex(n.x, n.y);
      if (visited[idx]) continue;
      visited[idx] = 1;
      queue.push(n);
    }
  }
  if (!found) return null;
  let step = found;
  let prev = step.prev;
  while (prev && prev.prev) {
    step = prev;
    prev = prev.prev;
  }
  return step;
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

const gatherPerimeterCells = () => {
  if (perimeterCells) return perimeterCells;
  const mask = getTraitMask();
  const flags = getTraitFlags();
  if (!mask || !flags) {
    perimeterCells = [];
    return perimeterCells;
  }
  const cells = [];
  const width = gameState.grid.width;
  for (let index = 0; index < mask.length; index += 1) {
    if (!(mask[index] & flags.OUTER_HALL)) continue;
    const cellX = index % width;
    const cellY = Math.floor(index / width);
    cells.push({ x: cellX, y: cellY });
  }
  perimeterCells = cells;
  return perimeterCells;
};

const randomFromCells = (cells) => {
  if (!cells.length) return null;
  return cells[Math.floor(Math.random() * cells.length)];
};

const randomFastLaneCell = () => randomFromCells(gatherFastLaneCells());

const randomPerimeterCell = () => randomFromCells(gatherPerimeterCells());

const nearestPerimeterCell = (fromCell) => {
  const cells = gatherPerimeterCells();
  if (!cells.length) return null;
  let best = cells[0];
  let bestDist = Infinity;
  cells.forEach((cell) => {
    const dx = cell.x - fromCell.x;
    const dy = cell.y - fromCell.y;
    const dist = dx * dx + dy * dy;
    if (dist < bestDist) {
      bestDist = dist;
      best = cell;
    }
  });
  return best;
};

const assignPerimeterTargetNearest = (villain) => {
  const origin = villain.cellX != null && villain.cellY != null ? { x: villain.cellX, y: villain.cellY } : null;
  const next = origin ? nearestPerimeterCell(origin) : randomPerimeterCell();
  if (!next) return;
  villain.targetCellX = next.x;
  villain.targetCellY = next.y;
};

const assignPerimeterTargetRandom = (villain) => {
  const current = { x: villain.cellX, y: villain.cellY };
  let next = randomPerimeterCell();
  let guard = 0;
  while (next && current && next.x === current.x && next.y === current.y && guard < 5) {
    next = randomPerimeterCell();
    guard += 1;
  }
  if (!next) return;
  villain.targetCellX = next.x;
  villain.targetCellY = next.y;
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

const moveTowardsTarget = (villain, targetWorld, deltaSeconds, speed, canWalk) => {
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
  if (!canWalk(cell.x, cell.y)) return true;
  if (!isDoorOpenAt(cell.x, cell.y)) return true;
  villain.x = nextX;
  villain.y = nextY;
  villain.heading = Math.atan2(direction.y, direction.x);
  villain.cellX = cell.x;
  villain.cellY = cell.y;
  return reached;
};

const updateStuckState = (villain, targetWorld, deltaSeconds) => {
  if (!targetWorld) return;
  const dist = distanceBetween(villain, targetWorld);
  if (villain.lastTargetDistance == null || dist < villain.lastTargetDistance) {
    villain.lastTargetDistance = dist;
    villain.stuckTimer = 0;
    return;
  }
  villain.stuckTimer += deltaSeconds;
};

const updateRoam = (villain, deltaSeconds, speed, canWalk) => {
  if (villain.targetCellX == null || villain.targetCellY == null) assignWanderTarget(villain);
  if (villain.targetCellX == null || villain.targetCellY == null) return;
  const targetWorld = cellToWorldCenter(villain.targetCellX, villain.targetCellY);
  const reached = moveTowardsTarget(villain, targetWorld, deltaSeconds, speed, canWalk);
  if (reached || distanceToTarget(villain, targetWorld) < 4) {
    if (canWalk === canWalkPerimeter) assignPerimeterTargetRandom(villain);
    else assignWanderTarget(villain);
  }
};

const updateWander = (villain, deltaSeconds) => {
  updateRoam(villain, deltaSeconds, gameState.config.villain.wanderSpeed, canWalkFastLane);
};

const updateLostRoam = (villain, deltaSeconds) => {
  const walk = villain.isEscaped ? canWalkFastOrPerimeter : canWalkFastLane;
  updateRoam(villain, deltaSeconds, gameState.config.villain.lostSpeed, walk);
  villain.stuckTimer = 0;
  villain.lastTargetDistance = null;
};

const updateEscapedTravel = (villain, deltaSeconds) => {
  if (villain.targetCellX == null || villain.targetCellY == null) assignPerimeterTargetNearest(villain);
  if (villain.targetCellX == null || villain.targetCellY == null) return;
  const pathStep = findNextStep({ x: villain.cellX, y: villain.cellY }, { x: villain.targetCellX, y: villain.targetCellY }, canWalkFastOrPerimeter);
  const targetWorld = pathStep ? cellToWorldCenter(pathStep.x, pathStep.y) : cellToWorldCenter(villain.targetCellX, villain.targetCellY);
  const reached = moveTowardsTarget(
    villain,
    targetWorld,
    deltaSeconds,
    gameState.config.villain.escapedTravelSpeed,
    canWalkFastOrPerimeter
  );
  if (reached || distanceToTarget(villain, targetWorld) < 4) {
    villain.state = 'escaped_roam';
    assignPerimeterTargetRandom(villain);
  }
};

const updateEscapedRoam = (villain, deltaSeconds) => {
  if (villain.targetCellX == null || villain.targetCellY == null) assignPerimeterTargetRandom(villain);
  if (villain.targetCellX == null || villain.targetCellY == null) return;
  const pathStep = findNextStep({ x: villain.cellX, y: villain.cellY }, { x: villain.targetCellX, y: villain.targetCellY }, canWalkPerimeter);
  const targetWorld = pathStep ? cellToWorldCenter(pathStep.x, pathStep.y) : cellToWorldCenter(villain.targetCellX, villain.targetCellY);
  const reached = moveTowardsTarget(
    villain,
    targetWorld,
    deltaSeconds,
    gameState.config.villain.escapedRoamSpeed,
    canWalkPerimeter
  );
  if (reached || distanceToTarget(villain, targetWorld) < 4) assignPerimeterTargetRandom(villain);
};

const getPathStepTo = (startCell, targetCell, canWalk) => {
  if (!startCell || !targetCell) return null;
  return findNextStep(startCell, targetCell, canWalk);
};

const projectDirectionCell = (villain) => {
  const cells = gameState.config.villain.pursueProjectionCells || 10;
  return {
    x: villain.cellX + Math.round(villain.lastSeenDirection.x * cells),
    y: villain.cellY + Math.round(villain.lastSeenDirection.y * cells)
  };
};

const updateChase = (villain, deltaSeconds, seesPlayer) => {
  const fallbackSearch = () => {
    villain.state = 'lostPlayer';
    villain.lostPlayerState = true;
    villain.isSearching = true;
    villain.searchTimer = 0;
    villain.searchUntil = gameState.config.villain.searchDurationSeconds;
    villain.searchOrigin = null;
  };
  const targetWorld = (() => {
    if (seesPlayer || !villain.lastSeenPlayerAt) {
      return { x: gameState.player.x, y: gameState.player.y };
    }
    const distanceToLast = distanceBetween(villain, villain.lastSeenPlayerAt);
    if (distanceToLast <= gameState.grid.cellSize * 1.5 && villain.pursueDirectionTimer > 0 && villain.lastSeenDirection) {
      const cellsAhead = projectDirectionCell(villain);
      return cellToWorldCenter(cellsAhead.x, cellsAhead.y);
    }
    return villain.lastSeenPlayerAt;
  })();
  const targetCell = worldPointToCell(targetWorld);
  const canWalk = villain.isEscaped ? canWalkFastOrPerimeter : canWalkAny;
  const pathStep = getPathStepTo({ x: villain.cellX, y: villain.cellY }, targetCell, canWalk);
  if (!pathStep) {
    villain.stuckTimer += deltaSeconds;
    if (villain.stuckTimer >= (gameState.config.villain.doorPoundPauseSeconds || 1)) {
      villain.pauseTimer = gameState.config.villain.doorPoundPauseSeconds || 1;
      villain.isPaused = true;
      villain.stuckTimer = 0;
      villain.doorAttempts += 1;
      villain.lastSeenPlayerAt = cellToWorldCenter(villain.cellX, villain.cellY);
      if (villain.doorAttempts >= 2) {
        villain.doorAttempts = 0;
        fallbackSearch();
      }
    }
    return;
  }
  villain.doorAttempts = 0;
  if (villain.stuckTimer > 0) villain.stuckTimer = 0;
  const stepWorld = cellToWorldCenter(pathStep.x, pathStep.y);
  const speed = Math.max(0, Math.min(gameState.config.villain.chaseSpeed, villain.currentSpeed));
  moveTowardsTarget(villain, stepWorld, deltaSeconds, speed, canWalk);
  updateStuckState(villain, stepWorld, deltaSeconds);
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
  const canWalk = villain.isEscaped ? canWalkFastOrPerimeter : canWalkFastLane;
  const pathStep = findNextStep({ x: villain.cellX, y: villain.cellY }, worldPointToCell(targetWorld), canWalk);
  const target = pathStep ? cellToWorldCenter(pathStep.x, pathStep.y) : targetWorld;
  const reached = moveTowardsTarget(villain, target, deltaSeconds, lostSpeed, canWalk);
  updateStuckState(villain, target, deltaSeconds);
  if (reached) assignSearchOrigin(villain);
};

const angleBetween = (a, b) => {
  const dot = a.x * b.x + a.y * b.y;
  const mag = Math.hypot(a.x, a.y) * Math.hypot(b.x, b.y);
  if (!mag) return Math.PI;
  return Math.acos(Math.min(1, Math.max(-1, dot / mag)));
};

const normalizeVector = (vector) => {
  const mag = Math.hypot(vector.x, vector.y);
  if (!mag) return { x: 0, y: 0 };
  return { x: vector.x / mag, y: vector.y / mag };
};

const chaseSightRangeCells = () => {
  const screenCells = gameState.config.canvasWidth / gameState.grid.cellSize;
  return screenCells * (gameState.config.villain.chaseSightFractionOfScreen || 0.75);
};

const updateEscapeStateForPosition = (villain) => {
  if (villain.state === 'noticePlayer') return;
  if (!isInFastLane(villain.cellX, villain.cellY)) {
    villain.isEscaped = true;
    return;
  }
  if (villain.isEscaped && isInFastLane(villain.cellX, villain.cellY)) {
    villain.isEscaped = false;
  }
};

const villainCanSeePlayer = (villain) => {
  const player = gameState.player;
  const vectorToPlayer = { x: player.x - villain.x, y: player.y - villain.y };
  const distance = Math.hypot(vectorToPlayer.x, vectorToPlayer.y);
  let rangeCells = gameState.config.villain.sightRangeCells * 1.3;
  if (villain.state === 'chasePlayer') {
    rangeCells = Math.max(rangeCells, chaseSightRangeCells());
  }
  const cellDistance = distance / gameState.grid.cellSize;
  if (cellDistance > rangeCells) return false;
  const headingVector = { x: Math.cos(villain.heading), y: Math.sin(villain.heading) };
  const angle = angleBetween(headingVector, vectorToPlayer);
  const halfCone = villain.state === 'chasePlayer'
    ? Math.PI
    : (gameState.config.villain.sightAngleDeg * Math.PI) / 180 / 2;
  // Sprinting makes noise: if sprinting within radius, villain detects regardless of cone.
  if (player.stamina?.isSprinting) {
    return true;
  }
  if (angle > halfCone) return false;
  const villainCell = { x: villain.cellX, y: villain.cellY };
  const playerCell = worldPointToCell({ x: player.x, y: player.y });
  return hasLineOfSight(villainCell, playerCell, rangeCells);
};

const recordPlayerSight = (villain) => {
  const playerPos = { x: gameState.player.x, y: gameState.player.y };
  villain.lastSeenPlayerAt = playerPos;
  villain.timeSinceLastSeen = 0;
  const direction = normalizeVector({ x: playerPos.x - villain.x, y: playerPos.y - villain.y });
  villain.lastSeenDirection = direction;
  villain.pursueDirectionTimer = gameState.config.villain.lostDirectionDurationSeconds;
  villain.doorAttempts = 0;
};

const triggerSightedPlayer = (villain) => {
  villain.hasSeenPlayer = true;
  villain.state = 'noticePlayer';
  const stepDuration = gameState.config.villain.noticeStepDurationSeconds;
  const hopDuration = gameState.config.villain.noticeHopDurationSeconds;
  villain.noticeTimer = stepDuration + hopDuration;
  villain.noticeElapsed = 0;
  villain.chaseAccelTimer = 0;
  villain.currentSpeed = 0;
  villain.jumpTimer = hopDuration;
  const toPlayer = { x: gameState.player.x - villain.x, y: gameState.player.y - villain.y };
  villain.noticeDirection = normalizeVector(toPlayer);
  villain.noticePhase = 'step_back';
  villain.noticePhaseTimer = stepDuration;
  villain.noticeFlashDuration = stepDuration + hopDuration;
  villain.noticeFlashTimer = villain.noticeFlashDuration;
  villain.lostPlayerState = false;
  villain.isSearching = false;
  villain.searchTimer = 0;
  villain.searchUntil = 0;
  recordPlayerSight(villain);
};

const decayTimers = (villain, deltaSeconds) => {
  if (villain.jumpTimer > 0) villain.jumpTimer = Math.max(0, villain.jumpTimer - deltaSeconds);
  if (villain.pauseTimer > 0) villain.pauseTimer = Math.max(0, villain.pauseTimer - deltaSeconds);
  villain.isPaused = villain.pauseTimer > 0;
  villain.timeSinceLastSeen += deltaSeconds;
  if (villain.isSearching) villain.searchTimer += deltaSeconds;
  if (villain.noticeTimer > 0) villain.noticeTimer = Math.max(0, villain.noticeTimer - deltaSeconds);
  villain.noticeElapsed += deltaSeconds;
  if (villain.noticeFlashTimer > 0) villain.noticeFlashTimer = Math.max(0, villain.noticeFlashTimer - deltaSeconds);
  if (villain.state === 'chasePlayer' && villain.currentSpeed < gameState.config.villain.chaseSpeed) {
    villain.chaseAccelTimer += deltaSeconds;
    const accelDuration = gameState.config.villain.chaseAccelSeconds;
    const t = Math.min(1, accelDuration > 0 ? villain.chaseAccelTimer / accelDuration : 1);
    const targetSpeed = gameState.config.villain.chaseSpeed;
    villain.currentSpeed = targetSpeed * t;
  }
};

const transitionToChase = (villain) => {
  villain.state = 'chasePlayer';
  villain.noticePhase = 'idle';
  villain.noticePhaseTimer = 0;
  villain.noticeTimer = 0;
  villain.jumpTimer = 0;
  villain.noticeElapsed = 0;
  villain.noticeFlashTimer = 0;
  villain.chaseAccelTimer = 0;
  villain.currentSpeed = 0;
};

const stepBackSpeed = () => {
  const distance = gameState.config.villain.noticeStepDistanceCells * gameState.grid.cellSize;
  const duration = Math.max(0.01, gameState.config.villain.noticeStepDurationSeconds);
  return distance / duration;
};

const applyStepBack = (villain, deltaSeconds) => {
  const speed = stepBackSpeed();
  const offsetX = -villain.noticeDirection.x * speed * deltaSeconds;
  const offsetY = -villain.noticeDirection.y * speed * deltaSeconds;
  const nextX = villain.x + offsetX;
  const nextY = villain.y + offsetY;
  const cell = worldPointToCell({ x: nextX, y: nextY });
  if (canWalkAny(cell.x, cell.y)) {
    villain.x = nextX;
    villain.y = nextY;
    villain.cellX = cell.x;
    villain.cellY = cell.y;
  }
};

const updateNoticePhase = (villain, deltaSeconds) => {
  if (villain.noticePhase === 'step_back') {
    applyStepBack(villain, deltaSeconds);
    villain.noticePhaseTimer -= deltaSeconds;
    if (villain.noticePhaseTimer <= 0) {
      villain.noticePhase = 'hop';
      villain.noticePhaseTimer = gameState.config.villain.noticeHopDurationSeconds;
      villain.noticeElapsed = 0;
      villain.jumpTimer = gameState.config.villain.noticeHopDurationSeconds;
    }
    return;
  }
  if (villain.noticePhase === 'hop') {
    villain.noticePhaseTimer -= deltaSeconds;
    if (villain.noticePhaseTimer <= 0) {
      villain.noticePhase = 'ready';
    }
    return;
  }
  transitionToChase(villain);
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
  updateEscapeStateForPosition(villain);
  maybeEscape(villain, deltaSeconds);
  const seesPlayer = villainCanSeePlayer(villain);
  if (seesPlayer) {
    recordPlayerSight(villain);
    if (villain.state === 'wander') triggerSightedPlayer(villain);
    if (villain.state === 'lostPlayer') {
      villain.lostPlayerState = false;
      villain.state = 'chasePlayer';
      villain.isSearching = false;
      villain.searchTimer = 0;
      villain.searchOrigin = null;
    }
  } else if (villain.pursueDirectionTimer > 0) {
    villain.pursueDirectionTimer = Math.max(0, villain.pursueDirectionTimer - deltaSeconds);
  }
  const lostTimeout = gameState.config.villain.loseSightSeconds;
  if (!seesPlayer && villain.state === 'chasePlayer' && villain.timeSinceLastSeen >= lostTimeout && villain.pursueDirectionTimer <= 0) {
    const distanceCells = distanceBetween(gameState.player, villain) / gameState.grid.cellSize;
    if (distanceCells >= gameState.config.villain.loseSightDistanceCells) {
      enterLostPlayerState(villain);
    }
  }
  if (villain.lostPlayerState && villain.state !== 'chasePlayer') {
    villain.state = 'lostPlayer';
  }
  if (villain.stuckTimer > 1.25) {
    villain.stuckTimer = 0;
    villain.lastTargetDistance = null;
    if (villain.isEscaped) {
      villain.state = 'escaped_roam';
      assignPerimeterTargetRandom(villain);
    } else {
      enterLostPlayerState(villain);
    }
  }
  if (villain.isPaused) return;
  if (villain.state === 'noticePlayer') {
    updateNoticePhase(villain, deltaSeconds);
    return;
  }
  if (villain.state === 'chasePlayer') {
    updateChase(villain, deltaSeconds, seesPlayer);
    tryImpactPlayer(villain);
    return;
  }
  if (villain.isEscaped) {
    if (villain.state === 'escaped_travel') {
      updateEscapedTravel(villain, deltaSeconds);
      return;
    }
    if (villain.state === 'escaped_roam') {
      updateEscapedRoam(villain, deltaSeconds);
      return;
    }
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

export const forceVillainEscape = () => {
  const villain = gameState.villain;
  if (!villain) return;
  ensureSpawned(villain);
  villain.isEscaped = true;
  villain.state = 'escaped_travel';
  villain.targetCellX = null;
  villain.targetCellY = null;
  villain.canEscapeAt = nowSeconds();
};

export const resetVillainLockdown = () => {
  const villain = gameState.villain;
  if (!villain) return;
  ensureSpawned(villain);
  const start = randomFastLaneCell();
  if (start) setVillainPosition(villain, start);
  villain.isEscaped = false;
  villain.state = 'wander';
  villain.targetCellX = null;
  villain.targetCellY = null;
  villain.canEscapeAt = nowSeconds() + gameState.config.villain.escapeLockoutSeconds;
};
const nowSeconds = () => gameState.lastFrameTime / 1000;

const currentOxygenPercent = () => {
  const { current, max } = gameState.player.oxygen;
  return max > 0 ? (current / max) * 100 : 0;
};

const calculateEscapeChancePerSecond = (oxygenPercent) => {
  const below = Math.max(0, 90 - oxygenPercent);
  return below * gameState.config.villain.escapeChancePerPctBelow90;
};

const maybeEscape = (villain, deltaSeconds) => {
  if (villain.isEscaped) return;
  const now = nowSeconds();
  if (now < villain.canEscapeAt) return;
  villain.escapeAccumulated += deltaSeconds;
  const interval = gameState.config.villain.escapeCheckIntervalSeconds;
  if (villain.escapeAccumulated < interval) return;
  villain.escapeAccumulated -= interval;
  const chance = calculateEscapeChancePerSecond(currentOxygenPercent());
  if (Math.random() < chance) {
    villain.isEscaped = true;
    villain.state = 'escaped_travel';
    villain.targetCellX = null;
    villain.targetCellY = null;
  }
};
