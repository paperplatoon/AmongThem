import { gameState } from './gameState.js';
import { TEMPERATURE, HUMIDITY } from './roomTraitsState.js';

const randomTemperature = () => {
  return Math.random() < 0.5 ? TEMPERATURE.HIGH : TEMPERATURE.LOW;
};

const randomHumidity = () => {
  return Math.random() < 0.5 ? HUMIDITY.HIGH : HUMIDITY.LOW;
};

export const generateNPCBioData = (murderRoomId, victimRoleId, roomTraits) => {
  const bioData = {};

  // Get murder room traits for victim
  const murderRoomTraits = roomTraits[murderRoomId];
  if (!murderRoomTraits) {
    console.warn('[bioDataState] Murder room traits not found:', murderRoomId);
    return bioData;
  }

  // Get all role IDs from journal entries
  const allRoleIds = gameState.journal.entries.map((entry) => entry.id);

  allRoleIds.forEach((roleId) => {
    if (roleId === victimRoleId) {
      // Victim's biodata matches murder room
      bioData[roleId] = {
        temperature: murderRoomTraits.temperature,
        humidity: murderRoomTraits.humidity
      };
    } else {
      // Other NPCs get random biodata
      bioData[roleId] = {
        temperature: randomTemperature(),
        humidity: randomHumidity()
      };
    }
  });

  return bioData;
};
