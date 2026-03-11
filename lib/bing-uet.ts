type UetEventValue = string | number | boolean | null | undefined;

export interface TrackUetEventOptions {
  dedupeKey?: string;
  dedupeStorage?: 'local' | 'session';
}

export type UetEventPayload = Record<string, UetEventValue>;

const UET_STORAGE_PREFIX = 'bing_uet';

function getDedupeStorage(
  dedupeStorage: TrackUetEventOptions['dedupeStorage'] = 'session'
) {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return dedupeStorage === 'local'
      ? window.localStorage
      : window.sessionStorage;
  } catch {
    return null;
  }
}

function hasTrackedEvent(
  dedupeKey: string,
  dedupeStorage?: TrackUetEventOptions['dedupeStorage']
) {
  const storage = getDedupeStorage(dedupeStorage);
  if (!storage) {
    return false;
  }

  return storage.getItem(`${UET_STORAGE_PREFIX}:${dedupeKey}`) === '1';
}

function markTrackedEvent(
  dedupeKey: string,
  dedupeStorage?: TrackUetEventOptions['dedupeStorage']
) {
  const storage = getDedupeStorage(dedupeStorage);
  if (!storage) {
    return;
  }

  storage.setItem(`${UET_STORAGE_PREFIX}:${dedupeKey}`, '1');
}

export function trackUetEvent(
  eventName: string,
  payload: UetEventPayload = {},
  options: TrackUetEventOptions = {}
) {
  if (typeof window === 'undefined' || !window.uetq || typeof window.uetq.push !== 'function') {
    return false;
  }

  if (options.dedupeKey && hasTrackedEvent(options.dedupeKey, options.dedupeStorage)) {
    return false;
  }

  const cleanedPayload = Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined && value !== null)
  );

  try {
    window.uetq.push('event', eventName, cleanedPayload);

    if (options.dedupeKey) {
      markTrackedEvent(options.dedupeKey, options.dedupeStorage);
    }

    return true;
  } catch (error) {
    console.error('Failed to track Bing UET event:', error);
    return false;
  }
}
