import type { ChatAdapter } from './types';
import { extractText } from './types';
let cached: Element | null = null; let candidate = new Map<Element, { count: number; tag: string }>(); let started = false;
function observeBriefly(): void {
  if (started) return; started = true;
  const observer = new MutationObserver((records) => records.forEach((record) => {
    if (!(record.target instanceof Element)) return;
    const additions = Array.from(record.addedNodes).filter((node): node is Element => node instanceof Element);
    if (!additions.length) return; const tag = additions[0].tagName;
    if (!additions.every((node) => node.tagName === tag)) return;
    const item = candidate.get(record.target) ?? { count: 0, tag }; if (item.tag !== tag) return;
    item.count += additions.length; candidate.set(record.target, item);
  }));
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.setTimeout(() => { observer.disconnect(); cached = [...candidate.entries()].sort((a, b) => b[1].count - a[1].count)[0]?.[0] ?? null; candidate = new Map(); started = false; }, 3000);
}
export const genericAdapter: ChatAdapter = { findContainer: () => { if (!cached?.isConnected) { cached = null; observeBriefly(); } return cached; }, isMessageNode: (node): node is Element => node instanceof Element && node.parentElement === cached, extract: extractText };
