import { gameState } from '../state/gameState.js';

const tabHitboxes = [];

const toggleJournal = () => { gameState.ui.showJournal = !gameState.ui.showJournal; };

const setActiveTab = (tabId) => {
  const entry = gameState.journal.byId[tabId];
  if (!entry) return;
  gameState.ui.journal.activeTab = tabId;
};

export const handleJournalToggle = (key) => {
  if (key === 'j') toggleJournal();
};

export const handleJournalClick = (screenX, screenY) => {
  if (!gameState.ui.showJournal) return false;
  const hit = tabHitboxes.find((tab) => (
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
  const width = gameState.config.canvasWidth * 0.6;
  const height = gameState.config.canvasHeight * 0.55;
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
  ctx.fillText('Crew Journal', panel.x + 24, panel.y + 16);
  ctx.restore();
};

const drawTabs = (ctx, panel) => {
  const tabs = gameState.journal.entries;
  tabHitboxes.length = 0;
  if (!tabs.length) return { x: panel.x + 24, y: panel.y + 96, width: panel.width - 48, height: panel.height - 120 };
  const tabHeight = 48;
  const tabWidth = panel.width / tabs.length;
  const baseY = panel.y + 72;
  ctx.save();
  tabs.forEach((entry, index) => {
    const x = panel.x + index * tabWidth;
    const y = baseY;
    const isActive = entry.id === gameState.ui.journal.activeTab;
    const label = entry.knownName ? entry.roleName : 'Unknown Locker';
    ctx.fillStyle = isActive ? 'rgba(15, 36, 74, 0.95)' : 'rgba(10, 24, 48, 0.7)';
    ctx.fillRect(x, y, tabWidth, tabHeight);
    ctx.strokeStyle = isActive ? '#8effd6' : '#4f7bd9';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, tabWidth, tabHeight);
    ctx.fillStyle = isActive ? '#8effd6' : '#c5d8ff';
    ctx.font = '18px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x + tabWidth / 2, y + tabHeight / 2);
    if (entry.hasKeycard) {
      ctx.fillStyle = '#3dd17a';
      ctx.fillRect(x + tabWidth - 18, y + 8, 10, 10);
    }
    tabHitboxes.push({ id: entry.id, x, y, width: tabWidth, height: tabHeight });
  });
  ctx.restore();
  return {
    x: panel.x + 32,
    y: baseY + tabHeight + 24,
    width: panel.width - 64,
    height: panel.height - (tabHeight + 120)
  };
};

const getJournalEntry = (tabId) => gameState.journal.byId[tabId];

const formatMethods = (role) => (
  role.methods.map((method) => `${method.name} (${method.category})`).join(', ')
);

const drawEvidenceList = (ctx, area, entry) => {
  const evidence = entry.evidence;
  const startY = area.y + 120;
  ctx.save();
  ctx.fillStyle = '#c5d8ff';
  ctx.font = '18px "Courier New", monospace';
  ctx.fillText('Evidence:', area.x, startY);
  ctx.restore();
  if (!evidence.length) {
    ctx.save();
    ctx.fillStyle = '#8effd6';
    ctx.font = '18px "Courier New", monospace';
    ctx.fillText('No evidence logged.', area.x, startY + 28);
    ctx.restore();
    return;
  }
  evidence.forEach((entryItem, index) => {
    ctx.save();
    ctx.fillStyle = '#8effd6';
    ctx.font = '18px "Courier New", monospace';
    ctx.fillText(`• ${entryItem.label}`, area.x, startY + 28 + index * 24);
    ctx.restore();
  });
};

const drawContent = (ctx, area, activeTab) => {
  const entry = getJournalEntry(activeTab);
  const role = entry ? gameState.config.roles[entry.id] : null;
  ctx.save();
  ctx.fillStyle = '#8effd6';
  ctx.font = '22px "Courier New", monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  if (!entry || !role) {
    ctx.fillText('No dossier available.', area.x, area.y);
    ctx.restore();
    return;
  }
  const identity = entry.knownName ? role.name : 'Unknown Crew Member';
  const lines = [
    `Station: ${role.name}`,
    `Identity: ${identity}`,
    `Keycard: ${entry.hasKeycard ? 'Acquired' : 'Missing'}`,
    `Method Access: ${formatMethods(role)}`
  ];
  const victim = gameState.case.victim;
  if (victim && victim.roleKey === activeTab && gameState.case.identified) {
    lines.push(`Victim Identified: ${gameState.case.victimName}`);
    lines.push(`Cause: ${gameState.case.methodCategory}`);
    lines.push(`Window: ${gameState.case.timeWindow}`);
  }
  lines.forEach((line, index) => {
    const offset = index * 32;
    ctx.fillText(line, area.x, area.y + offset);
  });
  ctx.restore();
  drawEvidenceList(ctx, area, entry);
};

export const renderJournal = (ctx) => {
  if (!gameState.ui.showJournal) return;
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
