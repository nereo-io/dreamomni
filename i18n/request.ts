import { getRequestConfig } from "next-intl/server";
import { mergeMessages } from "./message-utils";
import { routing } from "./routing";

async function loadMessages(locale: string) {
  return (await import(`./messages/${locale.toLowerCase()}.json`)).default;
}

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  if (["zh-CN"].includes(locale)) {
    locale = "zh";
  }

  if (!routing.locales.includes(locale as any)) {
    locale = "en";
  }

  const englishMessages = await loadMessages("en");

  try {
    if (locale === "en") {
      return {
        locale,
        messages: englishMessages,
      };
    }

    const localeMessages = await loadMessages(locale);

    return {
      locale,
      messages: mergeMessages(englishMessages, localeMessages),
    };
  } catch (error) {
    console.warn(
      `Failed to load messages for locale ${locale}, falling back to English messages`,
      error
    );

    return {
      locale,
      messages: englishMessages,
    };
  }
});
