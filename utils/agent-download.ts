export function buildAgentAssetDownloadUrl(
  assetId: string,
  filename: string,
  source?: string
) {
  const params = new URLSearchParams();
  if (filename) {
    params.set("filename", filename);
  }
  if (source) {
    params.set("source", source);
  }

  const query = params.toString();
  return `/api/agent/assets/${assetId}/download${query ? `?${query}` : ""}`;
}
