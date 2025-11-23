import { gameState } from './gameState.js';

export const TEMPERATURE = Object.freeze({
  HIGH: 'high',
  LOW: 'low'
});

export const HUMIDITY = Object.freeze({
  HIGH: 'high',
  LOW: 'low'
});

const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const generateRoomTraits = () => {
  const rooms = gameState.map.rooms || [];
  const roomIds = rooms.map((room) => room.id);

  // Create all 4 combinations, each appearing twice
  const combinations = [
    { temperature: TEMPERATURE.HIGH, humidity: HUMIDITY.HIGH },
    { temperature: TEMPERATURE.HIGH, humidity: HUMIDITY.HIGH },
    { temperature: TEMPERATURE.HIGH, humidity: HUMIDITY.LOW },
    { temperature: TEMPERATURE.HIGH, humidity: HUMIDITY.LOW },
    { temperature: TEMPERATURE.LOW, humidity: HUMIDITY.HIGH },
    { temperature: TEMPERATURE.LOW, humidity: HUMIDITY.HIGH },
    { temperature: TEMPERATURE.LOW, humidity: HUMIDITY.LOW },
    { temperature: TEMPERATURE.LOW, humidity: HUMIDITY.LOW }
  ];

  // Shuffle combinations for random assignment
  const shuffledCombinations = shuffleArray(combinations);

  // Map room IDs to trait combinations
  const roomTraits = {};
  roomIds.forEach((roomId, index) => {
    roomTraits[roomId] = shuffledCombinations[index];
  });

  return roomTraits;
};

export const selectMurderRoom = (roomTraits, bodyRoomId) => {
  const availableRooms = Object.keys(roomTraits).filter((roomId) => roomId !== bodyRoomId);
  const randomIndex = Math.floor(Math.random() * availableRooms.length);
  return availableRooms[randomIndex];
};
