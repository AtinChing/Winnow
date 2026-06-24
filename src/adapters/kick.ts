import type { ChatAdapter } from './types';
import { extractText } from './types';
export const kickAdapter: ChatAdapter = {
  // Data attributes are favored here and this safely falls back to generic detection if absent.
  findContainer: () => document.querySelector('[data-testid="chatroom-messages"]'),
  isMessageNode: (node): node is Element => node instanceof Element && node.matches('[data-testid="chat-entry"]'),
  extract: (node) => ({ ...extractText(node), author: node.querySelector('[data-testid="chat-entry-username"]')?.textContent?.trim() })
};
