import { thresholdsFor } from '../shared/settings';
import type { Filter } from './types';
const url = /(?:https?:\/\/|www\.)\S+/gi;
export const linksFilter: Filter = { id: 'links', enabled: (s) => s.filters.links, check(ctx, _state, settings) {
  const links = ctx.text.match(url) ?? []; const t = thresholdsFor(settings); const ratio = links.join('').length / Math.max(ctx.text.length, 1);
  return links.length > t.linkCount || (links.length > 1 && ratio > t.linkRatio) ? { blocked: true, reason: 'link spam' } : { blocked: false };
} };
