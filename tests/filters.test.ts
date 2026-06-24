import { describe, expect, it } from 'vitest';
import { duplicateFilter } from '../src/filters/duplicate';
import { floodFilter } from '../src/filters/flood';
import { wordlistFilter } from '../src/filters/wordlist';
import { defaultSettings } from '../src/shared/settings';
import type { MessageContext, PipelineState } from '../src/filters/types';
const node = {} as Element; const ctx = (text: string, author?: string): MessageContext => ({ text, author, node });
const state = (): PipelineState => ({ authors: new Map(), messages: [], now: 1000 });
describe('flood filter', () => it('blocks posts after threshold within window', () => {
  const s = state(); let result = { blocked: false }; for (let i = 0; i < 6; i++) result = floodFilter.check(ctx('hello', 'a'), s, defaultSettings); expect(result.blocked).toBe(true);
}));
describe('duplicate filter', () => it('blocks repeated normalized messages', () => {
  const s = state(); let result = { blocked: false }; for (let i = 0; i < 4; i++) result = duplicateFilter.check(ctx('HELLO!!!'), s, defaultSettings); expect(result.blocked).toBe(true);
}));
describe('word list', () => it('handles evasion and allowlist override', () => {
  const s = state(); expect(wordlistFilter.check(ctx('k y sss'), s, defaultSettings).blocked).toBe(true);
  expect(wordlistFilter.check(ctx('kys'), s, { ...defaultSettings, allowlist: ['kys'] }).blocked).toBe(false);
}));
