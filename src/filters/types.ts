import type { Settings } from '../shared/settings';

export interface MessageContext { text: string; author?: string; node: Element; }
export interface FilterResult { blocked: boolean; reason?: string; }
export interface PipelineState {
  authors: Map<string, number[]>;
  messages: Array<{ text: string; at: number }>;
  now: number;
}
export interface Filter { id: string; enabled(settings: Settings): boolean; check(ctx: MessageContext, state: PipelineState, settings: Settings): FilterResult; }
