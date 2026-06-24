import type { ChatAdapter } from './types';
import { extractText } from './types';
export const twitchAdapter: ChatAdapter = {
  // The chat scrollable area and message element expose stable data attributes.
  findContainer: () => document.querySelector('[data-a-target="chat-scroller"]'),
  isMessageNode: (node): node is Element => node instanceof Element && node.matches('[data-a-target="chat-line-message"]'),
  extract: (node) => ({ ...extractText(node), author: node.querySelector('[data-a-target="chat-message-username"]')?.textContent?.trim() })
};
