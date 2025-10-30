import { gameState } from '../state/gameState.js';
import {
  getDoorDefinition,
  getOpenRoomRects,
  listVisibleCorridors,
  listVisibleRooms,
  listVisibleDoors,
  listVisibleShafts
} from '../state/selectors.js';
import { renderInventory } from '../ui/inventory.js';
import { renderMinimap } from '../ui/minimap.js';

const fillRect = (ctx, rect, color) => {
  ctx.fillStyle = color;
  ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
};

const strokeRect = (ctx, rect, color, thickness) => {
  ctx.strokeStyle = color;
  ctx.lineWidth = thickness;
  ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
};

const drawCorridors = (ctx) => {
  listVisibleCorridors().forEach((rect) => fillRect(ctx, rect, gameState.config.floorColor));
};

const drawFloorGrid = (ctx) => {
  const spacing = gameState.config.floorGridSpacing;
  const camera = gameState.camera;
  const startX = Math.floor(camera.x / spacing) * spacing;
  const endX = camera.x + camera.width + spacing;
  const startY = Math.floor(camera.y / spacing) * spacing;
  const endY = camera.y + camera.height + spacing;
  ctx.save();
  ctx.strokeStyle = gameState.config.floorGridColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = startX; x <= endX; x += spacing) {
    ctx.moveTo(x, camera.y - spacing);
    ctx.lineTo(x, camera.y + camera.height + spacing);
  }
  for (let y = startY; y <= endY; y += spacing) {
    ctx.moveTo(camera.x - spacing, y);
    ctx.lineTo(camera.x + camera.width + spacing, y);
  }
  ctx.stroke();
  ctx.restore();
};

const drawShafts = (ctx) => {
  ctx.globalAlpha = 0.35;
  listVisibleShafts().forEach((rect) => fillRect(ctx, rect, gameState.config.blueprintGlow));
  ctx.globalAlpha = 1;
};

const isItemVisible = (item) => (
  item.x >= gameState.camera.x - 120 &&
  item.x <= gameState.camera.x + gameState.camera.width + 120 &&
  item.y >= gameState.camera.y - 120 &&
  item.y <= gameState.camera.y + gameState.camera.height + 120
);

const drawItems = (ctx) => {
  const panelColor = '#f4f9ff';
  const textColor = '#071022';
  ctx.save();
  ctx.strokeStyle = '#4f7bd9';
  ctx.lineWidth = 3;
  ctx.font = '32px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const radius = gameState.config.itemRadius;
  gameState.items.forEach((item) => {
    if (item.collected || !isItemVisible(item)) return;
    ctx.save();
    ctx.beginPath();
    ctx.fillStyle = panelColor;
    ctx.arc(item.x, item.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = textColor;
    ctx.fillText(item.label, item.x, item.y);
    ctx.restore();
  });
  ctx.restore();
};

const fillOpenRooms = (ctx, visibleRooms) => {
  getOpenRoomRects()
    .filter((room) => visibleRooms.includes(room))
    .forEach((room) => fillRect(ctx, room, gameState.config.floorColor));
};

const drawRooms = (ctx) => {
  const visibleRooms = listVisibleRooms();
  fillOpenRooms(ctx, visibleRooms);
  visibleRooms.forEach((room) => {
    strokeRect(ctx, room, gameState.config.wallColor, gameState.config.wallThickness);
  });
};

const doorColor = (door) => (
  door.state === 'opening' || door.state === 'open'
    ? gameState.config.doorOpenColor
    : gameState.config.doorClosedColor
);

const fillDoorGap = (ctx, rect, orientation, gapStart, gapSize) => {
  if (gapSize <= 0) return;
  if (orientation === 'horizontal') {
    fillRect(ctx, { x: gapStart, y: rect.y, width: gapSize, height: rect.height }, gameState.config.floorColor);
    return;
  }
  fillRect(ctx, { x: rect.x, y: gapStart, width: rect.width, height: gapSize }, gameState.config.floorColor);
};

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
  const gapWidth = Math.max(rect.width - panelWidth * 2, 0);
  const gapStart = rect.x + panelWidth;
  fillRect(ctx, leftRect, doorColor(door));
  fillRect(ctx, rightRect, doorColor(door));
  fillDoorGap(ctx, rect, 'horizontal', gapStart, gapWidth);
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
  const gapHeight = Math.max(rect.height - panelHeight * 2, 0);
  const gapStart = rect.y + panelHeight;
  fillRect(ctx, topRect, doorColor(door));
  fillRect(ctx, bottomRect, doorColor(door));
  fillDoorGap(ctx, rect, 'vertical', gapStart, gapHeight);
};

const drawDoors = (ctx) => {
  listVisibleDoors().forEach((door) => {
    const rect = getDoorDefinition(door);
    if (rect.orientation === 'vertical') {
      drawVerticalDoor(ctx, rect, door);
      return;
    }
    drawHorizontalDoor(ctx, rect, door);
  });
};

const getDoorLabelPosition = (definition) => {
  const centerX = definition.x + definition.width / 2;
  const centerY = definition.y + definition.height / 2;
  const offset = gameState.config.doorLabelOffset;
  if (definition.side === 'north') return { x: centerX, y: definition.y - offset, rotation: 0 };
  if (definition.side === 'south') return { x: centerX, y: definition.y + definition.height + offset, rotation: 0 };
  if (definition.side === 'west') return { x: definition.x - offset, y: centerY, rotation: -Math.PI / 2 };
  return { x: definition.x + definition.width + offset, y: centerY, rotation: Math.PI / 2 };
};

const drawDoorLabels = (ctx) => {
  ctx.save();
  ctx.fillStyle = '#c5d8ff';
  ctx.font = '36px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  listVisibleDoors().forEach((door) => {
    const definition = getDoorDefinition(door);
    if (!definition.label) return;
    const { x, y, rotation } = getDoorLabelPosition(definition);
    ctx.save();
    ctx.translate(x, y);
    if (rotation) ctx.rotate(rotation);
    ctx.fillText(definition.label, 0, 0);
    ctx.restore();
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
  fillRect(ctx, { x: 0, y: 0, width: gameState.config.canvasWidth, height: gameState.config.canvasHeight }, gameState.config.corridorColor);
  ctx.save();
  ctx.translate(-gameState.camera.x, -gameState.camera.y);
  drawCorridors(ctx);
  drawFloorGrid(ctx);
  drawShafts(ctx);
  drawRooms(ctx);
  drawDoors(ctx);
  drawDoorLabels(ctx);
  drawItems(ctx);
  drawPlayer(ctx);
  ctx.restore();
  renderMinimap(ctx);
  renderInventory(ctx);
};
