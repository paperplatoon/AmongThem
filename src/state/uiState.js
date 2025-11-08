import { config } from './config.js';

const roleOrder = Object.keys(config.roles);

export const uiState = Object.seal({
  showMinimap: false,
  showInventory: false,
  showJournal: false,
  openContainerId: null,
  journal: Object.seal({
    activeTab: roleOrder[0] ?? null
  })
});
