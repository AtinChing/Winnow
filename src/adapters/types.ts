import type { MessageContext } from '../filters/types';
export interface ChatAdapter { findContainer(): Element | null; isMessageNode(node: Node): node is Element; extract(node: Element): MessageContext; }
export const extractText = (node: Element): MessageContext => ({ text: node.textContent?.trim() ?? '', node });
