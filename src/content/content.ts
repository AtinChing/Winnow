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

// Idempotent under registerContentScripts + executeScript double-injection.
if (!window.__winnowInitialized) {
  window.__winnowInitialized = true;

  let settings: Settings;
  let adapter: ChatAdapter;
  let observer: MutationObserver | undefined;
  let findTimer: ReturnType<typeof setTimeout> | undefined;
  let runId = 0;
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
    let delta = 0;
    for (const node of nodes) {
      const wasBlocked = actions.isBlocked(node);
      actions.reset(node);
      const ctx = adapter.extract(node);
      if (!ctx.text) {
        if (wasBlocked) delta--;
        continue;
      }
      const result = pipeline.check(ctx, settings);
      if (result.blocked) {
        actions.block(node, result.reason ?? 'filtered');
        if (!wasBlocked) delta++;
      } else if (wasBlocked) {
        delta--;
      }
    }
    if (delta) {
      chrome.runtime.sendMessage({ type: 'filtered', delta }).catch(() => undefined);
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

  function stopFiltering(): void {
    runId++;
    if (findTimer !== undefined) {
      clearTimeout(findTimer);
      findTimer = undefined;
    }
    observer?.disconnect();
    observer = undefined;
    pending.clear();
  }

  async function start(): Promise<void> {
    stopFiltering();
    const activeRun = runId;

    if (!(await enabled())) {
      if (activeRun !== runId) return;
      actions?.destroy();
      actions = undefined;
      return;
    }

    if (activeRun !== runId) return;

    actions ??= new DomActions();
    adapter = getAdapter(location.hostname);

    const find = (): void => {
      if (activeRun !== runId) return;
      const container = adapter.findContainer();
      if (container) attach(container);
      else findTimer = setTimeout(find, 1000);
    };
    find();
  }

  chrome.runtime.onMessage.addListener((message: { type?: string }) => {
    if (message.type === 'settings-changed') {
      void start();
    }
  });

  void start();
}
