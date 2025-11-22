export const ITEM_TYPES = Object.freeze({
  ENERGY_BAR: 'energy_bar',
  OXYGEN_CANISTER: 'oxygen_canister',
  BANDAGE: 'bandage',
  CREDITS: 'credits',
  DISABLE_POWER: 'disable_power',
  REMOTE_LOCKDOWN: 'remote_lockdown',
  EFFICIENT_HACK: 'efficient_hack'
});

export const ITEM_DEFINITIONS = Object.freeze({
  [ITEM_TYPES.ENERGY_BAR]: Object.freeze({
    label: 'Energy Bar',
    effect: { type: 'stamina', amount: 0.1 }
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
  [ITEM_TYPES.DISABLE_POWER]: Object.freeze({
    label: 'Disable Power',
    effect: { type: 'force_escape' }
  }),
  [ITEM_TYPES.REMOTE_LOCKDOWN]: Object.freeze({
    label: 'Remote Lockdown',
    effect: { type: 'lockdown' }
  }),
  [ITEM_TYPES.EFFICIENT_HACK]: Object.freeze({
    label: 'Efficient Hacking',
    effect: { type: 'efficient_hack' }
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
