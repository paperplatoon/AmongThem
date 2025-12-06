export const ITEM_TYPES = Object.freeze({
  ENERGY_BAR: 'energy_bar',
  OXYGEN_CANISTER: 'oxygen_canister',
  BANDAGE: 'bandage',
  CREDITS: 'credits',
  EFFICIENT_HACK: 'efficient_hack',
  FAST_LOCKPICK: 'fast_lockpick',
  SKELETON_KEY: 'skeleton_key',
  MASTER_VIRUS: 'master_virus',
  CROWBAR: 'crowbar',
  COMPUTER_VIRUS: 'computer_virus'
});

export const ITEM_DEFINITIONS = Object.freeze({
  [ITEM_TYPES.ENERGY_BAR]: Object.freeze({
    label: 'Energy Bar',
    effect: { type: 'stamina', amount: 0.2 }
  }),
  [ITEM_TYPES.BANDAGE]: Object.freeze({
    label: 'Bandage',
    effect: { type: 'health', amount: 25 }
  }),
  [ITEM_TYPES.OXYGEN_CANISTER]: Object.freeze({
    label: 'Oxygen Canister',
    effect: { type: 'oxygen', amount: 0.1 }
  }),
  [ITEM_TYPES.CREDITS]: Object.freeze({
    label: 'Credits',
    effect: null
  }),
  [ITEM_TYPES.EFFICIENT_HACK]: Object.freeze({
    label: 'Efficient Hacking',
    effect: { type: 'efficient_hack' }
  }),
  [ITEM_TYPES.FAST_LOCKPICK]: Object.freeze({
    label: 'Fast Lockpick',
    effect: { type: 'fast_lockpick' }
  }),
  [ITEM_TYPES.SKELETON_KEY]: Object.freeze({
    label: 'Skeleton Key',
    effect: { type: 'skeleton_key' }
  }),
  [ITEM_TYPES.MASTER_VIRUS]: Object.freeze({
    label: 'Master Virus',
    effect: { type: 'master_virus' }
  }),
  [ITEM_TYPES.CROWBAR]: Object.freeze({
    label: 'Crowbar',
    effect: null
  }),
  [ITEM_TYPES.COMPUTER_VIRUS]: Object.freeze({
    label: 'Computer Virus',
    effect: null
  })
});

const typePool = Object.keys(ITEM_DEFINITIONS);

const randomType = () => (
  typePool[Math.floor(Math.random() * typePool.length)]
);

export const createItemFromDefinition = (idPrefix, type = randomType()) => {
  const definition = ITEM_DEFINITIONS[type];
  if (!definition) return null;
  return {
    id: `${idPrefix}_${Math.random().toString(36).slice(2, 7)}`,
    type,
    label: definition.label,
    effect: definition.effect ? { ...definition.effect } : null
  };
};
