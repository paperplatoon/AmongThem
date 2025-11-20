import { gameState } from '../state/gameState.js';
import {
  submitHackingInput,
  exitHackingSession,
  isHackingActive,
  getComputerLockByPropId,
  describeHackingPhase,
  timeUntilNextEvent
} from '../hacking/hackingState.js';

const hitboxes = () => gameState.ui.hitboxes.hacking;

const activeLock = () => getComputerLockByPropId(gameState.hacking.lockId);

const letterBoxes = (lock) => (lock ? lock.password.length : gameState.config.hacking.passwordLength);

const backdropColor = 'rgba(4, 6, 14, 0.8)';
const panelColor = 'rgba(12, 20, 40, 0.95)';
const borderColor = '#4f7bd9';
const textMuted = '#9fb7ff';
const accentColor = '#8effd6';
const inputAccent = '#fef3b7';
const alertColor = '#ff8b5f';

const panelMetrics = () => {
  const width = gameState.config.canvasWidth * 0.9;
  const height = gameState.config.canvasHeight * 0.45;
  const x = (gameState.config.canvasWidth - width) / 2;
  const y = gameState.config.canvasHeight - height - 24;
  return { x, y, width, height };
};

const drawBackdrop = (ctx) => {
  ctx.save();
  ctx.fillStyle = backdropColor;
  ctx.fillRect(0, gameState.config.canvasHeight * 0.5, gameState.config.canvasWidth, gameState.config.canvasHeight * 0.5);
  ctx.restore();
};

const drawPanel = (ctx, panel) => {
  ctx.save();
  ctx.fillStyle = panelColor;
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 2;
  ctx.fillRect(panel.x, panel.y, panel.width, panel.height);
  ctx.strokeRect(panel.x, panel.y, panel.width, panel.height);
  ctx.restore();
};

const drawLabel = (ctx, text, x, y) => {
  ctx.save();
  ctx.fillStyle = textMuted;
  ctx.font = '18px "Courier New", monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
  ctx.restore();
};

const drawTimerText = (ctx, panel, lock) => {
  const phase = describeHackingPhase(lock);
  const time = timeUntilNextEvent(lock);
  const label = (() => {
    if (!lock) return 'Hacking inactive';
    if (phase === 'revealing') return `Next letter in ${time.toFixed(1)}s`;
    if (phase === 'sorting') return `Sorting position ${lock.sortIndex + 1}/${letterBoxes(lock)}`;
    if (phase === 'auto_complete') return `Auto-complete in ${time.toFixed(1)}s`;
    if (phase === 'complete') return 'Terminal unlocked';
    return 'Hacking active';
  })();
  ctx.save();
  ctx.fillStyle = accentColor;
  ctx.font = '16px "Courier New", monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(label, panel.x + 16, panel.y + 12);
  ctx.restore();
};

const drawBoxes = (ctx, panel, letters, revealed, options = {}) => {
  const count = letters.length;
  const boxSize = 42;
  const gap = 8;
  const totalWidth = count * boxSize + (count - 1) * gap;
  const startX = panel.x + (panel.width - totalWidth) / 2;
  const y = options.y;
  ctx.save();
  for (let i = 0; i < count; i += 1) {
    const x = startX + i * (boxSize + gap);
    ctx.strokeStyle = options.stroke;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, boxSize, boxSize);
    const letter = options.placeholder && !revealed?.[i]
      ? options.placeholder
      : letters[i] ?? '';
    if (letter) {
      ctx.fillStyle = options.textColor;
      ctx.font = '22px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(letter, x + boxSize / 2, y + boxSize / 2 + 2);
    }
  }
  ctx.restore();
};

const buildInputLetters = (lock) => {
  const length = letterBoxes(lock);
  const input = (gameState.hacking.input || '').split('');
  while (input.length < length) input.push('');
  return input;
};

const drawButtons = (ctx, panel, canSubmit) => {
  const buttonWidth = panel.width * 0.18;
  const buttonHeight = 42;
  const spacing = 16;
  const exitX = panel.x + panel.width - buttonWidth - spacing;
  const enterX = exitX - buttonWidth - spacing;
  const y = panel.y + panel.height - buttonHeight - spacing;

  ctx.save();
  ctx.fillStyle = canSubmit ? '#1f4d3f' : '#2a2c36';
  ctx.strokeStyle = canSubmit ? '#3dd17a' : '#6b7280';
  ctx.lineWidth = 2;
  ctx.fillRect(enterX, y, buttonWidth, buttonHeight);
  ctx.strokeRect(enterX, y, buttonWidth, buttonHeight);
  ctx.fillStyle = canSubmit ? '#8effd6' : '#c5d8ff';
  ctx.font = '18px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('ENTER PASSWORD', enterX + buttonWidth / 2, y + buttonHeight / 2);

  ctx.fillStyle = '#4a1f1f';
  ctx.strokeStyle = '#ff8b5f';
  ctx.fillRect(exitX, y, buttonWidth, buttonHeight);
  ctx.strokeRect(exitX, y, buttonWidth, buttonHeight);
  ctx.fillStyle = '#ffb199';
  ctx.fillText('EXIT HACK', exitX + buttonWidth / 2, y + buttonHeight / 2);
  ctx.restore();

  hitboxes().enterButton = { x: enterX, y, x2: enterX + buttonWidth, y2: y + buttonHeight, enabled: canSubmit };
  hitboxes().exitButton = { x: exitX, y, x2: exitX + buttonWidth, y2: y + buttonHeight };
};

export const renderHacking = (ctx) => {
  if (!isHackingActive()) {
    hitboxes().enterButton = null;
    hitboxes().exitButton = null;
    return;
  }
  const lock = activeLock();
  drawBackdrop(ctx);
  const panel = panelMetrics();
  drawPanel(ctx, panel);
  drawTimerText(ctx, panel, lock);
  const length = letterBoxes(lock);
  const topY = panel.y + 56;
  const bottomY = topY + 80;
  const scrambled = lock?.scrambled ?? [];
  const revealedLetters = Array.from({ length }, (_, index) => (lock?.revealed?.[index] ? scrambled[index] : ''));
  drawLabel(ctx, 'Captured Signal', panel.x + 24, topY - 24);
  drawBoxes(ctx, panel, revealedLetters, lock?.revealed, { y: topY, stroke: borderColor, textColor: accentColor, placeholder: '?' });
  drawLabel(ctx, 'Compose Password', panel.x + 24, bottomY - 24);
  const inputLetters = buildInputLetters(lock);
  drawBoxes(ctx, panel, inputLetters, null, { y: bottomY, stroke: inputAccent, textColor: inputAccent });
  const canSubmit = Boolean(lock) && gameState.hacking.input.length === length;
  drawButtons(ctx, panel, canSubmit);
  const feedback = gameState.hacking.feedback;
  if (feedback) {
    ctx.save();
    ctx.fillStyle = feedback.type === 'error' ? alertColor : accentColor;
    ctx.font = '16px "Courier New", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText(feedback.message, panel.x + 24, panel.y + panel.height - 12);
    ctx.restore();
  }
};

const pointInRect = (rect, x, y) => (
  rect && x >= rect.x && x <= rect.x2 && y >= rect.y && y <= rect.y2
);

export const handleHackingClick = (screenX, screenY) => {
  if (!isHackingActive()) return false;
  const { enterButton, exitButton } = hitboxes();
  if (exitButton && pointInRect(exitButton, screenX, screenY)) {
    exitHackingSession();
    return true;
  }
  if (enterButton && pointInRect(enterButton, screenX, screenY)) {
    if (enterButton.enabled) submitHackingInput();
    return true;
  }
  return true;
};
