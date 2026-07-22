import { thresholdsFor } from '../shared/settings';
import { normalizeText } from '../shared/normalize';
import type { Filter } from './types';

const MAX_TRACKED_MESSAGES = 500;

function tokens(text: string): Set<string> {
  return new Set(text.split(/\s+/).filter(Boolean));
}

/** Lightweight near-duplicate check: exact, containment, compact match, or token overlap. */
export function similar(a: string, b: string): boolean {
  if (!a || !b) return false;
  if (a === b) return true;

  const shorter = a.length <= b.length ? a : b;
  const longer = a.length <= b.length ? b : a;
  if (shorter.length > 12 && longer.includes(shorter)) return true;

  const compactA = a.replace(/\s+/g, '');
  const compactB = b.replace(/\s+/g, '');
  if (compactA === compactB) return true;
  if (compactA.length > 12 && compactB.length > 12) {
    if (compactA.includes(compactB) || compactB.includes(compactA)) return true;
  }

  const aTokens = tokens(a);
  const bTokens = tokens(b);
  if (aTokens.size === 0 || bTokens.size === 0) return false;

  let intersection = 0;
  for (const token of aTokens) {
    if (bTokens.has(token)) intersection++;
  }
  const union = aTokens.size + bTokens.size - intersection;
  const jaccard = intersection / union;

  // Require enough shared substance so short unrelated chat does not collide.
  const minShared = Math.min(aTokens.size, bTokens.size) >= 2 ? 2 : 1;
  return intersection >= minShared && jaccard >= 0.75;
}

export const duplicateFilter: Filter = {
  id: 'duplicate',
  enabled: (s) => s.filters.duplicate,
  check(ctx, state, settings) {
    const t = thresholdsFor(settings);
    const cutoff = state.now - t.duplicateWindowSeconds * 1000;
    const text = normalizeText(ctx.text);

    state.messages = state.messages.filter((entry) => entry.at >= cutoff).slice(-MAX_TRACKED_MESSAGES);
    const count = state.messages.filter((entry) => similar(entry.text, text)).length + 1;
    state.messages.push({ text, at: state.now });

    return count > t.duplicateCount
      ? { blocked: true, reason: 'repeated message' }
      : { blocked: false };
  }
};
