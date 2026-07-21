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

  it('applies wordlist when it is the only enabled filter', () => {
    const pipeline = new Pipeline();
    const result = pipeline.check({ text: 'kys', node }, settings({ wordlist: true }));
    expect(result.blocked).toBe(true);
    expect(result.reason).toBe('blocked term');
  });
});
