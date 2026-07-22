import { defaultSettings, getSettings } from '../shared/settings';

const CONTENT_SCRIPT_ID = 'winnow-content';

const CONTENT_SETTINGS_KEYS = [
  'enabledOrigins',
  'filters',
  'sensitivity',
  'advancedThresholds',
  'customBlocklist',
  'allowlist'
] as const;

function matchesForOrigins(origins: string[]): string[] {
  return origins.map((origin) => `${origin}/*`);
}

function contentSettingsChanged(changes: Record<string, chrome.storage.StorageChange>): boolean {
  return CONTENT_SETTINGS_KEYS.some((key) => key in changes);
}

async function enabledOrigins(): Promise<string[]> {
  const settings = await getSettings();
  return Object.entries(settings.enabledOrigins)
    .filter(([, enabled]) => enabled)
    .map(([origin]) => origin);
}

async function syncContentScripts(): Promise<void> {
  const origins = await enabledOrigins();
  const matches = matchesForOrigins(origins);

  try {
    await chrome.scripting.unregisterContentScripts({ ids: [CONTENT_SCRIPT_ID] });
  } catch {
    // Script may not be registered yet.
  }

  if (!matches.length) return;

  await chrome.scripting.registerContentScripts([
    {
      id: CONTENT_SCRIPT_ID,
      js: ['content/content.js'],
      matches,
      allFrames: true,
      runAt: 'document_idle',
      persistAcrossSessions: true
    }
  ]);
}

async function injectIntoOrigins(origins: string[]): Promise<void> {
  for (const origin of origins) {
    const tabs = await chrome.tabs.query({ url: `${origin}/*` });
    for (const tab of tabs) {
      if (!tab.id) continue;
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id, allFrames: true },
          files: ['content/content.js']
        });
      } catch {
        // Tab may reject injection (chrome://, discarded, etc.).
      }
    }
  }
}

async function notifySettingsChanged(): Promise<void> {
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    if (!tab.id) continue;
    // Omit frameId so every frame with a content-script listener receives the message
    // (needed for nested live-chat iframes such as YouTube Live).
    chrome.tabs.sendMessage(tab.id, { type: 'settings-changed' }).catch(() => undefined);
  }
}

async function bootstrapContentScripts(): Promise<void> {
  await syncContentScripts();
  const origins = await enabledOrigins();
  if (origins.length) await injectIntoOrigins(origins);
}

chrome.runtime.onInstalled.addListener(async () => {
  const existing = await chrome.storage.sync.get();
  if (Object.keys(existing).length === 0) await chrome.storage.sync.set(defaultSettings);
  await bootstrapContentScripts();
});

chrome.runtime.onStartup.addListener(() => {
  void bootstrapContentScripts();
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'sync') return;

  void (async () => {
    if (changes.enabledOrigins) {
      const previous = (changes.enabledOrigins.oldValue ?? {}) as Record<string, boolean>;
      const next = (changes.enabledOrigins.newValue ?? {}) as Record<string, boolean>;
      const newlyEnabled = Object.keys(next).filter((origin) => next[origin] && !previous[origin]);

      await syncContentScripts();
      if (newlyEnabled.length) await injectIntoOrigins(newlyEnabled);
    }

    // Ignore lifetimeFilteredCount and other non-filter keys so counter updates
    // do not tear down observers mid-stream.
    if (contentSettingsChanged(changes)) await notifySettingsChanged();
  })();
});

chrome.runtime.onMessage.addListener((message: { type?: string; delta?: number }) => {
  if (message.type !== 'filtered' || !message.delta) return;
  void (async () => {
    const current = await chrome.storage.sync.get({ lifetimeFilteredCount: 0 });
    await chrome.storage.sync.set({
      lifetimeFilteredCount: (current.lifetimeFilteredCount as number) + message.delta!
    });
    const session = await chrome.storage.session.get({ filteredCount: 0 });
    await chrome.storage.session.set({
      filteredCount: (session.filteredCount as number) + message.delta!
    });
  })();
});

void syncContentScripts();
