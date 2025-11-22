import { gameState } from './gameState.js';

export const OverlayId = Object.freeze({
  NONE: null,
  INVENTORY: 'inventory',
  JOURNAL: 'journal',
  MINIMAP: 'minimap',
  LOCKPICK: 'lockpick',
  HACKING: 'hacking',
  ACCUSATION: 'accusation',
  UPGRADES: 'upgrades',
  CONTAINER: 'container',
  VENDING: 'vending',
  WEAPON_TESTING: 'weapon_testing',
  GAME_OVER: 'game_over'
});

export const openOverlay = (overlayId) => {
  if (gameState.ui.activeOverlay === overlayId) return;
  gameState.ui.activeOverlay = overlayId;
};

export const closeOverlay = () => {
  gameState.ui.activeOverlay = null;
};

export const toggleOverlay = (overlayId) => {
  if (gameState.ui.activeOverlay === overlayId) {
    closeOverlay();
  } else {
    openOverlay(overlayId);
  }
};

export const isOverlayActive = (overlayId) => gameState.ui.activeOverlay === overlayId;
