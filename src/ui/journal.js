import { gameState } from '../state/gameState.js';

const STATUS_OPTIONS = Object.freeze([
  { key: 'victim', label: 'Victim', color: '#8c5bff' },
  { key: 'suspect', label: 'Suspect', color: '#ffd65c' },
  { key: 'cleared', label: 'Innocent', color: '#5fbf8f' },
  { key: 'killer', label: 'Killer', color: '#ff6666' }
]);

const toggleJournal = () => { gameState.ui.showJournal = !gameState.ui.showJournal; };

const setActiveTab = (tabId) => {
  const entry = gameState.journal.byId[tabId];
  if (!entry) return;
  gameState.ui.journal.activeTab = tabId;
};

export const handleJournalToggle = (key) => {
  if (key === 'j') toggleJournal();
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

export const handleJournalClick = (screenX, screenY) => {
  if (!gameState.ui.showJournal) return false;
  if (tryHandleStatusClick(screenX, screenY)) return true;
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
  hitboxes.length = 0;
  gameState.ui.hitboxes.journalStatus.length = 0;
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
  const statusRowY = area.y;
  drawStatusControls(ctx, area, entry, statusRowY);
  const lineStartY = statusRowY + 56;
  const nameLine = entry.knownName ? entry.personName : 'Unknown';
  const lines = [
    { label: 'Role', value: role.name },
    { label: 'Name', value: nameLine },
    { label: 'Keycard', value: entry.hasKeycard ? 'Acquired' : 'Missing' }
  ];
  const victim = gameState.case.victim;
  if (victim && victim.roleKey === activeTab && gameState.case.identified) {
    lines.push({ label: 'Victim Identified', value: gameState.case.victimName });
    lines.push({ label: 'Cause', value: gameState.case.methodCategory });
    lines.push({ label: 'Window', value: gameState.case.timeWindow });
  }
  lines.forEach((line, index) => {
    const offset = index * 32;
    ctx.fillText(`${line.label}:`, area.x, lineStartY + offset);
    const labelWidth = ctx.measureText(`${line.label}: `).width;
    ctx.fillText(line.value, area.x + labelWidth, lineStartY + offset);
  });
  ctx.restore();
};

export const renderJournal = (ctx) => {
  if (!gameState.ui.showJournal) {
    gameState.ui.hitboxes.journalTabs.length = 0;
    return;
  }
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
