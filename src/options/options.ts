import { defaultSettings, getSettings, saveSettings, thresholdsFor } from '../shared/settings';
const split = (value: string) => value.split('\n').map((item) => item.trim()).filter(Boolean);
async function init(): Promise<void> { const settings = await getSettings(); const threshold = thresholdsFor(settings); const get = <T extends HTMLElement>(id: string) => document.querySelector<T>(`#${id}`)!;
  get<HTMLSelectElement>('sensitivity').value = settings.sensitivity; get<HTMLTextAreaElement>('blocklist').value = settings.customBlocklist.join('\n'); get<HTMLTextAreaElement>('allowlist').value = settings.allowlist.join('\n');
  for (const id of ['floodMessages', 'duplicateCount', 'capsRatio'] as const) get<HTMLInputElement>(id).value = String(settings.advancedThresholds[id] ?? threshold[id]);
  get<HTMLButtonElement>('save').onclick = async () => { await saveSettings({ sensitivity: get<HTMLSelectElement>('sensitivity').value as typeof settings.sensitivity, customBlocklist: split(get<HTMLTextAreaElement>('blocklist').value), allowlist: split(get<HTMLTextAreaElement>('allowlist').value), advancedThresholds: { floodMessages: Number(get<HTMLInputElement>('floodMessages').value), duplicateCount: Number(get<HTMLInputElement>('duplicateCount').value), capsRatio: Number(get<HTMLInputElement>('capsRatio').value) } }); get('status').textContent = 'Saved.'; };
  get<HTMLButtonElement>('reset').onclick = async () => { await chrome.storage.sync.set(defaultSettings); location.reload(); };
} void init();
