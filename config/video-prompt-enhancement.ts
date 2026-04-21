export const VIDEO_PROMPT_ENHANCEMENT_ENABLED = false;

export function normalizeVideoPromptEnhancementRequest(
  requested?: boolean
): boolean {
  return VIDEO_PROMPT_ENHANCEMENT_ENABLED && requested === true;
}
