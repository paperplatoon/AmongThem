import { config } from './config.js';

const roleOrder = Object.keys(config.roles);

export const uiState = Object.seal({
  showMinimap: false,
  showInventory: false,
  showJournal: false,
  showGameOver: false,
  openContainerId: null,
  openVendingId: null,
  openLockpickId: null,
  vendingMessage: null,
  journal: Object.seal({
    activeTab: roleOrder[0] ?? null
  }),
  hitboxes: Object.seal({
    inventorySlots: [],
    journalTabs: [],
    containerSlots: [],
    containerCloseButton: null,
    gameOverButton: null,
    vendingOptions: [],
    vendingCloseButton: null,
    lockpick: Object.seal({
      closeButton: null,
      bypassButton: null,
      leftArrow: null,
      rightArrow: null
    }),
    hacking: Object.seal({
      enterButton: null,
      exitButton: null
    })
  })
});
