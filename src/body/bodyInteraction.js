import { gameState } from '../state/gameState.js';
import { addParticleBurst, addFloatingText } from '../state/visualEffects.js';
import { markVictimIdentified } from '../state/journalState.js';

export const collectBodySample = () => {
  const body = gameState.body;
  if (body.x == null || body.collectedSample) return;

  const victimRole = gameState.case.victim?.roleKey;
  if (!victimRole) return;

  // Add victim's keycard (functional + visual in journal)
  gameState.player.keycards.add(victimRole);

  // Mark victim as identified in journal (reveals name + green keycard square)
  const victimEntry = gameState.journal.byId[victimRole];
  if (victimEntry) {
    victimEntry.hasKeycard = true;
    victimEntry.knownName = true;
  }
  markVictimIdentified(victimRole);

  // Add body sample to inventory (for later scanning)
  const bodySample = {
    id: 'body_sample',
    type: 'evidence_body',
    label: 'Body Sample for Medbay Scanner',
    persistent: false
  };
  gameState.inventory.push(bodySample);

  // Mark body as searched
  body.collectedSample = true;

  // Visual effects at player position
  const playerX = gameState.player.x - gameState.camera.x;
  const playerY = gameState.player.y - gameState.camera.y;
  addParticleBurst(playerX, playerY, '#66bfff', 12);
  addFloatingText(playerX, playerY, 'Keycard acquired', '#66bfff');
};
