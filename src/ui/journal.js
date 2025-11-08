import { gameState } from '../state/gameState.js';

const toggleJournal = () => { gameState.ui.showJournal = !gameState.ui.showJournal; };

export const handleJournalToggle = (key) => {
  if (key === 'j') toggleJournal();
};

const drawBackdrop = (ctx) => {
  ctx.save();
  ctx.fillStyle = 'rgba(8, 12, 24, 0.85)';
  ctx.fillRect(0, 0, gameState.config.canvasWidth, gameState.config.canvasHeight);
  ctx.restore();
};

const drawPanel = (ctx) => {
  const width = gameState.config.canvasWidth * 0.5;
  const height = gameState.config.canvasHeight * 0.5;
  const x = (gameState.config.canvasWidth - width) / 2;
  const y = (gameState.config.canvasHeight - height) / 2;
  ctx.save();
  ctx.fillStyle = 'rgba(18, 28, 54, 0.95)';
  ctx.strokeStyle = '#6d8cff';
  ctx.lineWidth = 2;
  ctx.fillRect(x, y, width, height);
  ctx.strokeRect(x, y, width, height);
  ctx.restore();
  return { x, y, width, height };
};

const drawTitle = (ctx, panel) => {
  ctx.save();
  ctx.fillStyle = '#c5d8ff';
  ctx.font = '30px "Courier New", monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('Journal', panel.x + 24, panel.y + 16);
  ctx.restore();
};

const drawFact = (ctx, panel, label, value, index) => {
  ctx.save();
  ctx.fillStyle = '#8effd6';
  ctx.font = '22px "Courier New", monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  const y = panel.y + 72 + index * 36;
  ctx.fillText(`${label}: ${value}`, panel.x + 24, y);
  ctx.restore();
};

export const renderJournal = (ctx) => {
  if (!gameState.ui.showJournal) return;
  drawBackdrop(ctx);
  const panel = drawPanel(ctx);
  drawTitle(ctx, panel);
  drawFact(ctx, panel, 'Victim Name', gameState.case.victimName ?? '???', 0);
  drawFact(ctx, panel, 'Occupation', gameState.case.victimOccupation ?? '???', 1);
  drawFact(ctx, panel, 'Cause of Death', gameState.case.methodCategory ?? '???', 2);
  drawFact(ctx, panel, 'Time of Death', gameState.case.timeWindow ?? '???', 3);
};
