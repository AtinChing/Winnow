import type { ChatAdapter } from './types';
import { extractText } from './types';
export const youtubeLiveAdapter: ChatAdapter = {
  // YouTube Live uses custom element names rather than generated class selectors.
  findContainer: () => document.querySelector('yt-live-chat-item-list-renderer #items'),
  isMessageNode: (node): node is Element => node instanceof Element && node.matches('yt-live-chat-text-message-renderer, yt-live-chat-paid-message-renderer'),
  extract: (node) => ({ ...extractText(node.querySelector('#message') ?? node), node, author: node.querySelector('#author-name')?.textContent?.trim() })
};
