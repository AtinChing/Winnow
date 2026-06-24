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
