import { gameState } from '../state/gameState.js';
import { normalizeVector } from '../utils/geometry.js';
import { worldPointToCell } from '../state/gridState.js';

const nowSeconds = () => {
  const time = gameState.lastFrameTime || performance.now();
  return time / 1000;
};

const ensureBurstArray = () => {
  if (!Array.isArray(gameState.player.taser.bursts)) {
    gameState.player.taser.bursts = [];
  }
};

const forwardCells = (count) => {
  const direction = normalizeVector(gameState.player.lastMoveDirection || { x: 0, y: 1 });
  const startCell = worldPointToCell({ x: gameState.player.x, y: gameState.player.y });
  const cells = [];
  const horizontal = Math.abs(direction.x) >= Math.abs(direction.y);
  for (let i = 1; i <= count; i += 1) {
    if (horizontal) {
      const baseX = startCell.x + Math.round(Math.sign(direction.x || 1) * i);
      for (let offset = -2; offset <= 2; offset += 1) {
        cells.push({ x: baseX, y: startCell.y + offset });
      }
    } else {
      const baseY = startCell.y + Math.round(Math.sign(direction.y || 1) * i);
      for (let offset = -2; offset <= 2; offset += 1) {
        cells.push({ x: startCell.x + offset, y: baseY });
      }
    }
  }
  return cells;
};

const applyStunToVillain = (cells) => {
  const villain = gameState.villain;
  if (!villain || villain.cellX == null) return;
  const hit = cells.some((cell) => cell.x === villain.cellX && cell.y === villain.cellY);
  if (!hit) return;
  const stunEnds = nowSeconds() + gameState.config.taser.stunSeconds;
  villain.stunnedUntil = Math.max(villain.stunnedUntil || 0, stunEnds);
  if (villain.state !== 'stunned') villain.stateBeforeStun = villain.state;
  villain.state = 'stunned';
  villain.isPaused = true;
  villain.chaseAccelTimer = 0;
  villain.currentSpeed = 0;
};

export const tryFireTaser = () => {
  const taser = gameState.player.taser;
  if (!taser?.hasTaser) return false;
  if (taser.cooldownRemaining > 0) return false;
  const cells = forwardCells(gameState.config.taser.arcLengthCells);
  ensureBurstArray();
  taser.bursts.push({
    cells,
    expiresAt: nowSeconds() + gameState.config.taser.burstDurationSeconds
  });
  applyStunToVillain(cells);
  taser.cooldownRemaining = gameState.config.taser.cooldownSeconds;
  return true;
};

export const updateTaser = (deltaSeconds) => {
  const taser = gameState.player.taser;
  if (!taser || !taser.hasTaser) return;
  if (taser.cooldownRemaining > 0) {
    taser.cooldownRemaining = Math.max(0, taser.cooldownRemaining - deltaSeconds);
  }
  ensureBurstArray();
  const now = nowSeconds();
  taser.bursts = taser.bursts.filter((burst) => burst.expiresAt > now);
};
