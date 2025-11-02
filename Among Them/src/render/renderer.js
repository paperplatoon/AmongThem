import { gameState } from '../state/gameState.js';
import { CELL_TYPES } from '../state/gridState.js';
import { renderMinimap } from '../ui/minimap.js';
import { renderInventory } from '../ui/inventory.js';
import { renderJournal } from '../ui/journal.js';
import { renderHud } from './hud.js';

const { WALL } = CELL_TYPES;

const cellSize = () => gameState.grid.cellSize;

const clearViewport = (ctx) => {
  ctx.fillStyle = gameState.config.corridorColor;
  ctx.fillRect(0, 0, gameState.config.canvasWidth, gameState.config.canvasHeight);
};

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
      const color = value === WALL ? gameState.config.wallColor : gameState.config.floorColor;
      ctx.fillStyle = color;
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
  ctx.fillStyle = '#d66';
  ctx.beginPath();
  ctx.arc(body.x, body.y, cellSize() * 0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = '18px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('BODY', body.x, body.y);
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

const drawItems = (ctx) => {
  const radius = gameState.config.itemRadius;
  ctx.save();
  ctx.strokeStyle = '#4f7bd9';
  ctx.lineWidth = 2;
  ctx.fillStyle = '#f4f9ff';
  ctx.font = '24px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  gameState.items.forEach((item) => {
    if (item.collected) return;
    ctx.beginPath();
    ctx.arc(item.x, item.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#071022';
    ctx.fillText(item.label, item.x, item.y);
    ctx.fillStyle = '#f4f9ff';
  });
  ctx.restore();
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
  drawBody(ctx);
  drawScanner(ctx);
  drawDoorPanels(ctx);
  drawDoorLabels(ctx);
  drawItems(ctx);
  drawPlayer(ctx);
  drawScannerPrompt(ctx);
  ctx.restore();
  renderMinimap(ctx);
  renderInventory(ctx);
  renderJournal(ctx);
  renderHud(ctx);
};
