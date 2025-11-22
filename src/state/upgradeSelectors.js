import { gameState } from './gameState.js';

export const hasSkeletonKeyUpgrade = () => (
  Boolean(gameState.player.upgrades?.skeletonKey) || Boolean(gameState.player.upgrades?.testingSkeletonKey)
);

export const hasMasterVirusUpgrade = () => (
  Boolean(gameState.player.upgrades?.masterVirus) || Boolean(gameState.player.upgrades?.testingMasterVirus)
);

export const hasElectricBootsUpgrade = () => (
  Boolean(gameState.player.upgrades?.electricBoots) || Boolean(gameState.player.upgrades?.testingElectricBoots)
);
