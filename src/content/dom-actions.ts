const HIDDEN_ATTR = 'data-winnow-original-display';
const REASON_ATTR = 'data-winnow-reason';
const PLACEHOLDER_ATTR = 'data-winnow-placeholder';

export class DomActions {
  private count = 0;
  private readonly badge: HTMLButtonElement;
  private readonly placeholders = new Map<Element, HTMLElement>();

  constructor() {
    this.badge = document.createElement('button');
    this.badge.type = 'button';
    this.badge.title = 'Show all filtered messages';
    this.badge.style.cssText = [
      'position:fixed',
      'right:12px',
      'bottom:12px',
      'z-index:2147483647',
      'padding:7px 11px',
      'border:0',
      'border-radius:8px',
      'background:#1f2a30',
      'color:#e8eef1',
      'font:12px/1.3 ui-sans-serif, system-ui, sans-serif',
      'letter-spacing:0.01em',
      'opacity:0.9',
      'cursor:pointer',
      'box-shadow:0 4px 16px rgba(0,0,0,0.25)'
    ].join(';');
    this.badge.onclick = () => this.revealAll();
    this.renderBadge();
    document.documentElement.append(this.badge);
  }

  block(node: Element, reason: string): void {
    if (this.placeholders.has(node)) return;

    const item = node as HTMLElement;
    item.dataset.winnowOriginalDisplay = item.style.display;
    item.dataset.winnowReason = reason;
    item.style.display = 'none';

    const placeholder = document.createElement('div');
    placeholder.setAttribute(PLACEHOLDER_ATTR, '1');
    placeholder.style.cssText = [
      'display:flex',
      'align-items:center',
      'gap:8px',
      'margin:2px 0',
      'padding:3px 8px',
      'font:11px/1.35 ui-sans-serif, system-ui, sans-serif',
      'color:#6b7a82',
      'background:rgba(31,42,48,0.06)',
      'border-left:2px solid #6f8f8a'
    ].join(';');

    const label = document.createElement('span');
    label.textContent = `Filtered: ${reason}`;
    label.title = reason;

    const show = document.createElement('button');
    show.type = 'button';
    show.textContent = 'Show';
    show.style.cssText =
      'margin-left:auto;border:0;background:transparent;color:#2f6f68;font:inherit;cursor:pointer;text-decoration:underline;padding:0';
    show.onclick = (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.reveal(node);
    };

    placeholder.append(label, show);
    item.insertAdjacentElement('afterend', placeholder);
    this.placeholders.set(node, placeholder);
    this.count++;
    this.renderBadge();
  }

  reset(node: Element): void {
    // Re-evaluation path: drop placeholder/count so a subsequent block() does not double-count.
    this.reveal(node, true);
  }

  reveal(node: Element, updateCount = true): void {
    const item = node as HTMLElement;
    const hadPlaceholder = this.placeholders.has(node);
    const placeholder = this.placeholders.get(node);
    placeholder?.remove();
    this.placeholders.delete(node);

    if (item.hasAttribute(HIDDEN_ATTR) || item.hasAttribute(REASON_ATTR)) {
      item.style.display = item.dataset.winnowOriginalDisplay ?? '';
      delete item.dataset.winnowOriginalDisplay;
      delete item.dataset.winnowReason;
    }

    if (updateCount && hadPlaceholder) {
      this.count = Math.max(0, this.count - 1);
      this.renderBadge();
    }
  }

  revealAll(): void {
    for (const node of [...this.placeholders.keys()]) this.reveal(node, false);
    this.count = 0;
    this.renderBadge();
  }

  isBlocked(node: Element): boolean {
    return this.placeholders.has(node);
  }

  getCount(): number {
    return this.count;
  }

  destroy(): void {
    this.revealAll();
    this.badge.remove();
  }

  private renderBadge(): void {
    this.badge.textContent = this.count
      ? `Winnow: ${this.count} filtered`
      : 'Winnow';
    this.badge.style.display = this.count ? 'block' : 'none';
  }
}
