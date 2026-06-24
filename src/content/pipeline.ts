import { duplicateFilter } from '../filters/duplicate';
import { emotesCapsFilter } from '../filters/emotes-caps';
import { floodFilter } from '../filters/flood';
import { linksFilter } from '../filters/links';
import { mlFilter } from '../filters/ml';
import type { Filter, MessageContext, PipelineState } from '../filters/types';
import { wordlistFilter } from '../filters/wordlist';
import type { Settings } from '../shared/settings';
const filters: Filter[] = [floodFilter, duplicateFilter, linksFilter, emotesCapsFilter, wordlistFilter, mlFilter];
export class Pipeline {
  private state: PipelineState = { authors: new Map(), messages: [], now: 0 };
  check(ctx: MessageContext, settings: Settings) { this.state.now = Date.now(); for (const filter of filters) if (filter.enabled(settings)) { const result = filter.check(ctx, this.state, settings); if (result.blocked) return result; } return { blocked: false }; }
}
