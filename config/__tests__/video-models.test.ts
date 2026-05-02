import {
  getImageToVideoModels,
  getSupportedModelIds,
  getTextToVideoModels,
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
});
