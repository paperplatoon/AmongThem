import { gameState } from '../state/gameState.js';
import { applyEfficientHackToLocks } from '../hacking/hackingState.js';
import { applyFastLockpickToLocks } from '../lockpick/lockpickSystem.js';

/**
 * Master upgrade pool - all possible upgrades in the game.
 * Each upgrade is self-contained with all necessary information.
 */
export const UPGRADE_POOL = Object.freeze([
  Object.freeze({
    id: 'taser',
    label: 'Taser',
    baseCost: 300,
    description: 'Stun the killer for 10 seconds',
    ownershipCheck: () => gameState.player.taser?.hasTaser,
    applyUpgrade: () => {
      const taser = gameState.player.taser;
      if (taser) {
        taser.hasTaser = true;
        taser.cooldownRemaining = 0;
      }
    }
  }),

  Object.freeze({
    id: 'keycard_locator',
    label: 'Keycard Locator',
    baseCost: 200,
    description: 'Reveals keycard locations on map',
    ownershipCheck: () => gameState.player.upgrades?.keycardLocator,
    applyUpgrade: () => {
      gameState.player.upgrades.keycardLocator = true;
    }
  }),

  Object.freeze({
    id: 'faster_hack',
    label: 'Faster Hack',
    baseCost: 180,
    description: 'Hack computers 2x faster',
    ownershipCheck: () => gameState.player.upgrades?.hasFasterHack,
    applyUpgrade: () => {
      const upgrades = gameState.player.upgrades;
      upgrades.hasFasterHack = true;
      upgrades.hackSpeedMultiplier *= 2;
    }
  }),

  Object.freeze({
    id: 'efficient_hack',
    label: 'Efficient Hacking',
    baseCost: 220,
    description: 'Reduces hacking difficulty',
    ownershipCheck: () => gameState.player.upgrades?.efficientHack,
    applyUpgrade: () => {
      gameState.player.upgrades.efficientHack = true;
      applyEfficientHackToLocks();
    }
  }),

  Object.freeze({
    id: 'fast_lockpick',
    label: 'Fast Lockpick',
    baseCost: 160,
    description: 'Pick locks faster',
    ownershipCheck: () => gameState.player.upgrades?.fastLockpick,
    applyUpgrade: () => {
      gameState.player.upgrades.fastLockpick = true;
      applyFastLockpickToLocks();
    }
  }),

  Object.freeze({
    id: 'skeleton_key',
    label: 'Skeleton Key',
    baseCost: 250,
    description: 'Unlock all doors instantly',
    ownershipCheck: () => gameState.player.upgrades?.skeletonKey,
    applyUpgrade: () => {
      gameState.player.upgrades.skeletonKey = true;
    }
  }),

  Object.freeze({
    id: 'master_virus',
    label: 'Master Virus',
    baseCost: 280,
    description: 'Bypass all computer security',
    ownershipCheck: () => gameState.player.upgrades?.masterVirus,
    applyUpgrade: () => {
      gameState.player.upgrades.masterVirus = true;
    }
  }),

  Object.freeze({
    id: 'fast_blood_scanner',
    label: 'Fast Blood Scanner',
    baseCost: 150,
    description: 'Blood scanner 75% faster',
    ownershipCheck: () => gameState.player.upgrades?.fastBloodScanner,
    applyUpgrade: () => {
      const upgrades = gameState.player.upgrades;
      upgrades.fastBloodScanner = true;
      upgrades.bloodScannerSpeedMultiplier *= 4;
    }
  }),

  Object.freeze({
    id: 'extended_blood_detector',
    label: 'Extended Blood Detector',
    baseCost: 120,
    description: 'Blood detector range +500%',
    ownershipCheck: () => gameState.player.upgrades?.extendedBloodDetector,
    applyUpgrade: () => {
      const upgrades = gameState.player.upgrades;
      upgrades.extendedBloodDetector = true;
      upgrades.bloodDetectorRangeMultiplier *= 6;
    }
  })
]);

/**
 * Helper to check if a specific upgrade is owned
 */
export const isUpgradeOwned = (upgradeId) => {
  const upgrade = UPGRADE_POOL.find(u => u.id === upgradeId);
  return upgrade ? upgrade.ownershipCheck() : false;
};

/**
 * Helper to get upgrade by id
 */
export const getUpgradeById = (upgradeId) => {
  return UPGRADE_POOL.find(u => u.id === upgradeId);
};
