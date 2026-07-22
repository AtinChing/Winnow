import { thresholdsFor } from '../shared/settings';
import type { Filter } from './types';

function pruneAuthors(state: { authors: Map<string, number[]>; now: number }, cutoff: number): void {
  for (const [author, timestamps] of state.authors) {
    const recent = timestamps.filter((value) => value >= cutoff);
    if (recent.length) state.authors.set(author, recent);
    else state.authors.delete(author);
  }
}

export const floodFilter: Filter = {
  id: 'flood',
  enabled: (s) => s.filters.flood,
  check(ctx, state, settings) {
    if (!ctx.author) return { blocked: false };

    const t = thresholdsFor(settings);
    const cutoff = state.now - t.floodWindowSeconds * 1000;
    pruneAuthors(state, cutoff);

    const timestamps = state.authors.get(ctx.author) ?? [];
    timestamps.push(state.now);
    state.authors.set(ctx.author, timestamps);

    return timestamps.length > t.floodMessages
      ? { blocked: true, reason: 'message flood' }
      : { blocked: false };
  }
};
