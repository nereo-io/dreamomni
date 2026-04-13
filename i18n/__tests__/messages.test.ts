import { pathnames } from "@/i18n/locale";
import { mergeMessages } from "@/i18n/message-utils";
import { buildLegalPageMetadata } from "@/app/[locale]/(legal)/metadata";
import fs from "node:fs";

function flattenMessages(
  value: unknown,
  path = "",
  result: Record<string, unknown> = {}
) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    for (const [key, nestedValue] of Object.entries(
      value as Record<string, unknown>
    )) {
      flattenMessages(
        nestedValue,
        path ? `${path}.${key}` : key,
        result
      );
    }
  } else {
    result[path] = value;
  }

  return result;
}

describe("mergeMessages", () => {
  it("keeps English values when localized keys are missing or null", () => {
    expect(
      mergeMessages(
        {
          footer: {
            popularEffects: "Popular Effects",
            moreEffects: "More Effects →",
          },
          nested: {
            title: "English title",
          },
        },
        {
          footer: {
            popularEffects: "Effets populaires",
            moreEffects: null,
          },
          nested: null,
        }
      )
    ).toEqual({
      footer: {
        popularEffects: "Effets populaires",
        moreEffects: "More Effects →",
      },
      nested: {
        title: "English title",
      },
    });
  });
});

describe("legal pathnames", () => {
  it("defines internal legal routes instead of locale-indexed pathnames", () => {
    expect(pathnames["/privacy-policy"]).toBe("/privacy-policy");
    expect(pathnames["/terms-of-service"]).toBe("/terms-of-service");
    expect(pathnames["/refund-policy"]).toBe("/refund-policy");
    expect(Object.prototype.hasOwnProperty.call(pathnames, "fr")).toBe(false);
  });
});

describe("message coverage", () => {
  it("keeps fr, ja, and ko aligned with English message keys", () => {
    const englishMessages = JSON.parse(
      fs.readFileSync("i18n/messages/en.json", "utf8")
    );
    const englishKeys = Object.keys(flattenMessages(englishMessages));

    for (const locale of ["fr", "ja", "ko"]) {
      const localeMessages = JSON.parse(
        fs.readFileSync(`i18n/messages/${locale}.json`, "utf8")
      );
      const localeKeys = new Set(Object.keys(flattenMessages(localeMessages)));
      const missingKeys = englishKeys.filter((key) => !localeKeys.has(key));

      expect(missingKeys).toEqual([]);
    }
  });
});

describe("legal metadata", () => {
  const originalBaseUrl = process.env.NEXT_PUBLIC_WEB_URL;

  afterEach(() => {
    if (originalBaseUrl === undefined) {
      delete process.env.NEXT_PUBLIC_WEB_URL;
    } else {
      process.env.NEXT_PUBLIC_WEB_URL = originalBaseUrl;
    }
  });

  it("builds localized canonical and alternate URLs for legal pages", () => {
    process.env.NEXT_PUBLIC_WEB_URL = "https://example.com";

    const metadata = buildLegalPageMetadata(
      "fr",
      "/privacy-policy",
      "Privacy Policy"
    );
    const languages = metadata.alternates?.languages as Record<string, string>;
    const openGraph = metadata.openGraph as { url?: string };

    expect(metadata.alternates?.canonical).toBe(
      "https://example.com/fr/privacy-policy"
    );
    expect(openGraph.url).toBe("https://example.com/fr/privacy-policy");
    expect(languages.fr).toBe("https://example.com/fr/privacy-policy");
    expect(languages.en).toBe("https://example.com/privacy-policy");
    expect(languages["x-default"]).toBe("https://example.com/privacy-policy");
  });
});

describe("terms of service content", () => {
  it("uses a relative privacy policy link so localized routes stay in-locale", () => {
    const content = fs.readFileSync(
      "app/(legal)/terms-of-service/page.mdx",
      "utf8"
    );

    expect(content).toContain("[Privacy Policy](./privacy-policy)");
    expect(content).not.toContain("[Privacy Policy](/privacy-policy)");
  });
});
