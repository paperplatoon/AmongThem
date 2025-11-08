export const ITEM_TYPES = Object.freeze({
  ENERGY_BAR: 'energy_bar',
  OXYGEN_CANISTER: 'oxygen_canister'
});

export const ITEM_DEFINITIONS = Object.freeze({
  [ITEM_TYPES.ENERGY_BAR]: Object.freeze({
    label: 'Energy Bar',
    effect: { type: 'stamina', amount: 0.25 }
  }),
  [ITEM_TYPES.OXYGEN_CANISTER]: Object.freeze({
    label: 'Oxygen Canister',
    effect: { type: 'oxygen', amount: 0.1 }
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
    effect: { ...definition.effect }
  };
};
