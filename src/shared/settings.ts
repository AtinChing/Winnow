export type Sensitivity = 'low' | 'medium' | 'high';

export interface Thresholds {
  floodMessages: number;
  floodWindowSeconds: number;
  duplicateCount: number;
  duplicateWindowSeconds: number;
  linkCount: number;
  linkRatio: number;
  capsRatio: number;
  capsMinLetters: number;
  repeatedCharacters: number;
  emoteTokens: number;
}

export interface Settings {
  enabledOrigins: Record<string, boolean>;
  filters: { flood: boolean; duplicate: boolean; links: boolean; emotesCaps: boolean; wordlist: boolean; ml: boolean };
  sensitivity: Sensitivity;
  advancedThresholds: Partial<Thresholds>;
  customBlocklist: string[];
  allowlist: string[];
  lifetimeFilteredCount: number;
}

const presets: Record<Sensitivity, Thresholds> = {
  low: { floodMessages: 8, floodWindowSeconds: 10, duplicateCount: 5, duplicateWindowSeconds: 30, linkCount: 3, linkRatio: 0.45, capsRatio: 0.85, capsMinLetters: 16, repeatedCharacters: 10, emoteTokens: 12 },
  medium: { floodMessages: 5, floodWindowSeconds: 10, duplicateCount: 3, duplicateWindowSeconds: 30, linkCount: 2, linkRatio: 0.35, capsRatio: 0.75, capsMinLetters: 12, repeatedCharacters: 8, emoteTokens: 8 },
  high: { floodMessages: 3, floodWindowSeconds: 10, duplicateCount: 2, duplicateWindowSeconds: 30, linkCount: 2, linkRatio: 0.25, capsRatio: 0.65, capsMinLetters: 10, repeatedCharacters: 6, emoteTokens: 6 }
};

export const defaultSettings: Settings = {
  enabledOrigins: {},
  filters: { flood: true, duplicate: true, links: true, emotesCaps: true, wordlist: true, ml: false },
  sensitivity: 'medium',
  advancedThresholds: {}, customBlocklist: [], allowlist: [], lifetimeFilteredCount: 0
};

export function thresholdsFor(settings: Settings): Thresholds {
  return { ...presets[settings.sensitivity], ...settings.advancedThresholds };
}

export async function getSettings(): Promise<Settings> {
  const stored = await chrome.storage.sync.get(defaultSettings);
  return { ...defaultSettings, ...stored, filters: { ...defaultSettings.filters, ...stored.filters } } as Settings;
}

export async function saveSettings(settings: Partial<Settings>): Promise<void> {
  await chrome.storage.sync.set(settings);
}
