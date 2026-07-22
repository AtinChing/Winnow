import { describe, expect, it } from 'vitest';
import { Pipeline } from '../src/content/pipeline';
import { defaultSettings, type Settings } from '../src/shared/settings';

const node = {} as Element;

function settings(overrides: Partial<Settings['filters']>): Settings {
  return {
    ...defaultSettings,
    filters: {
      flood: false,
      duplicate: false,
      links: false,
      emotesCaps: false,
      wordlist: false,
      ml: false,
      ...overrides
    }
  };
}

describe('Pipeline', () => {
  it('returns not blocked when matching filters are disabled', () => {
    const pipeline = new Pipeline();
    const result = pipeline.check({ text: 'kys', node }, settings({ wordlist: false }));
    expect(result.blocked).toBe(false);
  });

  it('returns not blocked when every filter is disabled', () => {
    const pipeline = new Pipeline();
    const result = pipeline.check(
      { text: 'kys https://a.com https://b.com https://c.com THIS IS ALL CAPS SPAM YES', node },
      settings({})
    );
    expect(result.blocked).toBe(false);
  });

  it('blocks with the first enabled matching filter', () => {
    const pipeline = new Pipeline();
    const result = pipeline.check(
      { text: 'kys https://a.com https://b.com https://c.com', node },
      settings({ wordlist: true, links: true })
    );
    expect(result.blocked).toBe(true);
    // links runs before wordlist in the pipeline order
    expect(result.reason).toBe('link spam');
  });

  it('short-circuits on flood before later filters run', () => {
    const pipeline = new Pipeline();
    const cfg = settings({ flood: true, wordlist: true });
    const now = 5_000;
    for (let i = 0; i < 5; i++) {
      expect(pipeline.check({ text: 'hello', author: 'spammer', node }, cfg, now).blocked).toBe(false);
    }
    // Would also match wordlist, but flood is earlier and should win.
    const result = pipeline.check({ text: 'kys', author: 'spammer', node }, cfg, now);
    expect(result.blocked).toBe(true);
    expect(result.reason).toBe('message flood');
  });

  it('applies wordlist when it is the only enabled filter', () => {
    const pipeline = new Pipeline();
    const result = pipeline.check({ text: 'kys', node }, settings({ wordlist: true }));
    expect(result.blocked).toBe(true);
    expect(result.reason).toBe('blocked term');
  });

  it('skips disabled earlier filters and still applies later ones', () => {
    const pipeline = new Pipeline();
    const result = pipeline.check(
      { text: 'https://a.com https://b.com https://c.com', node },
      settings({ flood: false, duplicate: false, links: true })
    );
    expect(result.blocked).toBe(true);
    expect(result.reason).toBe('link spam');
  });
});
