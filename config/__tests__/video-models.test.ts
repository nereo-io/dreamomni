import {
  getVideoModel,
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
        supportedResolutions: ['720p'],
        internal: true,
      })
    );
    expect(getVideoModel('kie-gemini-omni-video-image-to-video')).toEqual(
      expect.objectContaining({
        provider: VideoModelProvider.KIEAI,
        providerModelId: 'gemini-omni-video',
        supportedResolutions: ['720p'],
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
});
