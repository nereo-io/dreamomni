import { MODEL_LANDING_PAGES } from '@/config/model-landing-pages';
import type { AbstractIntlMessages } from 'next-intl';

const HIDDEN_MODEL_MESSAGE_KEYS = new Set<string>([
  ...MODEL_LANDING_PAGES,
  'sora-alternative',
]);

function sanitizeString(value: string): string {
  return value
    .replaceAll('www.seedance.tv', 'www.geminiomni.tv')
    .replaceAll('seedance.tv', 'geminiomni.tv')
    .replaceAll('/imgs/intro/seedance.png', '/logo.png')
    .replace(/(?<![/-])seedance(?![-/])/gi, (match) => {
      if (match === 'SEEDANCE') {
        return 'GEMINIOMNI';
      }

      if (match === 'seedance') {
        return 'geminiomni';
      }

      return 'GeminiOmni';
    });
}

export function sanitizeGeminiOmniString(value: string): string {
  return sanitizeString(value);
}

function sanitizeValue(value: unknown, hiddenKeys = new Set<string>()): unknown {
  if (typeof value === 'string') {
    return sanitizeString(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item, hiddenKeys));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([key]) => !hiddenKeys.has(key))
        .map(([key, item]) => [key, sanitizeValue(item, hiddenKeys)])
    );
  }

  return value;
}

export function sanitizeGeminiOmniContent<T>(value: T): T {
  return sanitizeValue(value) as T;
}

export function prepareGeminiOmniClientMessages(
  messages: AbstractIntlMessages
) {
  return sanitizeValue(messages, HIDDEN_MODEL_MESSAGE_KEYS) as AbstractIntlMessages;
}
