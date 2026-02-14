type PlausibleProps = Record<string, unknown>;

export function trackPlausibleEvent(name: string, props?: PlausibleProps) {
  if (typeof window === "undefined") return;
  const plausible = (window as any).plausible;
  if (typeof plausible !== "function") return;

  plausible(name, props ? { props } : undefined);
}
