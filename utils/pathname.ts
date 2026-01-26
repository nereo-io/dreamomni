const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const stripLocalePrefix = (pathname: string, locale?: string) => {
  if (!pathname || !locale) return pathname;

  const localePattern = new RegExp(`^/${escapeRegex(locale)}(?=/|$)`);
  const stripped = pathname.replace(localePattern, '');

  return stripped === '' ? '/' : stripped;
};
