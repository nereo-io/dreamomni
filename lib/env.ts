export function getTrimmedEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

export function getPublicWebUrl(): string {
  return getTrimmedEnv('NEXT_PUBLIC_WEB_URL') || 'https://geminiomni.tv';
}
