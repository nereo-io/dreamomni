import { MODEL_LANDING_PAGES } from '@/config/model-landing-pages';
import type { AbstractIntlMessages } from 'next-intl';

const HIDDEN_MODEL_MESSAGE_KEYS = new Set<string>([
  ...MODEL_LANDING_PAGES,
  'sora-alternative',
]);

function sanitizeString(value: string): string {
  return value
    .replaceAll('Seedance', 'GeminiOmni')
    .replaceAll('seedance', 'geminiomni');
}

function sanitizeValue(value: unknown): unknown {
  if (typeof value === 'string') {
    return sanitizeString(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([key]) => !HIDDEN_MODEL_MESSAGE_KEYS.has(key))
        .map(([key, item]) => [key, sanitizeValue(item)])
    );
  }

  return value;
}

export function prepareGeminiOmniClientMessages(
  messages: AbstractIntlMessages
) {
  return sanitizeValue(messages) as AbstractIntlMessages;
}
