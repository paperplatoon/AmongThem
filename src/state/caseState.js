import { gameState } from './gameState.js';
import { config, MURDER_CONFIG } from './config.js';
import { cellToWorldCenter, worldPointToCell, markCell, WORLD_SOLID } from './gridState.js';
import { markVictimRole, markKillerRole, markVictimIdentified, markInnocenceEvidence, markWeaponCategory } from './journalState.js';
import { EVIDENCE_TYPES } from '../evidence/evidenceHandlers.js';
import { seedComputerLocks } from '../hacking/hackingState.js';
import { initializeTestingStation, generateWeaponTestResults, initializeBioDataTerminal } from './weaponTestingState.js';
import { generateRoomTraits, selectMurderRoom } from './roomTraitsState.js';
import { initializeDoorTerminals } from './doorTerminalState.js';
import { generateNPCBioData } from './bioDataState.js';
import { generateTimeOfDeath, calculateTimeWindow12h, calculateTimeWindow4h } from './timeWindowState.js';
import { generateAllDoorLogs } from './doorLogState.js';
import { initializeUpgradeTerminal } from '../upgrades/upgradeTerminalState.js';

const roleKeys = Object.keys(gameState.config.roles);

const WEAPON_CATEGORIES = Object.freeze([
  { key: 'poisoning', label: 'Poisoning', lockerLabel: 'Poison' },
  { key: 'stabbing', label: 'Stabbing', lockerLabel: 'Stabbing weapon' },
  { key: 'blunt', label: 'Blunt Impact', lockerLabel: 'Blunt weapon' },
  { key: 'gun', label: 'Gunshot', lockerLabel: 'Gun' },
  { key: 'strangulation', label: 'Strangulation', lockerLabel: 'Strangling weapon' }
]);

// ============================================================================
// Trait-Based Motive System - Utility Functions
// ============================================================================

/**
 * Weighted random selection from a map of weights.
 * @param {Object} weightMap - Map of keys to numeric weights (>= 0)
 * @returns {string} - Randomly selected key
 */
const weightedRandomPick = (weightMap) => {
  const entries = Object.entries(weightMap).filter(([_, weight]) => weight > 0);

  if (entries.length === 0) {
    throw new Error('weightedRandomPick: no valid entries with weight > 0');
  }

  const totalWeight = entries.reduce((sum, [_, weight]) => sum + weight, 0);
  let random = Math.random() * totalWeight;

  for (const [key, weight] of entries) {
    random -= weight;
    if (random <= 0) {
      return key;
    }
  }

  // Fallback (should never reach due to floating point)
  return entries[entries.length - 1][0];
};

/**
 * Compute ideology-based motive score between victim and killer.
 * @param {Object} victimTraits - { politicalIdeology, shipRank }
 * @param {Object} killerTraits - { politicalIdeology, shipRank }
 * @returns {number} - Base score for ideology motive (0 if incompatible)
 */
const computeIdeologyBaseScore = (victimTraits, killerTraits) => {
  const ideoCfg = MURDER_CONFIG.traits.politicalIdeology;
  const victimIdeo = victimTraits.politicalIdeology;
  const killerIdeo = killerTraits.politicalIdeology;

  // Lookup compatibility table
  const compatRow = ideoCfg.compatibility[victimIdeo] || {};
  const pairWeight = compatRow[killerIdeo] || 0;

  if (pairWeight === 0) return 0;

  // Multiply by killer ideology base frequency
  const killerFreq = ideoCfg.baseFrequency[killerIdeo] || 0;

  return pairWeight * killerFreq;
};

/**
 * Compute promotion-based motive score between victim and killer.
 * @param {Object} victimTraits - { politicalIdeology, shipRank }
 * @param {Object} killerTraits - { politicalIdeology, shipRank }
 * @returns {number} - Base score for promotion motive (0 if incompatible)
 */
const computePromotionBaseScore = (victimTraits, killerTraits) => {
  const rankCfg = MURDER_CONFIG.traits.shipRank;
  const victimRank = String(victimTraits.shipRank);
  const killerRank = String(killerTraits.shipRank);

  // Lookup rank compatibility (adjacent ranks ±1)
  const compatRow = rankCfg.promotionCompatibility[victimRank] || {};
  const pairWeight = compatRow[killerRank] || 0;

  return pairWeight;
};

/**
 * Compute final motive score including global weights and victim bias.
 * @param {Object} victimTraits - { politicalIdeology, shipRank }
 * @param {Object} killerTraits - { politicalIdeology, shipRank }
 * @param {string} motiveName - 'ideology' or 'promotion'
 * @returns {number} - Final weighted score (0 if no motive)
 */
const computeFinalScore = (victimTraits, killerTraits, motiveName) => {
  // 1. Compute base score from trait compatibility
  let baseScore = 0;

  if (motiveName === 'ideology') {
    baseScore = computeIdeologyBaseScore(victimTraits, killerTraits);
  } else if (motiveName === 'promotion') {
    baseScore = computePromotionBaseScore(victimTraits, killerTraits);
  } else {
    return 0; // Unknown motive type
  }

  if (baseScore <= 0) return 0;

  // 2. Apply global motive weight
  const motiveCfg = MURDER_CONFIG.motives[motiveName];
  const globalWeight = motiveCfg ? motiveCfg.globalWeight : 1.0;

  // 3. Apply victim-ideology-specific motive bias
  const victimIdeo = victimTraits.politicalIdeology;
  const victimBiasTable = MURDER_CONFIG.motives.ideology.victimBias[victimIdeo];

  if (!victimBiasTable) return 0;

  const motiveBias = victimBiasTable[motiveName] || 0;

  if (motiveBias <= 0) return 0;

  // Final score = base * globalWeight * motiveBias
  return baseScore * globalWeight * motiveBias;
};

// ============================================================================
// Trait-Based Motive System - Phase 1: Ideology Assignment & Victim Selection
// ============================================================================

/**
 * Assign political ideologies to all roles.
 * Bridge role is handled specially (will get rank 1 later).
 */
const assignIdeologies = () => {
  const ideologyFreqs = MURDER_CONFIG.traits.politicalIdeology.baseFrequency;

  for (const roleKey of roleKeys) {
    if (!gameState.case.roleTraits[roleKey]) {
      gameState.case.roleTraits[roleKey] = {};
    }
    gameState.case.roleTraits[roleKey].politicalIdeology =
      weightedRandomPick(ideologyFreqs);
  }
};

/**
 * Compute ideology-based murderability for a potential victim.
 * Murderability = sum of all ideology base scores from other roles.
 * @param {string} victimRoleKey - Role to evaluate as victim
 * @returns {number} - Total murderability score
 */
const computeIdeologyMurderability = (victimRoleKey) => {
  let score = 0;
  const victimTraits = gameState.case.roleTraits[victimRoleKey];

  for (const killerRoleKey of roleKeys) {
    if (killerRoleKey === victimRoleKey) continue;
    const killerTraits = gameState.case.roleTraits[killerRoleKey];
    score += computeIdeologyBaseScore(victimTraits, killerTraits);
  }

  return score;
};

/**
 * Select victim based on ideology murderability.
 * Roles with higher ideology-based murder potential are more likely to be victims.
 * @returns {string} - Selected victim roleKey
 */
const selectVictimByIdeology = () => {
  const murderability = {};

  for (const roleKey of roleKeys) {
    murderability[roleKey] = computeIdeologyMurderability(roleKey);
  }

  // Store debug info
  gameState.case.murderDebug.murderabilityScores = murderability;

  // If all scores are 0 (shouldn't happen with config), fall back to random
  const totalScore = Object.values(murderability).reduce((sum, val) => sum + val, 0);
  if (totalScore === 0) {
    console.warn('[Trait System] All murderability scores are 0, selecting random victim');
    return roleKeys[Math.floor(Math.random() * roleKeys.length)];
  }

  return weightedRandomPick(murderability);
};

// ============================================================================
// End Trait-Based Motive System - Phase 1
// ============================================================================

// ============================================================================
// Trait-Based Motive System - Phase 2: Strategic Rank Assignment
// ============================================================================

/**
 * Count how many suspects have ideology-based motives against a victim.
 * @param {string} victimRoleKey - The victim role
 * @returns {number} - Count of roles with ideology motive
 */
const countIdeologyPlausibleSuspects = (victimRoleKey) => {
  let count = 0;
  const victimTraits = gameState.case.roleTraits[victimRoleKey];

  for (const suspectRoleKey of roleKeys) {
    if (suspectRoleKey === victimRoleKey) continue;
    const suspectTraits = gameState.case.roleTraits[suspectRoleKey];
    if (computeIdeologyBaseScore(victimTraits, suspectTraits) > 0) {
      count++;
    }
  }

  return count;
};

/**
 * Strategically assign ship ranks to ensure adequate suspect pool.
 * Bridge always gets rank 1. Victim gets random rank.
 * If ideology suspects are insufficient, assign adjacent ranks to create promotion motives.
 * @param {string} victimRoleKey - The selected victim
 */
const assignRanksStrategically = (victimRoleKey) => {
  const { targetMinPlausible, targetMaxPlausible } = MURDER_CONFIG.suspectRules;

  // Bridge always rank 1 (Captain)
  gameState.case.roleTraits['bridge'].shipRank = 1;

  // Victim gets rank (1 if bridge, otherwise random 2-8)
  const victimRank = (victimRoleKey === 'bridge')
    ? 1
    : Math.floor(Math.random() * 7) + 2; // 2-8
  gameState.case.roleTraits[victimRoleKey].shipRank = victimRank;

  // Count ideology-based plausible suspects
  const ideologyCount = countIdeologyPlausibleSuspects(victimRoleKey);

  // Target 4-6 total plausible suspects
  const targetPlausible = Math.floor(Math.random() *
    (targetMaxPlausible - targetMinPlausible + 1)) + targetMinPlausible;
  const needMoreSuspects = Math.max(0, targetPlausible - ideologyCount);

  // Get roles without ideology motives (candidates for promotion motives)
  const victimTraits = gameState.case.roleTraits[victimRoleKey];
  const nonPlausible = roleKeys.filter(rk => {
    if (rk === victimRoleKey || rk === 'bridge') return false;
    const traits = gameState.case.roleTraits[rk];
    return computeIdeologyBaseScore(victimTraits, traits) === 0;
  });

  // Shuffle non-plausible suspects
  for (let i = nonPlausible.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [nonPlausible[i], nonPlausible[j]] = [nonPlausible[j], nonPlausible[i]];
  }

  // Assign adjacent ranks to first needMoreSuspects roles
  const adjacentRanks = [victimRank - 1, victimRank, victimRank + 1]
    .filter(r => r >= 1 && r <= 8);

  for (let i = 0; i < Math.min(needMoreSuspects, nonPlausible.length); i++) {
    const roleKey = nonPlausible[i];
    gameState.case.roleTraits[roleKey].shipRank =
      adjacentRanks[Math.floor(Math.random() * adjacentRanks.length)];
  }

  // Assign random ranks to remaining roles (not yet assigned)
  for (const roleKey of roleKeys) {
    if (!gameState.case.roleTraits[roleKey].shipRank) {
      gameState.case.roleTraits[roleKey].shipRank =
        Math.floor(Math.random() * 8) + 1; // 1-8
    }
  }
};

// ============================================================================
// End Trait-Based Motive System - Phase 2
// ============================================================================

// ============================================================================
// Trait-Based Motive System - Phase 3: Plausible Suspects & Killer Selection
// ============================================================================

/**
 * Compute plausible suspects based on union of ideology and promotion motives.
 * A suspect is plausible if they have EITHER ideology OR promotion motive.
 * @param {string} victimRoleKey - The victim role
 * @returns {Array<string>} - Array of plausible suspect roleKeys
 */
const computePlausibleSuspects = (victimRoleKey) => {
  const plausible = [];
  const victimTraits = gameState.case.roleTraits[victimRoleKey];

  for (const suspectRoleKey of roleKeys) {
    if (suspectRoleKey === victimRoleKey) continue;

    const suspectTraits = gameState.case.roleTraits[suspectRoleKey];
    const hasIdeology = computeIdeologyBaseScore(victimTraits, suspectTraits) > 0;
    const hasPromotion = computePromotionBaseScore(victimTraits, suspectTraits) > 0;

    if (hasIdeology || hasPromotion) {
      plausible.push(suspectRoleKey);
    }
  }

  return plausible;
};

/**
 * Select killer and canonical motive from plausible suspects.
 * Uses weighted random selection based on final scores (including victim bias).
 * @param {string} victimRoleKey - The victim role
 * @param {Array<string>} plausibleSuspects - Array of plausible suspect roleKeys
 * @returns {Object} - { killerRoleKey, motiveName }
 */
const selectKillerAndMotive = (victimRoleKey, plausibleSuspects) => {
  const victimTraits = gameState.case.roleTraits[victimRoleKey];
  const pairWeights = {};

  for (const suspectRoleKey of plausibleSuspects) {
    const suspectTraits = gameState.case.roleTraits[suspectRoleKey];

    // Compute final scores for both motives
    const ideoScore = computeFinalScore(victimTraits, suspectTraits, 'ideology');
    const promoScore = computeFinalScore(victimTraits, suspectTraits, 'promotion');

    // Add to pair weights if score > 0
    if (ideoScore > 0) {
      pairWeights[`${suspectRoleKey}::ideology`] = ideoScore;
    }
    if (promoScore > 0) {
      pairWeights[`${suspectRoleKey}::promotion`] = promoScore;
    }
  }

  // Store debug info
  gameState.case.murderDebug.killerMotiveScores = pairWeights;

  // Fallback if no valid pairs (shouldn't happen with proper config)
  if (Object.keys(pairWeights).length === 0) {
    console.warn('[Trait System] No valid killer/motive pairs, using fallback');
    const randomKiller = plausibleSuspects[Math.floor(Math.random() * plausibleSuspects.length)];
    return { killerRoleKey: randomKiller, motiveName: 'ideology' };
  }

  // Weighted random selection
  const chosenPair = weightedRandomPick(pairWeights);
  const [killerRoleKey, motiveName] = chosenPair.split('::');

  return { killerRoleKey, motiveName };
};

// ============================================================================
// End Trait-Based Motive System - Phase 3
// ============================================================================

// ============================================================================
// Trait-Based Motive System - Phase 4: Weapon Evidence Assignment
// ============================================================================

/**
 * Assign weapon evidence using constraint-based elimination.
 * - Killer gets correct weapon
 * - 1-2 plausible suspects get wrong weapon (eliminated by weapon evidence)
 * - Remaining plausible suspects get correct weapon (still suspicious)
 * - Non-plausible suspects get random weapons
 * @param {string} victimRoleKey - The victim role
 * @param {string} killerRoleKey - The killer role
 * @param {Array<string>} plausibleSuspects - Array of plausible suspect roleKeys
 */
const assignWeaponEvidence = (victimRoleKey, killerRoleKey, plausibleSuspects) => {
  const weaponCategory = gameState.case.victim.methodCategory; // Already set from victim generation

  // Killer gets correct weapon
  gameState.case.weaponEvidence[killerRoleKey] = weaponCategory;

  // Pick 1-2 plausible suspects to eliminate via wrong weapon
  const otherPlausible = plausibleSuspects.filter(rk => rk !== killerRoleKey);
  const eliminateCount = Math.min(
    Math.floor(Math.random() * 2) + 1, // 1-2
    otherPlausible.length
  );

  // Shuffle and pick suspects to eliminate
  const shuffled = [...otherPlausible];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const eliminateByWeapon = shuffled.slice(0, eliminateCount);

  // Assign wrong weapons to eliminated suspects
  const allCategories = WEAPON_CATEGORIES.map(c => c.key);
  const wrongWeapons = allCategories.filter(c => c !== weaponCategory);

  for (const roleKey of eliminateByWeapon) {
    gameState.case.weaponEvidence[roleKey] =
      wrongWeapons[Math.floor(Math.random() * wrongWeapons.length)];
  }

  // Remaining plausible suspects get correct weapon (still suspicious)
  const remainingPlausible = otherPlausible.filter(rk => !eliminateByWeapon.includes(rk));
  for (const roleKey of remainingPlausible) {
    gameState.case.weaponEvidence[roleKey] = weaponCategory;
  }

  // Non-plausible suspects get random weapons (doesn't matter, already ruled out)
  for (const roleKey of roleKeys) {
    if (roleKey === victimRoleKey) continue; // Skip victim
    if (!gameState.case.weaponEvidence[roleKey]) {
      // Not yet assigned, must be non-plausible suspect
      gameState.case.weaponEvidence[roleKey] =
        allCategories[Math.floor(Math.random() * allCategories.length)];
    }
  }

  // Now populate lockers with assigned weapons
  gameState.props.forEach((prop) => {
    if (prop.type !== 'locker' || !prop.roomId) return;

    const category = gameState.case.weaponEvidence[prop.roomId];
    if (!category) return;

    // Find weapon category object
    const weaponCategoryObj = WEAPON_CATEGORIES.find(c => c.key === category);
    if (!weaponCategoryObj) return;

    prop.contents = prop.contents || [];
    prop.contents = prop.contents.filter((item) => item.type !== 'weapon_category');
    prop.contents.push({
      id: `weapon_${prop.roomId}`,
      type: 'weapon_category',
      label: weaponCategoryObj.lockerLabel || weaponCategoryObj.label,
      category: weaponCategoryObj.key,
      persistent: false
    });
    prop.promptText = 'CLICK TO SEARCH';
    prop.isEmpty = false;
  });
};

// ============================================================================
// End Trait-Based Motive System - Phase 4
// ============================================================================

// ============================================================================
// Trait-Based Motive System - Phase 5: Trait Clue Generation
// ============================================================================

/**
 * Generate trait-based clues for a role.
 * Returns array of clue text strings based on ideology and rank.
 * @param {string} roleKey - The role to generate clues for
 * @returns {Array<string>} - Array of clue text strings
 */
const generateTraitClues = (roleKey) => {
  const traits = gameState.case.roleTraits[roleKey];
  const clues = [];

  // 1-2 ideology clues
  const ideology = traits.politicalIdeology;
  const ideoTemplates = MURDER_CONFIG.traits.politicalIdeology.clueTemplates[ideology];

  if (ideoTemplates && ideoTemplates.length > 0) {
    // Shuffle ideology templates
    const shuffledIdeo = [...ideoTemplates];
    for (let i = shuffledIdeo.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledIdeo[i], shuffledIdeo[j]] = [shuffledIdeo[j], shuffledIdeo[i]];
    }

    // Pick 1-2 clues
    const ideoCount = Math.floor(Math.random() * 2) + 1; // 1-2
    clues.push(...shuffledIdeo.slice(0, ideoCount));
  }

  // 0-1 rank clues (50% chance) - includes actual rank number
  if (Math.random() < 0.5) {
    const rank = traits.shipRank;
    const rankClueTemplates = [
      `Report titled "For Rank ${rank} Eyes Only".`,
      `Directive addressed to all Rank ${rank} personnel.`,
      `Notice for Rank ${rank} crew regarding promotions.`,
      `Authorization form requiring Rank ${rank} clearance.`,
      `Performance review for Rank ${rank} officers.`,
      `Memo: "All Rank ${rank} staff report to bridge."`
    ];
    const rankClue = rankClueTemplates[Math.floor(Math.random() * rankClueTemplates.length)];
    clues.push(rankClue);
  }

  return clues;
};

/**
 * Populate all suspect terminals with trait-based clues.
 * Generates clues for ALL non-victim roles (creates red herrings naturally).
 */
const populateTraitClues = () => {
  const victimRoleKey = gameState.case.victim?.roleKey;

  for (const roleKey of roleKeys) {
    if (roleKey === victimRoleKey) continue; // Skip victim

    // Find computer in this role's room
    const computer = gameState.props.find((prop) =>
      prop.roomId === roleKey && prop.type === 'computer'
    );

    if (!computer) continue;

    // Generate trait clues for this role
    const traitClues = generateTraitClues(roleKey);

    // Clear old motive evidence
    computer.contents = computer.contents || [];
    computer.contents = computer.contents.filter((item) =>
      item.type !== EVIDENCE_TYPES.MOTIVE &&
      item.type !== EVIDENCE_TYPES.INCRIMINATING &&
      item.type !== EVIDENCE_TYPES.CLEAN_ALIBI
    );

    // Add new trait-based motive evidence
    if (traitClues.length > 0) {
      computer.contents.push({
        id: `motive_${roleKey}`,
        type: EVIDENCE_TYPES.MOTIVE,
        label: `Personal Files`,
        clues: traitClues, // Array of clue text strings
        traitData: {
          ideology: gameState.case.roleTraits[roleKey].politicalIdeology,
          rank: gameState.case.roleTraits[roleKey].shipRank
        },
        persistent: true
      });
    }

    computer.promptText = 'CLICK TO SEARCH';
    computer.isEmpty = false;
  }
};

// ============================================================================
// End Trait-Based Motive System - Phase 5
// ============================================================================

const randomRoleKey = () => roleKeys[Math.floor(Math.random() * roleKeys.length)];

const chooseVictimRole = () => randomRoleKey();

const chooseKillerRole = (victimRole) => {
  const pool = roleKeys.filter((role) => role !== victimRole);
  return pool[Math.floor(Math.random() * pool.length)];
};

const randomTimeWindow = () => {
  const startHour = Math.floor(Math.random() * 9); // 0-8 inclusive
  const endHour = startHour + 16;
  const format = (hour) => `${hour.toString().padStart(2, '0')}00`;
  return `${format(startHour)}-${format(endHour)}`;
};

const randomRoom = () => gameState.map.rooms[Math.floor(Math.random() * gameState.map.rooms.length)];

const findRoomContainingPoint = (x, y) => {
  return gameState.map.rooms.find((room) => (
    x >= room.x && x < room.x + room.width && y >= room.y && y < room.y + room.height
  ));
};

const randomCellInsideRoom = (room) => {
  const minCell = worldPointToCell({ x: room.x, y: room.y });
  const maxCell = worldPointToCell({ x: room.x + room.width, y: room.y + room.height });
  const cellX = Math.floor(Math.random() * (maxCell.x - minCell.x - 1)) + minCell.x + 1;
  const cellY = Math.floor(Math.random() * (maxCell.y - minCell.y - 1)) + minCell.y + 1;
  return { cellX, cellY };
};

const spawnBody = (victimRole) => {
  const room = randomRoom();
  const { cellX, cellY } = randomCellInsideRoom(room);
  const { x, y } = cellToWorldCenter(cellX, cellY);
  Object.assign(gameState.body, { cellX, cellY, x, y, collectedSample: false });
};

const spawnScanner = () => {
  const medbay = gameState.map.rooms.find((room) => room.id === 'medbay');
  if (!medbay) return;
  const cell = worldPointToCell({ x: medbay.x + medbay.width / 2, y: medbay.y + medbay.height / 2 });
  const { x, y } = cellToWorldCenter(cell.x, cell.y);
  Object.assign(gameState.scanner, { cellX: cell.x, cellY: cell.y, x, y, promptActive: false });
};

export const applyCaseObstacles = () => {
  const cellX = gameState.scanner.cellX;
  const cellY = gameState.scanner.cellY;
  if (cellX != null && cellY != null) {
    markCell(cellX, cellY, WORLD_SOLID);
  }
  const stationX = gameState.testingStation.cellX;
  const stationY = gameState.testingStation.cellY;
  if (stationX != null && stationY != null) {
    markCell(stationX, stationY, WORLD_SOLID);
  }
  const bioDataX = gameState.bioDataTerminal.cellX;
  const bioDataY = gameState.bioDataTerminal.cellY;
  if (bioDataX != null && bioDataY != null) {
    markCell(bioDataX, bioDataY, WORLD_SOLID);
  }
  gameState.doorTerminals.forEach((terminal) => {
    if (terminal.cellX != null && terminal.cellY != null) {
      markCell(terminal.cellX, terminal.cellY, WORLD_SOLID);
    }
  });
  gameState.props.forEach((prop) => {
    if (prop.cellX == null) return;
    markCell(prop.cellX, prop.cellY, WORLD_SOLID);
  });
};

const seedVictim = () => {
  const roleKey = chooseVictimRole();
  const role = gameState.config.roles[roleKey];
  const entry = gameState.journal.byId[roleKey];
  const method = WEAPON_CATEGORIES[Math.floor(Math.random() * WEAPON_CATEGORIES.length)];
  const victimName = entry?.personName ?? role.names[0] ?? role.name;
  const timeWindow = randomTimeWindow();
  gameState.case.victim = {
    roleKey,
    roleName: role.name,
    methodCategory: method.key,
    methodName: method.label
  };
  markVictimRole(roleKey);
  gameState.case.methodCategory = method.label;
  gameState.case.murderWeaponCategory = method.key;
  gameState.case.victimName = '???';
  gameState.case.victimOccupation = '???';
  gameState.case.timeWindow = '???';
  gameState.case.pending = Object.seal({
    victimName,
    victimOccupation: role.name,
    methodCategory: method.label,
    timeWindow
  });
  return roleKey;
};

const seedKiller = (victimRole) => {
  const killerRole = chooseKillerRole(victimRole);
  markKillerRole(killerRole);
  gameState.case.killer = Object.seal({
    roleKey: killerRole
  });
  return killerRole;
};

const buildSuspectPools = (victimRole, killerRole) => {
  const pool = roleKeys.filter((role) => role !== victimRole && role !== killerRole);
  const innocents = [];
  while (innocents.length < 1 && pool.length) {
    const index = Math.floor(Math.random() * pool.length);
    const role = pool.splice(index, 1)[0];
    if (role) innocents.push(role);
  }

  // Select red herring (will have weapon + motive but wrong timing in door log)
  // Red herring cannot be the innocent with evidence
  let redHerring = null;
  if (pool.length > 0) {
    const redHerringIndex = Math.floor(Math.random() * pool.length);
    redHerring = pool.splice(redHerringIndex, 1)[0];
    gameState.case.redHerringRole = redHerring;
  }

  const motiveCandidates = [killerRole];

  // Add red herring to motive candidates if selected
  if (redHerring) motiveCandidates.push(redHerring);

  // Fill remaining motive candidates (up to 3 total)
  while (motiveCandidates.length < 3 && pool.length) {
    const index = Math.floor(Math.random() * pool.length);
    const role = pool.splice(index, 1)[0];
    if (role) motiveCandidates.push(role);
  }

  const remaining = [...pool];
  gameState.case.suspects = motiveCandidates;
  return { innocents, motiveCandidates, remainingInnocents: remaining, redHerring };
};

const randomWeaponCategory = (excludeKey = null) => {
  const pool = WEAPON_CATEGORIES.filter((cat) => cat.key !== excludeKey);
  if (!pool.length) return WEAPON_CATEGORIES[0];
  return pool[Math.floor(Math.random() * pool.length)];
};

const assignLockerWeaponCategories = (victimRole, killerRole, motiveCandidates, nonMotiveRoles, redHerring) => {
  const assignments = new Map();
  const murderCategory = WEAPON_CATEGORIES.find((cat) => cat.key === gameState.case.murderWeaponCategory) || randomWeaponCategory();

  // Assign murder weapon to killer
  assignments.set(killerRole, murderCategory);

  // Assign murder weapon to red herring (creates ambiguity)
  if (redHerring) {
    assignments.set(redHerring, murderCategory);
  }

  // No longer assign murder weapon to random non-motive roles
  // (This ensures only killer and red herring have the murder weapon)

  motiveCandidates.forEach((roleId) => {
    if (roleId === killerRole || roleId === redHerring) return;
    assignments.set(roleId, assignments.get(roleId) || randomWeaponCategory(murderCategory.key));
  });
  roleKeys.forEach((roleId) => {
    if (roleId === victimRole) {
      if (!assignments.has(roleId)) assignments.set(roleId, randomWeaponCategory());
      return;
    }
    if (!assignments.has(roleId)) assignments.set(roleId, randomWeaponCategory());
  });
  gameState.props.forEach((prop) => {
    if (prop.type !== 'locker' || !prop.roomId) return;
    const category = assignments.get(prop.roomId);
    if (!category) return;
    prop.contents = prop.contents || [];
    prop.contents = prop.contents.filter((item) => item.type !== 'weapon_category');
    prop.contents.push({
      id: `weapon_${prop.roomId}`,
      type: 'weapon_category',
      label: category.lockerLabel || category.label,
      category: category.key,
      persistent: false
    });
    prop.promptText = 'CLICK TO SEARCH';
    prop.isEmpty = false;
  });
};

const populateSuspectTerminals = (suspects, killerRole, motiveSuspects, innocenceSuspects) => {
  suspects.forEach((roleId) => {
    const computer = gameState.props.find((prop) => prop.roomId === roleId && prop.type === 'computer');
    if (!computer) return;
    computer.contents = computer.contents || [];
    computer.contents = computer.contents.filter((item) => item.type !== EVIDENCE_TYPES.INCRIMINATING && item.type !== EVIDENCE_TYPES.CLEAN_ALIBI);
    if (motiveSuspects.includes(roleId)) {
      computer.contents.push({
        id: `computer_motive_${roleId}`,
        type: EVIDENCE_TYPES.MOTIVE,
        label: `Possible Motive: ${gameState.config.roles[roleId].name}`,
        roleId,
        persistent: true
      });
    }
    if (innocenceSuspects.includes(roleId)) {
      computer.contents.push({
        id: `computer_innocence_${roleId}`,
        type: EVIDENCE_TYPES.INNOCENCE,
        label: `Terminal Log: ${gameState.config.roles[roleId].name} accounted for`,
        roleId,
        persistent: true
      });
      markInnocenceEvidence(roleId);
    }
    computer.promptText = 'CLICK TO SEARCH';
    computer.isEmpty = false;
  });
};

const addInnocenceEvidenceToVictimComputer = (victimRole, innocents) => {
  const computer = gameState.props.find((prop) => prop.roomId === victimRole && prop.type === 'computer');
  if (!computer) return;

  computer.contents = computer.contents || [];
  computer.contents = computer.contents.filter((item) => item.type !== EVIDENCE_TYPES.INNOCENCE);
  innocents.forEach((roleId) => {
    const roleName = gameState.config.roles[roleId].name;
    computer.contents.push({
      id: `innocence_${victimRole}_${roleId}`,
      type: EVIDENCE_TYPES.INNOCENCE,
      label: `Terminal Log: ${roleName} accounted for`,
      roleId,
      persistent: true
    });
    markInnocenceEvidence(roleId);
  });
  computer.promptText = 'CLICK TO REVIEW';
  computer.isEmpty = false;
};

export const initializeCase = () => {
  // NEW: Assign political ideologies to all roles
  assignIdeologies();

  // NEW: Select victim based on ideology-driven murderability
  const victimRoleKey = selectVictimByIdeology();

  // NEW: Strategically assign ship ranks to ensure adequate suspect pool
  assignRanksStrategically(victimRoleKey);

  // Set up victim object (keeping existing weapon selection logic)
  const victimRole = gameState.config.roles[victimRoleKey];
  const victimEntry = gameState.journal.byId[victimRoleKey];
  const victimMethod = WEAPON_CATEGORIES[Math.floor(Math.random() * WEAPON_CATEGORIES.length)];
  const victimName = victimEntry?.personName ?? victimRole.names[0] ?? victimRole.name;
  const timeWindow = randomTimeWindow();

  gameState.case.victim = {
    roleKey: victimRoleKey,
    roleName: victimRole.name,
    methodCategory: victimMethod.key,
    methodName: victimMethod.label
  };

  markVictimRole(victimRoleKey);
  gameState.case.methodCategory = victimMethod.label;
  gameState.case.murderWeaponCategory = victimMethod.key;
  gameState.case.victimName = '???';
  gameState.case.victimOccupation = '???';
  gameState.case.timeWindow = '???';
  gameState.case.pending = Object.seal({
    victimName,
    victimOccupation: victimRole.name,
    methodCategory: victimMethod.label,
    timeWindow
  });

  // NEW: Compute plausible suspects based on traits
  const plausibleSuspects = computePlausibleSuspects(victimRoleKey);
  gameState.case.plausibleSuspects = plausibleSuspects;

  // NEW: Select killer and canonical motive from plausible suspects
  const { killerRoleKey, motiveName } = selectKillerAndMotive(victimRoleKey, plausibleSuspects);
  gameState.case.canonicalMotive = motiveName;

  // Set killer in state
  markKillerRole(killerRoleKey);
  gameState.case.killer = Object.seal({
    roleKey: killerRoleKey
  });

  // NEW: Assign weapon evidence using constraint-based elimination
  assignWeaponEvidence(victimRoleKey, killerRoleKey, plausibleSuspects);

  // NEW: Populate computers with trait-based clues for ALL roles
  populateTraitClues();

  spawnBody(victimRoleKey);
  spawnScanner();
  initializeTestingStation();
  initializeBioDataTerminal();
  initializeUpgradeTerminal();
  gameState.case.weaponTestResults = generateWeaponTestResults();
  seedComputerLocks();

  // Initialize door terminals
  gameState.doorTerminals = initializeDoorTerminals();

  // Generate room traits and select murder room
  gameState.case.roomTraits = generateRoomTraits();
  const bodyRoom = findRoomContainingPoint(gameState.body.x, gameState.body.y);
  const bodyRoomId = bodyRoom ? bodyRoom.id : null;
  gameState.case.murderRoomId = selectMurderRoom(gameState.case.roomTraits, bodyRoomId);

  // Select murder cell within murder room
  const murderRoom = gameState.map.rooms.find((room) => room.id === gameState.case.murderRoomId);
  if (murderRoom) {
    const { cellX, cellY } = randomCellInsideRoom(murderRoom);
    gameState.case.murderCellX = cellX;
    gameState.case.murderCellY = cellY;
  }

  // Generate NPC biodata (victim matches murder room)
  gameState.case.npcBioData = generateNPCBioData(
    gameState.case.murderRoomId,
    victimRoleKey,
    gameState.case.roomTraits
  );

  // Generate time of death
  gameState.case.timeOfDeath = generateTimeOfDeath();

  // Calculate time windows (needed for door log generation only)
  // Note: These are NOT stored in gameState until player scans samples
  const window12h = calculateTimeWindow12h(gameState.case.timeOfDeath);
  const window4h = calculateTimeWindow4h(gameState.case.timeOfDeath);

  // NEW: Generate door logs using constraint-based elimination
  gameState.case.doorLogs = generateAllDoorLogs(
    gameState.case.murderRoomId,
    killerRoleKey,
    plausibleSuspects,
    gameState.case.weaponEvidence,
    gameState.case.victim.methodCategory,
    gameState.case.timeOfDeath,
    window12h,
    window4h
  );
};
