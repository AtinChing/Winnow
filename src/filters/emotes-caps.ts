import { thresholdsFor } from '../shared/settings';
import type { Filter } from './types';
export const emotesCapsFilter: Filter = { id: 'emotesCaps', enabled: (s) => s.filters.emotesCaps, check(ctx, _state, settings) {
  const t = thresholdsFor(settings); const letters = ctx.text.match(/[A-Za-z]/g) ?? []; const caps = ctx.text.match(/[A-Z]/g) ?? [];
  const repeated = /(.)\1{1,}/g; let longest = 0; for (const match of ctx.text.matchAll(repeated)) longest = Math.max(longest, match[0].length);
  const tokens = ctx.text.trim().split(/\s+/).filter((token) => /^[A-Za-z0-9_]{2,}$/.test(token) && /[A-Z]/.test(token)).length;
  if (longest >= t.repeatedCharacters) return { blocked: true, reason: 'character flood' };
  if (letters.length >= t.capsMinLetters && caps.length / letters.length >= t.capsRatio) return { blocked: true, reason: 'caps flood' };
  return tokens >= t.emoteTokens ? { blocked: true, reason: 'emote flood' } : { blocked: false };
} };
