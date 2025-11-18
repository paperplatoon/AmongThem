export const config = Object.freeze({
  canvasWidth: 960,
  canvasHeight: 640,
  worldWidth: 8064,
  worldHeight: 5472,
  walkSpeed: 160,
  ventSpeedModifier: 0.5,
  doorOpenRange: 90,
  playerRadius: 10,
  wallThickness: 18,
  doorThickness: 18,
  wallPadding: 12,
  roomPadding: 6,
  doorPadding: 24,
  doorAnimationSeconds: 0.45,
  doorAutoCloseDistance: 90,
  floorGridSpacing: 480,
  floorGridColor: 'rgba(35, 68, 128, 0.35)',
  doorLabelOffset: 180,
  cellSize: 32,
  gridWidth: Math.ceil(8064 / 32),
  gridHeight: Math.ceil(5472 / 32),
  itemPickupRange: 160,
  itemRadius: 24,
  corridorColor: '#0f1636',
  wallColor: '#4f7bd9',
  floorColor: '#071022',
  fastLaneFloorColor: '#2c0f0f',
  ventFloorColor: '#2c1038',
  playerColor: '#f4f9ff',
  doorClosedColor: '#4fc3f7',
  doorOpenColor: '#8effd6',
  blueprintGlow: '#103c80',
  stamina: Object.freeze({
    max: 100,
    sprintMultiplier: 3,
    drainIntervalSeconds: 0.1,
    drainPerInterval: 0.1
  }),
  oxygen: Object.freeze({
    max: 100,
    depletionSeconds: 30 * 60
  }),
  player: Object.freeze({
    healthMax: 100
  }),
  creditsColor: '#daa520',
  creditsMin: 5,
  creditsMax: 15,
  creditsChance: 1 / 3,
  creditsSymbol: '₡',
  currencyLabel: 'Credits',
  villain: Object.freeze({
    wanderSpeed: 150,
    chaseSpeed: 440,
    chaseSpeedFar: 260,
    chaseSlowDistanceCells: 6,
    lostSpeed: 220,
    sightRangeCells: 6,
    sightAngleDeg: 60,
    impactDamage: 50,
    postImpactPauseSeconds: 1,
    loseSightSeconds: 5,
    searchDurationSeconds: 5,
    escapeCheckIntervalSeconds: 1,
    escapeChancePerPctBelow90: 0.0001,
    escapeLockoutSeconds: 60,
    escapedTravelSpeed: 220,
    escapedRoamSpeed: 200,
    noticeDurationSeconds: 1.5,
    noticeJumpHeight: 6,
    chaseAccelSeconds: 1.5
  }),
  roles: Object.freeze({
    bridge: {
      name: 'Captain',
      names: ['Amelia Ortiz', 'Jonas Pike', 'Rani Malik'],
      methods: [
        { name: 'Baton', category: 'blunt' },
        { name: 'Sidearm', category: 'impact' }
      ]
    },
    medbay: {
      name: 'Medic',
      names: ['Dr. Lila Han', 'Dr. Miles Grant', 'Dr. Wei Song'],
      methods: [
        { name: 'Sedatives', category: 'poison' },
        { name: 'Scalpel', category: 'stab' }
      ]
    },
    kitchen: {
      name: 'Cook',
      names: ['Sera Quinn', 'Elliot Vance', 'Marta Cole'],
      methods: [
        { name: 'Knife', category: 'stab' },
        { name: 'Rat Poison', category: 'poison' }
      ]
    },
    engineering: {
      name: 'Engineer',
      names: ['Rex Nadir', 'Isabel Cho', 'Mateo Blake'],
      methods: [
        { name: 'Wrench', category: 'blunt' },
        { name: 'Life Support Override', category: 'oxygen_loss' }
      ]
    },
    hydroponics: {
      name: 'Farmer',
      names: ['Pilar Stone', 'Nadia Bloom', 'Harlan Tse'],
      methods: [
        { name: 'Fertilizer', category: 'poison' },
        { name: 'Shears', category: 'stab' }
      ]
    },
    maintenance: {
      name: 'Janitor',
      names: ['Omar Reed', 'Tess Morita', 'Alma Ridge'],
      methods: [
        { name: 'Hammer', category: 'blunt' },
        { name: 'Solvent', category: 'poison' }
      ]
    },
    ai_core: {
      name: 'AI Core',
      names: ['RA-3 Sentience', 'SARA Core', 'Sentinel Node'],
      methods: [
        { name: 'Life Support Override', category: 'oxygen_loss' },
        { name: 'Internal Defenses', category: 'impact' }
      ]
    },
    quarters: {
      name: 'Counselor',
      names: ['Mina Clarke', 'Gabriel Holt', 'Soren Ives'],
      methods: [
        { name: 'Defense Rifles', category: 'impact' },
        { name: 'Pillow Strangulation', category: 'oxygen_loss' }
      ]
    }
  })
});
