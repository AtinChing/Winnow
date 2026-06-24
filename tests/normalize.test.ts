import { describe, expect, it } from 'vitest';
import { compactNormalized, normalizeText } from '../src/shared/normalize';
describe('normalization', () => {
  it('removes common evasion forms', () => expect(compactNormalized('K\u200b\u00fd SSS')).toBe('kyss'));
  it('normalizes leetspeak and punctuation', () => expect(normalizeText('h3ll0, W0RLD!')).toBe('hello world'));
});
