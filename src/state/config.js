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
  inventorySlots: 8,
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
    sprintMultiplier: 1.8,
    drainIntervalSeconds: 0.1,
    drainPerInterval: 0.01,
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
    chaseSpeedFar: 365,
    chaseSlowDistanceCells: 6,
    lostSpeed: 220,
    sightRangeCells: 6,
    sightAngleDeg: 60,
    impactDamage: 50,
    postImpactPauseSeconds: 1,
    loseSightSeconds: 5,
    searchDurationSeconds: 30,
    escapeCheckIntervalSeconds: 1,
    escapeChancePerPctBelow90: 0.0001,
    escapeLockoutSeconds: 60,
    escapedTravelSpeed: 220,
    escapedRoamSpeed: 200,
    noticeDurationSeconds: 0.4,
    noticeJumpHeight: 14,
    chaseAccelSeconds: 1,
    noticeStepDistanceCells: 2,
    noticeStepDurationSeconds: 0.18,
    noticeHopDurationSeconds: 0.22,
    noticeFlashSpeed: 6,
    noticeFlashColors: Object.freeze(['#ff4f4f', '#ff9fb5']),
    loseSightDistanceCells: 30,
    chaseSightFractionOfScreen: 0.75,
    lostDirectionDurationSeconds: 10,
    pursueProjectionCells: 12,
    doorPoundPauseSeconds: 1
  }),
  taser: Object.freeze({
    cost: 300,
    cooldownSeconds: 5,
    stunSeconds: 10,
    arcLengthCells: 5,
    burstDurationSeconds: 0.6
  }),
  hacking: Object.freeze({
    passwordLength: 7,
    revealIntervalSeconds: 5,
    sortingIntervalSeconds: 5,
    autoCompleteDelaySeconds: 5
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

export const MURDER_CONFIG = Object.freeze({
  traits: {
    politicalIdeology: {
      values: ['communist', 'fascist', 'liberal', 'conservative'],

      // Slightly more extremists than centrists
      baseFrequency: {
        communist: 1.3,
        fascist: 1.2,
        liberal: 1.0,
        conservative: 1.0
      },

      // Victim ideology → Killer ideology → compatibility weight
      // Higher weight = more likely motive
      compatibility: {
        communist: {
          fascist: 60,
          conservative: 40
        },
        fascist: {
          communist: 50,
          liberal: 30
        },
        liberal: {
          conservative: 20,
          fascist: 15
        },
        conservative: {
          communist: 10,
          liberal: 10
        }
      },

      // Text clues found on computers for each ideology
      clueTemplates: {
        communist: [
          'Folder of scanned pamphlets about workers\' councils.',
          'PDF titled "The Necessity of Revolution".',
          'Essay draft criticizing private property as theft.',
          'Bookmarked articles about collective ownership.',
          'Saved manifesto on class struggle.',
          'Research notes on historical uprisings.',
          'Audio files of labor organizing speeches.',
          'Encrypted messages to off-world radical groups.'
        ],
        fascist: [
          'Saved speech praising "national rebirth" and "order".',
          'Bookmark to a blog discussing "strong leadership".',
          'Manifesto draft about "cleansing internal enemies".',
          'Collection of propaganda posters (authoritarian themes).',
          'Notes on hierarchical power structures.',
          'Archived broadcasts promoting "unity through strength".',
          'Personal journal entries about "weakness" and "discipline".',
          'Encrypted comms with extremist networks.'
        ],
        liberal: [
          'Ebook: "Defending the Liberal Order".',
          'Archive of opinion pieces on civil liberties.',
          'Podcast queue of centrist policy debates.',
          'Saved articles about democratic reforms.',
          'Debate notes on individual rights vs. collective good.',
          'Bookmarked human rights manifestos.',
          'Subscription to moderate political journals.',
          'Draft letter to ship council about fair governance.'
        ],
        conservative: [
          'Essay titled "The Case for Traditional Values".',
          'Bookmarks to op-eds about preserving heritage.',
          'Spreadsheet of donations to right-leaning think tanks.',
          'Saved articles critiquing rapid social change.',
          'Personal reflections on "stability" and "order".',
          'Collection of historical texts about continuity.',
          'Audio recordings of traditionalist philosophy.',
          'Notes on maintaining established hierarchies.'
        ]
      }
    },

    shipRank: {
      values: [1, 2, 3, 4, 5, 6, 7, 8],

      // Victim rank → Killer rank → compatibility weight
      // Adjacent ranks (±1) are promotion-compatible
      promotionCompatibility: {
        '1': { '1': 1, '2': 1 },
        '2': { '1': 1, '2': 1, '3': 1 },
        '3': { '2': 1, '3': 1, '4': 1 },
        '4': { '3': 1, '4': 1, '5': 1 },
        '5': { '4': 1, '5': 1, '6': 1 },
        '6': { '5': 1, '6': 1, '7': 1 },
        '7': { '6': 1, '7': 1, '8': 1 },
        '8': { '7': 1, '8': 1 }
      },

      // Promotion-related clue templates (rank-agnostic)
      clueTemplates: [
        'Draft complaint about unfair promotion decisions.',
        'Performance review file with heated comments.',
        'Email thread about upcoming officer evaluations.',
        'Saved articles about advancement opportunities.',
        'Personal journal: frustration with career stagnation.',
        'Notes comparing qualifications with other crew members.',
        'Spreadsheet tracking promotion timelines.',
        'Angry message drafts to superior officers.',
        'Research on ship hierarchy and rank requirements.',
        'Bookmarked regulations about succession protocols.'
      ]
    }
  },

  motives: {
    ideology: {
      globalWeight: 1.0,

      // Per-victim-ideology bias for ideology vs promotion motives
      // Extremists (communist/fascist) more likely killed for ideology
      // Centrists more balanced or lean promotion
      victimBias: {
        communist:    { ideology: 3.0, promotion: 1.0 },
        fascist:      { ideology: 3.0, promotion: 1.0 },
        liberal:      { ideology: 2.0, promotion: 2.0 },
        conservative: { ideology: 1.0, promotion: 3.0 }
      },

      driverTrait: 'politicalIdeology'
    },

    promotion: {
      globalWeight: 1.0,
      driverTrait: 'shipRank'
    }
  },

  suspectRules: {
    targetMinPlausible: 4,
    targetMaxPlausible: 6
  }
});
