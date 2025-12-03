import { gameState } from '../state/gameState.js';
import { OverlayId, toggleOverlay, isOverlayActive } from '../state/overlayManager.js';
import { markIdeology, markRank } from '../state/journalState.js';

const STATUS_OPTIONS = Object.freeze([
  { key: 'victim', label: 'Victim', color: '#8c5bff' },
  { key: 'suspect', label: 'Suspect', color: '#ffd65c' },
  { key: 'cleared', label: 'Innocent', color: '#5fbf8f' },
  { key: 'killer', label: 'Killer', color: '#ff6666' }
]);

const IDEOLOGY_OPTIONS = Object.freeze([
  { key: null, label: 'Unknown', color: '#666' },
  { key: 'communist', label: 'Communist', color: '#d32f2f' },
  { key: 'fascist', label: 'Fascist', color: '#6d4c41' },
  { key: 'liberal', label: 'Liberal', color: '#1976d2' },
  { key: 'conservative', label: 'Conservative', color: '#7b1fa2' }
]);

const RANK_OPTIONS = Object.freeze([
  { key: null, label: '?', color: '#666' },
  { key: 1, label: '1', color: '#ffd700' },
  { key: 2, label: '2', color: '#c0c0c0' },
  { key: 3, label: '3', color: '#cd7f32' },
  { key: 4, label: '4', color: '#4a90e2' },
  { key: 5, label: '5', color: '#50c878' },
  { key: 6, label: '6', color: '#9b59b6' },
  { key: 7, label: '7', color: '#e74c3c' },
  { key: 8, label: '8', color: '#f39c12' }
]);

const setActiveTab = (tabId) => {
  const entry = gameState.journal.byId[tabId];
  if (!entry) return;
  gameState.ui.journal.activeTab = tabId;
};

export const handleJournalToggle = (key) => {
  if (key === 'j') toggleOverlay(OverlayId.JOURNAL);
};

const tryHandleStatusClick = (screenX, screenY) => {
  const hits = gameState.ui.hitboxes.journalStatus;
  const statusHit = hits.find((entry) => (
    screenX >= entry.x && screenX <= entry.x2 && screenY >= entry.y && screenY <= entry.y2
  ));
  if (!statusHit) return false;
  const journalEntry = gameState.journal.byId[statusHit.roleId];
  if (!journalEntry) return false;
  journalEntry.status = statusHit.status;
  return true;
};

const tryHandleIdeologyClick = (screenX, screenY) => {
  const hits = gameState.ui.hitboxes.journalIdeology;
  const hit = hits.find((entry) => (
    screenX >= entry.x && screenX <= entry.x2 && screenY >= entry.y && screenY <= entry.y2
  ));
  if (!hit) return false;
  markIdeology(hit.roleId, hit.ideology);
  return true;
};

const tryHandleRankClick = (screenX, screenY) => {
  const hits = gameState.ui.hitboxes.journalRank;
  const hit = hits.find((entry) => (
    screenX >= entry.x && screenX <= entry.x2 && screenY >= entry.y && screenY <= entry.y2
  ));
  if (!hit) return false;
  markRank(hit.roleId, hit.rank);
  return true;
};

export const handleJournalClick = (screenX, screenY) => {
  if (!isOverlayActive(OverlayId.JOURNAL)) return false;
  if (tryHandleStatusClick(screenX, screenY)) return true;
  if (tryHandleIdeologyClick(screenX, screenY)) return true;
  if (tryHandleRankClick(screenX, screenY)) return true;
  const tabs = gameState.ui.hitboxes.journalTabs;
  const hit = tabs.find((tab) => (
    screenX >= tab.x &&
    screenX <= tab.x + tab.width &&
    screenY >= tab.y &&
    screenY <= tab.y + tab.height
  ));
  if (!hit) return false;
  setActiveTab(hit.id);
  return true;
};

const drawBackdrop = (ctx) => {
  ctx.save();
  ctx.fillStyle = 'rgba(8, 12, 24, 0.85)';
  ctx.fillRect(0, 0, gameState.config.canvasWidth, gameState.config.canvasHeight);
  ctx.restore();
};

const drawPanel = (ctx) => {
  const width = gameState.config.canvasWidth * 0.85;
  const height = gameState.config.canvasHeight * 0.8;
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
  ctx.font = '42px "Courier New", monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('Crew Journal', panel.x + 24, panel.y + 16);
  ctx.restore();
};

const tabFill = (entry, isActive) => {
  const status = entry.status;
  if (status === 'victim') return isActive ? '#4f2b7f' : '#382056';
  if (status === 'suspect') return isActive ? '#6b4c12' : '#4b3810';
  if (status === 'killer') return isActive ? '#670b17' : '#470912';
  if (status === 'cleared') return isActive ? '#1f4a32' : '#123125';
  return isActive ? 'rgba(15, 36, 74, 0.95)' : 'rgba(10, 24, 48, 0.7)';
};

const tabShadow = (entry) => {
  if (entry.status === 'victim') return '0 2px 8px rgba(182, 140, 255, 0.35)';
  if (entry.status === 'suspect') return '0 2px 8px rgba(255, 215, 92, 0.35)';
  if (entry.status === 'killer') return '0 2px 8px rgba(255, 80, 80, 0.35)';
  if (entry.status === 'cleared') return '0 2px 8px rgba(95, 191, 143, 0.35)';
  return '0 2px 6px rgba(0, 0, 0, 0.35)';
};

const tabStroke = (entry, isActive) => {
  const status = entry.status;
  if (status === 'victim') return '#b68cff';
  if (status === 'suspect') return '#ffd65c';
  if (status === 'killer') return '#ff6666';
  if (status === 'cleared') return '#5fbf8f';
  return isActive ? '#8effd6' : '#4f7bd9';
};

const drawTabs = (ctx, panel) => {
  const tabs = gameState.journal.entries;
  const hitboxes = gameState.ui.hitboxes.journalTabs;
  if (!tabs.length) return { x: panel.x + 24, y: panel.y + 96, width: panel.width - 48, height: panel.height - 120 };
  const tabHeight = 64;
  const tabWidth = panel.width / tabs.length;
  const baseY = panel.y + 72;
  ctx.save();
  tabs.forEach((entry, index) => {
    const x = panel.x + index * tabWidth;
    const y = baseY;
    const isActive = entry.id === gameState.ui.journal.activeTab;
    const label = gameState.config.roles[entry.id].name;
    ctx.fillStyle = tabFill(entry, isActive);
    ctx.fillRect(x, y, tabWidth, tabHeight);
    ctx.strokeStyle = tabStroke(entry, isActive);
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, tabWidth, tabHeight);
    ctx.shadowColor = tabShadow(entry);
    ctx.shadowBlur = 6;
    ctx.fillStyle = isActive ? '#fefefe' : '#c5d8ff';
    ctx.font = '22px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x + tabWidth / 2, y + tabHeight / 2);
    ctx.shadowBlur = 0;
    if (entry.hasKeycard) {
      ctx.fillStyle = '#3dd17a';
      ctx.fillRect(x + tabWidth - 30, y + 8, 14, 14);
    }
    hitboxes.push({ id: entry.id, x, y, width: tabWidth, height: tabHeight });
  });
  ctx.restore();
  return {
    x: panel.x + 32,
    y: baseY + tabHeight + 16,
    width: panel.width - 64,
    height: panel.height - (tabHeight + 120)
  };
};

const getJournalEntry = (tabId) => gameState.journal.byId[tabId];

const drawStatusControls = (ctx, area, entry, topY) => {
  const checkboxWidth = 120;
  const checkboxHeight = 36;
  const spacing = 12;
  const totalWidth = STATUS_OPTIONS.length * checkboxWidth + (STATUS_OPTIONS.length - 1) * spacing;
  const startX = area.x;
  const hitboxes = gameState.ui.hitboxes.journalStatus;
  STATUS_OPTIONS.forEach((option, index) => {
    const x = startX + index * (checkboxWidth + spacing);
    const y = topY;
    const isActive = entry.status === option.key;
    ctx.save();
    ctx.fillStyle = isActive ? option.color : 'rgba(15, 20, 34, 0.6)';
    ctx.strokeStyle = option.color;
    ctx.lineWidth = 2;
    ctx.fillRect(x, y, checkboxWidth, checkboxHeight);
    ctx.strokeRect(x, y, checkboxWidth, checkboxHeight);
    ctx.fillStyle = isActive ? '#0a0f1c' : option.color;
    ctx.font = '18px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(option.label, x + checkboxWidth / 2, y + checkboxHeight / 2);
    ctx.restore();
    hitboxes.push({ roleId: entry.id, status: option.key, x, y, x2: x + checkboxWidth, y2: y + checkboxHeight });
  });
};

const drawIdeologyControls = (ctx, area, entry, topY) => {
  const buttonWidth = 90;
  const buttonHeight = 32;
  const spacing = 8;
  const startX = area.x;
  const hitboxes = gameState.ui.hitboxes.journalIdeology;
  IDEOLOGY_OPTIONS.forEach((option, index) => {
    const x = startX + index * (buttonWidth + spacing);
    const y = topY;
    const isActive = entry.trackedIdeology === option.key;
    ctx.save();
    ctx.fillStyle = isActive ? option.color : 'rgba(15, 20, 34, 0.6)';
    ctx.strokeStyle = option.color;
    ctx.lineWidth = 2;
    ctx.fillRect(x, y, buttonWidth, buttonHeight);
    ctx.strokeRect(x, y, buttonWidth, buttonHeight);
    ctx.fillStyle = isActive ? '#fff' : option.color;
    ctx.font = '14px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(option.label, x + buttonWidth / 2, y + buttonHeight / 2);
    ctx.restore();
    hitboxes.push({ roleId: entry.id, ideology: option.key, x, y, x2: x + buttonWidth, y2: y + buttonHeight });
  });
};

const drawRankControls = (ctx, area, entry, topY) => {
  const buttonSize = 32;
  const spacing = 8;
  const startX = area.x;
  const hitboxes = gameState.ui.hitboxes.journalRank;
  RANK_OPTIONS.forEach((option, index) => {
    const x = startX + index * (buttonSize + spacing);
    const y = topY;
    const isActive = entry.trackedRank === option.key;
    ctx.save();
    ctx.fillStyle = isActive ? option.color : 'rgba(15, 20, 34, 0.6)';
    ctx.strokeStyle = option.color;
    ctx.lineWidth = 2;
    ctx.fillRect(x, y, buttonSize, buttonSize);
    ctx.strokeRect(x, y, buttonSize, buttonSize);
    ctx.fillStyle = isActive ? '#fff' : option.color;
    ctx.font = '16px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(option.label, x + buttonSize / 2, y + buttonSize / 2);
    ctx.restore();
    hitboxes.push({ roleId: entry.id, rank: option.key, x, y, x2: x + buttonSize, y2: y + buttonSize });
  });
};

const formatMethods = (role) => (
  role.methods.map((method) => `${method.name} (${method.category})`).join(', ')
);

const drawContent = (ctx, area, activeTab) => {
  const entry = getJournalEntry(activeTab);
  const role = entry ? gameState.config.roles[entry.id] : null;

  ctx.save();
  ctx.fillStyle = '#8effd6';
  ctx.font = '26px "Courier New", monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  if (!entry || !role) {
    ctx.fillText('No dossier available.', area.x, area.y);
    ctx.restore();
    return;
  }

  let currentY = area.y;

  // Status controls
  drawStatusControls(ctx, area, entry, currentY);
  currentY += 48;

  // Ideology controls (only for non-victim)
  if (entry.id !== gameState.case.victim?.roleKey) {
    ctx.fillStyle = '#a0c0ff';
    ctx.font = '18px "Courier New", monospace';
    ctx.fillText('Political Ideology:', area.x, currentY);
    currentY += 24;
    drawIdeologyControls(ctx, area, entry, currentY);
    currentY += 44;

    // Rank controls
    ctx.fillStyle = '#a0c0ff';
    ctx.fillText('Ship Rank:', area.x, currentY);
    currentY += 24;
    drawRankControls(ctx, area, entry, currentY);
    currentY += 48;
  } else {
    currentY += 8;
  }

  // Basic info lines
  ctx.fillStyle = '#8effd6';
  ctx.font = '22px "Courier New", monospace';
  const nameLine = entry.knownName ? entry.personName : 'Unknown';
  const lines = [
    { label: 'Role', value: role.name },
    { label: 'Name', value: nameLine },
    { label: 'Keycard', value: entry.hasKeycard ? 'Acquired' : 'Missing' }
  ];
  if (entry.id === gameState.case.victim?.roleKey) {
    // Show Cause of Death if autopsy performed
    if (gameState.case.autopsyPerformed && gameState.case.methodCategory) {
      lines.push({ label: 'Cause of Death', value: gameState.case.methodCategory });
    }

    // Show Time of Death if we have a window
    if (gameState.case.timeOfDeathWindow4h) {
      lines.push({ label: 'Time of Death', value: gameState.case.timeOfDeathWindow4h });
    } else if (gameState.case.timeOfDeathWindow8h) {
      lines.push({ label: 'Time of Death', value: gameState.case.timeOfDeathWindow8h });
    }
  }
  if (entry.weaponCategory) {
    lines.push({ label: 'Locker Evidence', value: entry.weaponCategory });
  }
  lines.forEach((line, index) => {
    const offset = index * 28;
    ctx.fillText(`${line.label}:`, area.x, currentY + offset);
    const labelWidth = ctx.measureText(`${line.label}: `).width;
    ctx.fillText(line.value, area.x + labelWidth, currentY + offset);
  });
  currentY += lines.length * 28 + 16;

  // Display motive clues if any
  if (entry.motiveClues && entry.motiveClues.length > 0) {
    ctx.fillStyle = '#ffd65c';
    ctx.font = '20px "Courier New", monospace';
    ctx.fillText('Personal Files:', area.x, currentY);
    currentY += 28;

    ctx.fillStyle = '#a0c0ff';
    ctx.font = '16px "Courier New", monospace';
    entry.motiveClues.forEach((clue, index) => {
      const wrappedLines = wrapText(ctx, clue, area.width - 20);
      wrappedLines.forEach((line, lineIndex) => {
        ctx.fillText(lineIndex === 0 ? `• ${line}` : `  ${line}`, area.x + 10, currentY);
        currentY += 20;
      });
      currentY += 4; // Small gap between clues
    });
  }

  ctx.restore();
};

const wrapText = (ctx, text, maxWidth) => {
  const words = text.split(' ');
  const lines = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const testLine = currentLine + ' ' + words[i];
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth) {
      lines.push(currentLine);
      currentLine = words[i];
    } else {
      currentLine = testLine;
    }
  }
  lines.push(currentLine);
  return lines;
};

export const renderJournal = (ctx) => {
  if (!isOverlayActive(OverlayId.JOURNAL)) {
    gameState.ui.hitboxes.journalTabs.length = 0;
    gameState.ui.hitboxes.journalStatus.length = 0;
    gameState.ui.hitboxes.journalIdeology.length = 0;
    gameState.ui.hitboxes.journalRank.length = 0;
    return;
  }

  // Clear all journal hitboxes at start of render
  gameState.ui.hitboxes.journalTabs.length = 0;
  gameState.ui.hitboxes.journalStatus.length = 0;
  gameState.ui.hitboxes.journalIdeology.length = 0;
  gameState.ui.hitboxes.journalRank.length = 0;
  drawBackdrop(ctx);
  const panel = drawPanel(ctx);
  drawTitle(ctx, panel);
  const activeTab = gameState.ui.journal.activeTab ?? gameState.journal.entries[0]?.id ?? null;
  if (gameState.ui.journal.activeTab == null && activeTab) {
    gameState.ui.journal.activeTab = activeTab;
  }
  const contentArea = drawTabs(ctx, panel);
  drawContent(ctx, contentArea, activeTab);
};
