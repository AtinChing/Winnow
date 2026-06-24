import { thresholdsFor } from '../shared/settings';
import { normalizeText } from '../shared/normalize';
import type { Filter } from './types';

const similar = (a: string, b: string): boolean => a === b || (a.length > 12 && b.length > 12 && (a.includes(b) || b.includes(a)));
export const duplicateFilter: Filter = {
  id: 'duplicate', enabled: (s) => s.filters.duplicate,
  check(ctx, state, settings) {
    const t = thresholdsFor(settings); const cutoff = state.now - t.duplicateWindowSeconds * 1000; const text = normalizeText(ctx.text);
    state.messages = state.messages.filter((entry) => entry.at >= cutoff).slice(-500);
    const count = state.messages.filter((entry) => similar(entry.text, text)).length + 1;
    state.messages.push({ text, at: state.now });
    return count > t.duplicateCount ? { blocked: true, reason: 'repeated message' } : { blocked: false };
  }
};
