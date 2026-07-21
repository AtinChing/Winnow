import { describe, expect, it } from 'vitest';
import { emotesCapsFilter } from '../src/filters/emotes-caps';
import { linksFilter } from '../src/filters/links';
import { defaultSettings } from '../src/shared/settings';
import type { MessageContext, PipelineState } from '../src/filters/types';

const node = {} as Element;
const ctx = (text: string): MessageContext => ({ text, node });
const state = (): PipelineState => ({ authors: new Map(), messages: [], now: 1000 });

describe('links filter', () => {
  it('allows a single normal link under medium thresholds', () => {
    const result = linksFilter.check(ctx('check this https://example.com later'), state(), defaultSettings);
    expect(result.blocked).toBe(false);
  });

  it('blocks when link count exceeds the threshold', () => {
    const text = 'https://a.com https://b.com https://c.com';
    const result = linksFilter.check(ctx(text), state(), defaultSettings);
    expect(result.blocked).toBe(true);
    expect(result.reason).toBe('link spam');
  });

  it('blocks high link-ratio messages with multiple URLs', () => {
    const text = 'https://spam.example/x https://spam.example/y';
    const result = linksFilter.check(ctx(text), state(), defaultSettings);
    expect(result.blocked).toBe(true);
  });
});

describe('emotes and caps filter', () => {
  it('blocks caps floods', () => {
    const result = emotesCapsFilter.check(ctx('THIS IS ALL CAPS SPAM YES'), state(), defaultSettings);
    expect(result.blocked).toBe(true);
    expect(result.reason).toBe('caps flood');
  });

  it('blocks long character floods', () => {
    const result = emotesCapsFilter.check(ctx(`go${'o'.repeat(20)}l`), state(), defaultSettings);
    expect(result.blocked).toBe(true);
    expect(result.reason).toBe('character flood');
  });

  it('blocks emote-token floods', () => {
    const tokens = Array.from({ length: 10 }, (_, i) => `Emote${i}`).join(' ');
    const result = emotesCapsFilter.check(ctx(tokens), state(), defaultSettings);
    expect(result.blocked).toBe(true);
    expect(result.reason).toBe('emote flood');
  });

  it('allows ordinary mixed-case chat', () => {
    const result = emotesCapsFilter.check(ctx('That was a nice play'), state(), defaultSettings);
    expect(result.blocked).toBe(false);
  });
});
