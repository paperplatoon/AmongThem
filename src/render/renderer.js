import { gameState } from '../state/gameState.js';
import { CELL_TYPES } from '../state/gridState.js';
import { renderMinimap } from '../ui/minimap.js';
import { renderInventory } from '../ui/inventory.js';
import { renderJournal } from '../ui/journal.js';
import { renderHud } from './hud.js';
import { renderContainerMenu } from '../ui/containerMenu.js';
import { renderVendingMenu } from '../ui/vendingMenu.js';
import { renderVillain } from './villainRenderer.js';
import { renderGameOver } from '../ui/gameOver.js';
import { renderHacking } from '../ui/hacking.js';
import { renderAccusation } from '../ui/accusation.js';
import { renderAccuseConsole } from './accuseConsole.js';
import { renderLockpick } from '../ui/lockpick.js';
import { renderUpgrades } from '../ui/upgrades.js';
import { renderWeaponTesting } from '../ui/weaponTesting.js';
import { renderVisualEffects } from './visualEffects.js';
import { cellToWorldCenter } from '../state/gridState.js';
const { WALL } = CELL_TYPES;

const cellSize = () => gameState.grid.cellSize;

const clearViewport = (ctx) => {
  ctx.fillStyle = gameState.config.corridorColor;
  ctx.fillRect(0, 0, gameState.config.canvasWidth, gameState.config.canvasHeight);
};

let hasLoggedVentCell = false;
let hasLoggedFastLaneCell = false;
let hasLoggedLockdown = false;

const drawGrid = (ctx) => {
  const size = cellSize();
  const camera = gameState.camera;
  const startCol = Math.floor(camera.x / size);
  const endCol = Math.ceil((camera.x + camera.width) / size);
  const startRow = Math.floor(camera.y / size);
  const endRow = Math.ceil((camera.y + camera.height) / size);

  for (let row = startRow; row <= endRow; row++) {
    for (let col = startCol; col <= endCol; col++) {
      if (col < 0 || row < 0 || col >= gameState.grid.width || row >= gameState.grid.height) continue;
      const index = row * gameState.grid.width + col;
      const value = gameState.grid.cells[index];
      const traitMask = gameState.map.cellTraits;
      const traitFlags = gameState.map.cellTraitFlags;
      const traits = traitMask ? traitMask[index] : 0;
      const isVentCell = Boolean(traits & traitFlags.VENT);
      const isFastLaneCell = Boolean(traits & traitFlags.FAST_LANE);
      if (!hasLoggedVentCell && isVentCell) {
        console.log('[renderer] First vent cell seen at col', col, 'row', row);
        hasLoggedVentCell = true;
      }
      if (!hasLoggedFastLaneCell && isFastLaneCell) {
        console.log('[renderer] First fast-lane cell seen at col', col, 'row', row);
        hasLoggedFastLaneCell = true;
      }
      if (value === WALL) ctx.fillStyle = gameState.config.wallColor;
      else if (isVentCell) ctx.fillStyle = gameState.config.ventFloorColor;
      else if (isFastLaneCell) ctx.fillStyle = gameState.config.fastLaneFloorColor;
      else ctx.fillStyle = gameState.config.floorColor;
      ctx.fillRect(col * size, row * size, size, size);
    }
  }
};

const doorOpenColor = () => gameState.config.doorOpenColor;
const doorClosedColor = () => gameState.config.doorClosedColor;

const doorPanelColor = (door) => (door.state === 'opening' || door.state === 'open'
  ? doorOpenColor()
  : doorClosedColor());

const drawHorizontalDoor = (ctx, rect, door) => {
  const panelMin = Math.min(rect.width / 6, 12);
  const closedWidth = rect.width * (1 - door.progress);
  const halfClosed = closedWidth / 2;
  const panelWidth = Math.min(Math.max(halfClosed, panelMin), rect.width / 2);
  const leftRect = { x: rect.x, y: rect.y, width: panelWidth, height: rect.height };
  const rightRect = {
    x: rect.x + rect.width - panelWidth,
    y: rect.y,
    width: panelWidth,
    height: rect.height
  };
  const gapStart = rect.x + panelWidth;
  const gapWidth = Math.max(rect.width - panelWidth * 2, 0);
  ctx.fillStyle = doorPanelColor(door);
  ctx.fillRect(leftRect.x, leftRect.y, leftRect.width, leftRect.height);
  ctx.fillRect(rightRect.x, rightRect.y, rightRect.width, rightRect.height);
  ctx.fillStyle = gameState.config.floorColor;
  ctx.fillRect(gapStart, rect.y, gapWidth, rect.height);
};

const drawVerticalDoor = (ctx, rect, door) => {
  const panelMin = Math.min(rect.height / 6, 12);
  const closedHeight = rect.height * (1 - door.progress);
  const halfClosed = closedHeight / 2;
  const panelHeight = Math.min(Math.max(halfClosed, panelMin), rect.height / 2);
  const topRect = { x: rect.x, y: rect.y, width: rect.width, height: panelHeight };
  const bottomRect = {
    x: rect.x,
    y: rect.y + rect.height - panelHeight,
    width: rect.width,
    height: panelHeight
  };
  const gapStart = rect.y + panelHeight;
  const gapHeight = Math.max(rect.height - panelHeight * 2, 0);
  ctx.fillStyle = doorPanelColor(door);
  ctx.fillRect(topRect.x, topRect.y, topRect.width, topRect.height);
  ctx.fillRect(bottomRect.x, bottomRect.y, bottomRect.width, bottomRect.height);
  ctx.fillStyle = gameState.config.floorColor;
  ctx.fillRect(rect.x, gapStart, rect.width, gapHeight);
};

const drawDoorPanels = (ctx) => {
  gameState.doors.forEach((door) => {
    const rect = door.rect;
    if (rect.orientation === 'vertical') {
      drawVerticalDoor(ctx, rect, door);
      return;
    }
    drawHorizontalDoor(ctx, rect, door);
  });
};

const drawDoorLabels = (ctx) => {
  ctx.save();
  ctx.fillStyle = '#c5d8ff';
  ctx.font = '28px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  gameState.doors.forEach((door) => {
    if (!door.label) return;
    const rect = door.rect;
    const centerX = rect.x + rect.width / 2;
    const centerY = rect.y + rect.height / 2;
    ctx.save();
    ctx.translate(centerX, centerY);
    if (door.orientation === 'vertical') ctx.rotate(-Math.PI / 2);
    ctx.fillText(door.label, 0, 0);
    ctx.restore();
  });
  ctx.restore();
};

const drawBody = (ctx) => {
  const body = gameState.body;
  if (body.x == null) return;
  ctx.save();
  ctx.fillStyle = body.collectedSample ? '#555c6b' : '#d66';
  ctx.beginPath();
  ctx.arc(body.x, body.y, cellSize() * 0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = body.collectedSample ? '#b3b7c4' : '#ffffff';
  ctx.font = '18px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(body.collectedSample ? 'SEARCHED' : 'BODY', body.x, body.y);
  ctx.restore();
};

const drawScanner = (ctx) => {
  const scanner = gameState.scanner;
  if (scanner.x == null) return;
  const size = cellSize() * 0.8;
  ctx.save();
  ctx.fillStyle = '#66bfff';
  ctx.fillRect(scanner.x - size / 2, scanner.y - size / 2, size, size);
  ctx.fillStyle = '#0d1b3d';
  ctx.font = '16px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('SCAN', scanner.x, scanner.y);
  ctx.restore();
};

const drawTestingStation = (ctx) => {
  const station = gameState.testingStation;
  if (station.x == null) return;
  const size = cellSize() * 0.8;
  ctx.save();
  ctx.fillStyle = '#4a9eff';
  ctx.fillRect(station.x - size / 2, station.y - size / 2, size, size);
  ctx.fillStyle = '#0d1b3d';
  ctx.font = '14px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('TEST', station.x, station.y);
  ctx.restore();
};

const drawScannerPrompt = (ctx) => {
  if (!gameState.scanner.promptActive) return;
  const scanner = gameState.scanner;
  ctx.save();
  ctx.fillStyle = '#f4f9ff';
  ctx.font = '18px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('CLICK TO SCAN', scanner.x, scanner.y - cellSize() * 0.7);
  ctx.restore();
};

const drawLockdownStation = (ctx) => {
  const aiCore = gameState.map.roomById?.ai_core;
  if (!aiCore) return;
  const { x, y } = cellToWorldCenter(
    Math.floor((aiCore.rectCells.x + aiCore.rectCells.x + aiCore.rectCells.width) / 2),
    Math.floor((aiCore.rectCells.y + aiCore.rectCells.y + aiCore.rectCells.height) / 2)
  );
  const size = cellSize() * 0.9;
  const half = size / 2;
  const isActive = gameState.villain.isEscaped;
  if (!hasLoggedLockdown) {
    console.log('[renderer] Lockdown station', { x, y, isActive, aiCore });
    hasLoggedLockdown = true;
  }
  ctx.save();
  ctx.fillStyle = isActive ? '#c0392b' : '#4b5563';
  ctx.strokeStyle = isActive ? '#ff6b6b' : '#9ca3af';
  ctx.lineWidth = 3;
  ctx.fillRect(x - half, y - half, size, size);
  ctx.strokeRect(x - half, y - half, size, size);
  ctx.fillStyle = '#f4f9ff';
  ctx.font = '12px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('LOCK', x, y);
  ctx.restore();
};

const currentSeconds = () => {
  const time = gameState.lastFrameTime || performance.now();
  return time / 1000;
};

const drawProps = (ctx) => {
  const size = cellSize() * 0.8;
  gameState.props.forEach((prop) => {
    ctx.save();
    const hasLocator = gameState.player.upgrades?.keycardLocator;
    const shouldHighlight = hasLocator && prop.containsKeycard;
    const highlight = shouldHighlight ? '#ff4f4f' : null;
    const outline = highlight || (prop.isEmpty ? '#2d3a55' : '#fef3b7');
    const labelColor = highlight ? '#ffdfdf' : prop.isEmpty ? '#7b84a2' : '#fef3b7';
    if (prop.type === 'vending_machine') {
      ctx.fillStyle = '#123c6b';
      ctx.fillRect(prop.x - size / 2, prop.y - size / 2, size, size);
      ctx.strokeStyle = '#8effd6';
      ctx.lineWidth = 3;
      ctx.strokeRect(prop.x - size / 2, prop.y - size / 2, size, size);
      ctx.fillStyle = '#fefefe';
      ctx.font = '18px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('VEND', prop.x, prop.y);
    } else {
      ctx.strokeStyle = outline;
      ctx.strokeRect(prop.x - size / 2, prop.y - size / 2, size, size);
      ctx.fillStyle = labelColor;
      ctx.font = '16px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(prop.label.toUpperCase(), prop.x, prop.y + size / 2 + 4);
    }
    if (prop.promptActive) {
      ctx.fillStyle = prop.promptText === 'EMPTY' ? '#c06f6f' : '#ffffff';
      ctx.font = '16px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(prop.promptText || 'CLICK TO SEARCH', prop.x, prop.y - size / 2 - 12);
    }
    ctx.restore();
  });
};

const drawTaserBursts = (ctx) => {
  const bursts = gameState.player.taser?.bursts || [];
  if (!bursts.length) return;
  const now = currentSeconds();
  bursts.forEach((burst) => {
    const remaining = burst.expiresAt - now;
    const alpha = Math.sin((remaining / gameState.config.taser.burstDurationSeconds) * Math.PI * 4);
    ctx.save();
    ctx.globalAlpha = Math.abs(alpha);
    ctx.fillStyle = '#fefefe';
    burst.cells.forEach((cell) => {
      const { x, y } = cellToWorldCenter(cell.x, cell.y);
      ctx.fillRect(x - gameState.grid.cellSize / 2, y - gameState.grid.cellSize / 2, gameState.grid.cellSize, gameState.grid.cellSize);
    });
    ctx.restore();
  });
};


const drawPlayer = (ctx) => {
  const player = gameState.player;
  ctx.beginPath();
  ctx.fillStyle = gameState.config.playerColor;
  ctx.arc(player.x, player.y, gameState.config.playerRadius, 0, Math.PI * 2);
  ctx.fill();
};

export const renderFrame = (ctx) => {
  clearViewport(ctx);
  ctx.save();
  ctx.translate(-gameState.camera.x, -gameState.camera.y);
  drawGrid(ctx);
  renderVillain(ctx);
  drawBody(ctx);
  drawScanner(ctx);
  drawTestingStation(ctx);
  drawProps(ctx);
  drawTaserBursts(ctx);
  drawDoorPanels(ctx);
  drawDoorLabels(ctx);
  drawLockdownStation(ctx);
  renderAccuseConsole(ctx);
  drawPlayer(ctx);
  drawScannerPrompt(ctx);
  ctx.restore();
  renderMinimap(ctx);
  renderInventory(ctx);
  renderJournal(ctx);
  renderContainerMenu(ctx);
  renderVendingMenu(ctx);
  renderHud(ctx);
  renderHacking(ctx);
  renderLockpick(ctx);
  renderUpgrades(ctx);
  renderAccusation(ctx);
  renderWeaponTesting(ctx);
  renderGameOver(ctx);
  renderVisualEffects(ctx);
  if (gameState.testingModeEnabled) {
    ctx.save();
    ctx.fillStyle = '#ffaa33';
    ctx.font = '14px "Courier New", monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText('TESTING MODE', gameState.config.canvasWidth - 12, gameState.config.canvasHeight - 12);
    ctx.restore();
  }
};
