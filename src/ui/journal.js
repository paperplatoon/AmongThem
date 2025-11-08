import { gameState } from '../state/gameState.js';

const tabHitboxes = [];

const toggleJournal = () => { gameState.ui.showJournal = !gameState.ui.showJournal; };

const setActiveTab = (tabId) => {
  const tabs = gameState.ui.journal.tabs;
  if (!tabs.some((tab) => tab.id === tabId)) return;
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
  const tabs = gameState.ui.journal.tabs;
  tabHitboxes.length = 0;
  if (!tabs.length) return { x: panel.x + 24, y: panel.y + 96, width: panel.width - 48, height: panel.height - 120 };
  const tabHeight = 48;
  const tabWidth = panel.width / tabs.length;
  const baseY = panel.y + 72;
  ctx.save();
  tabs.forEach((tab, index) => {
    const x = panel.x + index * tabWidth;
    const y = baseY;
    const isActive = tab.id === gameState.ui.journal.activeTab;
    ctx.fillStyle = isActive ? 'rgba(15, 36, 74, 0.95)' : 'rgba(10, 24, 48, 0.7)';
    ctx.fillRect(x, y, tabWidth, tabHeight);
    ctx.strokeStyle = isActive ? '#8effd6' : '#4f7bd9';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, tabWidth, tabHeight);
    ctx.fillStyle = isActive ? '#8effd6' : '#c5d8ff';
    ctx.font = '20px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(tab.label, x + tabWidth / 2, y + tabHeight / 2);
    tabHitboxes.push({ id: tab.id, x, y, width: tabWidth, height: tabHeight });
  });
  ctx.restore();
  return {
    x: panel.x + 32,
    y: baseY + tabHeight + 24,
    width: panel.width - 64,
    height: panel.height - (tabHeight + 120)
  };
};

const roleForTab = (tabId) => gameState.config.roles[tabId];

const formatMethods = (role) => (
  role.methods.map((method) => `${method.name} (${method.category})`).join(', ')
);

const drawContent = (ctx, area, activeTab) => {
  const role = roleForTab(activeTab);
  ctx.save();
  ctx.fillStyle = '#8effd6';
  ctx.font = '22px "Courier New", monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  if (!role) {
    ctx.fillText('No dossier available.', area.x, area.y);
    ctx.restore();
    return;
  }
  const lines = [
    `Role: ${role.name}`,
    `Known Crew: ${role.names.join(', ')}`,
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
};

export const renderJournal = (ctx) => {
  if (!gameState.ui.showJournal) return;
  drawBackdrop(ctx);
  const panel = drawPanel(ctx);
  drawTitle(ctx, panel);
  const contentArea = drawTabs(ctx, panel);
  drawContent(ctx, contentArea, gameState.ui.journal.activeTab);
};
