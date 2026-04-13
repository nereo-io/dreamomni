type Messages = Record<string, unknown>;

function isPlainObject(value: unknown): value is Messages {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function mergeMessages(
  baseMessages: Messages,
  localeMessages: Messages
): Messages {
  const mergedMessages: Messages = { ...baseMessages };

  for (const [key, value] of Object.entries(localeMessages)) {
    const baseValue = mergedMessages[key];

    if (value == null) {
      continue;
    }

    if (isPlainObject(baseValue) && isPlainObject(value)) {
      mergedMessages[key] = mergeMessages(baseValue, value);
      continue;
    }

    mergedMessages[key] = value;
  }

  return mergedMessages;
}
