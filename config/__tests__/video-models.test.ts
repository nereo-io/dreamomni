import {
  getVideoModel,
  calculateCredits,
  getImageToVideoModels,
  getSupportedModelIds,
  getTextToVideoModels,
  VideoModelProvider,
} from '@/config/video-models';

describe('video model availability', () => {
  it('does not expose sora models in supported ids or selectable lists', () => {
    expect(getSupportedModelIds().some((modelId) => modelId.includes('sora-2-'))).toBe(false);

    expect(
      getTextToVideoModels().some((model) => model.id.includes('sora-2-'))
    ).toBe(false);

    expect(
      getImageToVideoModels().some((model) => model.id.includes('sora-2-'))
    ).toBe(false);
  });

  it('does not expose kling 3 models in supported ids or selectable lists', () => {
    expect(getSupportedModelIds().some((modelId) => modelId.includes('kie-kling-3-'))).toBe(false);

    expect(
      getTextToVideoModels().some((model) => model.id.includes('kie-kling-3-'))
    ).toBe(false);

    expect(
      getImageToVideoModels().some((model) => model.id.includes('kie-kling-3-'))
    ).toBe(false);
  });

  it('registers Gemini Omni video for the dedicated Omni Studio surface', () => {
    expect(getVideoModel('kie-gemini-omni-video-text-to-video')).toEqual(
      expect.objectContaining({
        provider: VideoModelProvider.KIEAI,
        providerModelId: 'gemini-omni-video',
        supportedDurations: [4, 6, 8, 10],
        supportedAspectRatios: ['16:9', '9:16'],
        supportedResolutions: ['720p', '1080p', '4k'],
        internal: true,
      })
    );
    expect(getVideoModel('kie-gemini-omni-video-image-to-video')).toEqual(
      expect.objectContaining({
        provider: VideoModelProvider.KIEAI,
        providerModelId: 'gemini-omni-video',
        supportedResolutions: ['720p', '1080p', '4k'],
        internal: true,
      })
    );

    expect(getTextToVideoModels().some((model) => model.id === 'kie-gemini-omni-video-text-to-video')).toBe(false);
    expect(getImageToVideoModels().some((model) => model.id === 'kie-gemini-omni-video-image-to-video')).toBe(false);
    expect(getSupportedModelIds()).toEqual(
      expect.arrayContaining([
        'kie-gemini-omni-video-text-to-video',
        'kie-gemini-omni-video-image-to-video',
      ])
    );
  });

  it('prices Gemini Omni resolutions with storage-aware multipliers', () => {
    expect(calculateCredits('kie-gemini-omni-video-text-to-video', 8, false, '720p')).toBe(16);
    expect(calculateCredits('kie-gemini-omni-video-text-to-video', 8, false, '1080p')).toBe(24);
    expect(calculateCredits('kie-gemini-omni-video-text-to-video', 8, false, '4k')).toBe(32);
  });

  it.each([
    'kie-veo3-text-to-video',
    'kie-veo3-image-to-video',
    'kie-veo3-reference-to-video',
  ])('%s charges 1.25 credits per second', (modelId) => {
    expect(getVideoModel(modelId)?.perSecondCredits).toBe(1.25);
  });

  it.each([
    'kie-veo3-lite-text-to-video',
    'kie-veo3-lite-image-to-video',
  ])('%s charges 0.75 credits per second', (modelId) => {
    expect(getVideoModel(modelId)?.perSecondCredits).toBe(0.75);
  });

  it.each([
    'kie-veo3-text-to-video',
    'kie-veo3-image-to-video',
    'kie-veo3-reference-to-video',
  ])('%s charges exactly 1.75 credits per second for 1080p', (modelId) => {
    expect(calculateCredits(modelId, 8, false, '1080p')).toBe(14);
  });
});
