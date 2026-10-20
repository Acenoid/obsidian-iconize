import { Event } from './event';

export type AllIconsLoadedEvent = Event<undefined>;

/**
 * Emitted for each icon pack when its icons were read in the background after startup
 * or when they could not be read.
 */
export type IconPackLoadedEvent = Event<{
  iconPackName: string;
  success: boolean;
  /** Why the icon pack could not be read. Only set when `success` is `false`. */
  error?: unknown;
}>;

export type EventMap = {
  allIconsLoaded: AllIconsLoadedEvent;
  iconPackLoaded: IconPackLoadedEvent;
};

export type EventType = keyof EventMap;
export type AnyEvent = EventMap[EventType];
