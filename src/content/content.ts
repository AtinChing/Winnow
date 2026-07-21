import { getAdapter } from '../adapters';
import type { ChatAdapter } from '../adapters/types';
import { DomActions } from './dom-actions';
import { Pipeline } from './pipeline';
import { getSettings, type Settings } from '../shared/settings';

declare global {
  interface Window {
    __winnowInitialized?: boolean;
  }
}

if (!window.__winnowInitialized) {
  window.__winnowInitialized = true;

  let settings: Settings;
  let adapter: ChatAdapter;
  let observer: MutationObserver | undefined;
  let pending = new Set<Element>();
  let actions: DomActions | undefined;
  const pipeline = new Pipeline();

  async function enabled(): Promise<boolean> {
    settings = await getSettings();
    return settings.enabledOrigins[location.origin] === true;
  }

  function process(): void {
    if (!actions) return;
    const nodes = [...pending];
    pending.clear();
    let blocked = 0;
    for (const node of nodes) {
      actions.reset(node);
      const ctx = adapter.extract(node);
      if (!ctx.text) continue;
      const result = pipeline.check(ctx, settings);
      if (result.blocked) {
        actions.block(node, result.reason ?? 'filtered');
        blocked++;
      }
    }
    if (blocked) {
      chrome.runtime.sendMessage({ type: 'filtered', delta: blocked }).catch(() => undefined);
    }
  }

  function queue(node: Node): void {
    if (adapter.isMessageNode(node)) pending.add(node);
    if (node instanceof Element) {
      node.querySelectorAll('*').forEach((child) => {
        if (adapter.isMessageNode(child)) pending.add(child);
      });
    }
    queueMicrotask(process);
  }

  function attach(container: Element): void {
    observer?.disconnect();
    observer = new MutationObserver((records) => {
      records.forEach((record) => {
        record.addedNodes.forEach(queue);
        if (record.type === 'characterData') {
          queue(record.target.parentElement ?? record.target);
        }
      });
    });
    observer.observe(container, { childList: true, subtree: true, characterData: true });
    container.querySelectorAll('*').forEach(queue);
  }

  async function start(): Promise<void> {
    if (!(await enabled())) {
      observer?.disconnect();
      observer = undefined;
      actions?.destroy();
      actions = undefined;
      return;
    }

    actions ??= new DomActions();
    adapter = getAdapter(location.hostname);
    const find = () => {
      const container = adapter.findContainer();
      if (container) attach(container);
      else window.setTimeout(find, 1000);
    };
    find();
  }

  chrome.runtime.onMessage.addListener((message: { type?: string }) => {
    if (message.type === 'settings-changed') {
      observer?.disconnect();
      observer = undefined;
      void start();
    }
  });

  void start();
}
