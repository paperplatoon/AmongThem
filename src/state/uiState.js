import { config } from './config.js';

const roleOrder = Object.keys(config.roles);

export const uiState = Object.seal({
  showJournal: false,
  showGameOver: false,
  openContainerId: null,
  openVendingId: null,
  openLockpickId: null,
  openAccusation: false,
  vendingMessage: null,
  activeOverlay: null,
  journal: Object.seal({
    activeTab: roleOrder[0] ?? null
  }),
  hitboxes: Object.seal({
    inventorySlots: [],
    inventoryCancelButton: null,
    journalTabs: [],
    journalStatus: [],
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
    accusation: Object.seal({
      roleButtons: [],
      closeButton: null
    }),
    upgradeButton: null,
    upgradesOverlay: Object.seal({ closeButton: null, testingToggle: null }),
    hacking: Object.seal({
      enterButton: null,
      exitButton: null,
      virusButton: null
    })
  }),
  inventorySwap: Object.seal({
    active: false,
    incomingItem: null,
    sourcePropId: null,
    sourceItemId: null,
    previousInventoryVisible: false
  })
});
