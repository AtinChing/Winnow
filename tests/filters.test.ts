import { describe, expect, it } from 'vitest';
import { duplicateFilter, similar } from '../src/filters/duplicate';
import { floodFilter } from '../src/filters/flood';
import { wordlistFilter } from '../src/filters/wordlist';
import { defaultSettings } from '../src/shared/settings';
import type { FilterResult, MessageContext, PipelineState } from '../src/filters/types';

const node = {} as Element;
const ctx = (text: string, author?: string): MessageContext => ({ text, author, node });
const state = (now = 1000): PipelineState => ({ authors: new Map(), messages: [], now });

describe('flood filter', () => {
  it('blocks posts after threshold within window', () => {
    const s = state();
    let result: FilterResult = { blocked: false };
    for (let i = 0; i < 6; i++) result = floodFilter.check(ctx('hello', 'a'), s, defaultSettings);
    expect(result.blocked).toBe(true);
    expect(result.reason).toBe('message flood');
  });

  it('allows posts at the threshold without exceeding it', () => {
    const s = state();
    let result = { blocked: false };
    for (let i = 0; i < 5; i++) result = floodFilter.check(ctx('hello', 'a'), s, defaultSettings);
    expect(result.blocked).toBe(false);
  });

  it('ignores messages without an author', () => {
    const s = state();
    for (let i = 0; i < 10; i++) {
      expect(floodFilter.check(ctx('hello'), s, defaultSettings).blocked).toBe(false);
    }
    expect(s.authors.size).toBe(0);
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

  it('keeps recent timestamps while pruning only stale ones for an author', () => {
    const s = state(1000);
    floodFilter.check(ctx('one', 'a'), s, defaultSettings);
    s.now = 1000 + 5_000;
    floodFilter.check(ctx('two', 'a'), s, defaultSettings);
    s.now = 1000 + 12_000;
    floodFilter.check(ctx('three', 'a'), s, defaultSettings);

    expect(s.authors.get('a')).toEqual([6000, 13000]);
  });
});

describe('duplicate filter', () => {
  it('blocks repeated normalized messages', () => {
    const s = state();
    let result: FilterResult = { blocked: false };
    for (let i = 0; i < 4; i++) result = duplicateFilter.check(ctx('HELLO!!!'), s, defaultSettings);
    expect(result.blocked).toBe(true);
    expect(result.reason).toBe('repeated message');
  });

  it('treats near-duplicate phrasing as similar', () => {
    expect(similar('pog champ moment', 'pogchamp moment')).toBe(true);
    expect(similar('gg well played team', 'gg well played')).toBe(true);
    expect(similar('nice play', 'totally different chat')).toBe(false);
  });

  it('does not treat empty normalized text as similar', () => {
    expect(similar('', '')).toBe(false);
    expect(similar('', 'hello')).toBe(false);
    expect(similar('hello', '')).toBe(false);
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

  it('prunes duplicates outside the duplicate window', () => {
    const s = state(1000);
    for (let i = 0; i < 3; i++) {
      expect(duplicateFilter.check(ctx('same message'), s, defaultSettings).blocked).toBe(false);
    }

    s.now = 1000 + 31_000;
    expect(duplicateFilter.check(ctx('same message'), s, defaultSettings).blocked).toBe(false);
    expect(s.messages).toHaveLength(1);
  });

  it('does not count punctuation-only empties toward duplicate spam', () => {
    const s = state();
    let result = { blocked: false };
    for (let i = 0; i < 6; i++) result = duplicateFilter.check(ctx('!!!'), s, defaultSettings);
    expect(result.blocked).toBe(false);
  });
});

describe('word list', () => {
  it('handles evasion and allowlist override', () => {
    const s = state();
    expect(wordlistFilter.check(ctx('k y sss'), s, defaultSettings).blocked).toBe(true);
    expect(wordlistFilter.check(ctx('kys'), s, { ...defaultSettings, allowlist: ['kys'] }).blocked).toBe(false);
  });

  it('respects custom blocklist terms', () => {
    const s = state();
    const settings = { ...defaultSettings, customBlocklist: ['badword'] };
    expect(wordlistFilter.check(ctx('that was a badword'), s, settings).blocked).toBe(true);
  });
});
