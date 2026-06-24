import { getSettings, saveSettings, type Settings } from '../shared/settings';
const filterLabels: Record<keyof Settings['filters'], string> = { flood: 'Message flood', duplicate: 'Repeated messages', links: 'Link spam', emotesCaps: 'Emotes and caps', wordlist: 'Blocklist', ml: 'ML classifier' };
async function init(): Promise<void> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true }); if (!tab.url) return;
  const origin = new URL(tab.url).origin; let settings = await getSettings();
  const enabled = document.querySelector<HTMLInputElement>('#enabled')!; const sensitivity = document.querySelector<HTMLSelectElement>('#sensitivity')!; const root = document.querySelector('#filters')!;
  enabled.checked = settings.enabledOrigins[origin] === true; sensitivity.value = settings.sensitivity;
  const persist = async () => { await saveSettings(settings); };
  enabled.onchange = () => { settings = { ...settings, enabledOrigins: { ...settings.enabledOrigins, [origin]: enabled.checked } }; void persist(); };
  sensitivity.onchange = () => { settings = { ...settings, sensitivity: sensitivity.value as Settings['sensitivity'] }; void persist(); };
  for (const [id, label] of Object.entries(filterLabels) as Array<[keyof Settings['filters'], string]>) { const item = document.createElement('label'); const input = document.createElement('input'); input.type = 'checkbox'; input.checked = settings.filters[id]; input.onchange = () => { settings = { ...settings, filters: { ...settings.filters, [id]: input.checked } }; void persist(); }; item.append(input, label); root.append(item); }
  const session = await chrome.storage.session.get({ filteredCount: 0 }); document.querySelector('#count')!.textContent = `${session.filteredCount} messages filtered this session`;
}
void init();
