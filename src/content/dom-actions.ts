const hidden = new WeakSet<Element>();
export class DomActions {
  private count = 0; private badge: HTMLButtonElement;
  constructor() { this.badge = document.createElement('button'); this.badge.textContent = 'Winnow: 0 filtered'; this.badge.title = 'Show filtered messages'; this.badge.style.cssText = 'position:fixed;right:12px;bottom:12px;z-index:2147483647;padding:6px 9px;border:0;border-radius:999px;background:#222;color:#fff;font:12px sans-serif;opacity:.82;cursor:pointer'; this.badge.onclick = () => this.revealAll(); document.documentElement.append(this.badge); }
  block(node: Element, reason: string): void { const item = node as HTMLElement; item.dataset.winnowOriginalDisplay = item.style.display; item.dataset.winnowReason = reason; item.style.display = 'none'; hidden.add(node); this.count++; this.badge.textContent = `Winnow: ${this.count} filtered`; }
  reset(node: Element): void { if (!hidden.has(node)) return; const item = node as HTMLElement; item.style.display = item.dataset.winnowOriginalDisplay ?? ''; delete item.dataset.winnowOriginalDisplay; delete item.dataset.winnowReason; hidden.delete(node); }
  getCount(): number { return this.count; }
  destroy(): void { this.badge.remove(); }
  private revealAll(): void { document.querySelectorAll<HTMLElement>('[data-winnow-original-display]').forEach((node) => this.reset(node)); }
}
