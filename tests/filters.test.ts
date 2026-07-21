import { describe, expect, it } from 'vitest';
import { duplicateFilter, similar } from '../src/filters/duplicate';
import { floodFilter } from '../src/filters/flood';
import { wordlistFilter } from '../src/filters/wordlist';
import { defaultSettings } from '../src/shared/settings';
import type { MessageContext, PipelineState } from '../src/filters/types';

const node = {} as Element;
const ctx = (text: string, author?: string): MessageContext => ({ text, author, node });
const state = (now = 1000): PipelineState => ({ authors: new Map(), messages: [], now });

describe('flood filter', () => {
  it('blocks posts after threshold within window', () => {
    const s = state();
    let result = { blocked: false };
    for (let i = 0; i < 6; i++) result = floodFilter.check(ctx('hello', 'a'), s, defaultSettings);
    expect(result.blocked).toBe(true);
  });

  it('prunes stale authors outside the flood window', () => {
    const s = state(1000);
    floodFilter.check(ctx('one', 'old'), s, defaultSettings);
    expect(s.authors.has('old')).toBe(true);

    s.now = 1000 + 11_000;
    floodFilter.check(ctx('two', 'new'), s, defaultSettings);
    expect(s.authors.has('old')).toBe(false);
    expect(s.authors.has('new')).toBe(true);
  });
});

describe('duplicate filter', () => {
  it('blocks repeated normalized messages', () => {
    const s = state();
    let result = { blocked: false };
    for (let i = 0; i < 4; i++) result = duplicateFilter.check(ctx('HELLO!!!'), s, defaultSettings);
    expect(result.blocked).toBe(true);
  });

  it('treats near-duplicate phrasing as similar', () => {
    expect(similar('pog champ moment', 'pogchamp moment')).toBe(true);
    expect(similar('gg well played team', 'gg well played')).toBe(true);
    expect(similar('nice play', 'totally different chat')).toBe(false);
  });

  it('blocks near-duplicate spam bursts', () => {
    const s = state();
    let result = { blocked: false };
    const samples = ['pog champ!!!', 'POG CHAMP', 'pog  champ'];
    for (const text of samples) {
      for (let i = 0; i < 2; i++) result = duplicateFilter.check(ctx(text), s, defaultSettings);
    }
    expect(result.blocked).toBe(true);
  });
});

describe('word list', () => {
  it('handles evasion and allowlist override', () => {
    const s = state();
    expect(wordlistFilter.check(ctx('k y sss'), s, defaultSettings).blocked).toBe(true);
    expect(wordlistFilter.check(ctx('kys'), s, { ...defaultSettings, allowlist: ['kys'] }).blocked).toBe(false);
  });
});
