import { compactNormalized, normalizeText } from '../shared/normalize';
import type { Filter } from './types';

// Keep the bundled set deliberately small. Users can add their own terms in settings.
const bundledTerms = ['kys'];
export const wordlistFilter: Filter = { id: 'wordlist', enabled: (s) => s.filters.wordlist, check(ctx, _state, settings) {
  const normal = normalizeText(ctx.text); const compact = compactNormalized(ctx.text);
  const allow = settings.allowlist.map(compactNormalized).filter(Boolean);
  if (allow.some((term) => normal.includes(term) || compact.includes(term))) return { blocked: false };
  const blocked = [...bundledTerms, ...settings.customBlocklist].map(compactNormalized).filter(Boolean);
  return blocked.some((term) => compact.includes(term)) ? { blocked: true, reason: 'blocked term' } : { blocked: false };
} };
