import { thresholdsFor } from '../shared/settings';
import type { Filter } from './types';

export const floodFilter: Filter = {
  id: 'flood', enabled: (s) => s.filters.flood,
  check(ctx, state, settings) {
    if (!ctx.author) return { blocked: false };
    const t = thresholdsFor(settings); const cutoff = state.now - t.floodWindowSeconds * 1000;
    const timestamps = (state.authors.get(ctx.author) ?? []).filter((value) => value >= cutoff);
    timestamps.push(state.now); state.authors.set(ctx.author, timestamps);
    return timestamps.length > t.floodMessages ? { blocked: true, reason: 'message flood' } : { blocked: false };
  }
};
