import { config } from './config.js';

const buildJournalTabs = () => (
  Object.keys(config.roles).map((key) => ({
    id: key,
    label: config.roles[key].name
  }))
);

const journalTabs = buildJournalTabs();

export const uiState = Object.seal({
  showMinimap: false,
  showInventory: false,
  showJournal: false,
  openContainerId: null,
  journal: Object.seal({
    tabs: journalTabs,
    activeTab: journalTabs[0]?.id ?? null
  })
});
