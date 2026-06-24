import { defaultSettings } from '../shared/settings';

chrome.runtime.onInstalled.addListener(async () => {
  const existing = await chrome.storage.sync.get();
  if (Object.keys(existing).length === 0) await chrome.storage.sync.set(defaultSettings);
});

chrome.storage.onChanged.addListener(() => {
  void chrome.tabs.query({}).then((tabs) => {
    for (const tab of tabs) if (tab.id) chrome.tabs.sendMessage(tab.id, { type: 'settings-changed' }).catch(() => undefined);
  });
});

chrome.runtime.onMessage.addListener((message: { type?: string; delta?: number }) => {
  if (message.type !== 'filtered' || !message.delta) return;
  void (async () => {
    const current = await chrome.storage.sync.get({ lifetimeFilteredCount: 0 });
    await chrome.storage.sync.set({ lifetimeFilteredCount: current.lifetimeFilteredCount + message.delta });
    const session = await chrome.storage.session.get({ filteredCount: 0 });
    await chrome.storage.session.set({ filteredCount: session.filteredCount + message.delta });
  })();
});
