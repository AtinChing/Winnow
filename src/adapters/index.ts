import type { ChatAdapter } from './types';
import { genericAdapter } from './generic'; import { kickAdapter } from './kick'; import { twitchAdapter } from './twitch'; import { youtubeLiveAdapter } from './youtube-live';
export function getAdapter(hostname: string): ChatAdapter { if (hostname.endsWith('twitch.tv')) return twitchAdapter; if (hostname.endsWith('youtube.com')) return youtubeLiveAdapter; if (hostname.endsWith('kick.com')) return kickAdapter; return genericAdapter; }
