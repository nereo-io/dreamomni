import { KieAiGeminiOmniProvider } from '@/services/providers/KieAiGeminiOmniProvider';

describe('KieAiGeminiOmniProvider', () => {
  const originalFetch = global.fetch;
  const originalBaseUrl = process.env.KIE_AI_BASE_URL;
  const originalPreupload = process.env.KIE_GEMINI_OMNI_PREUPLOAD_INPUTS;

  beforeEach(() => {
    process.env.KIE_AI_BASE_URL = 'https://api.test.kie.ai';
    delete process.env.KIE_GEMINI_OMNI_PREUPLOAD_INPUTS;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env.KIE_AI_BASE_URL = originalBaseUrl;
    if (originalPreupload === undefined) {
      delete process.env.KIE_GEMINI_OMNI_PREUPLOAD_INPUTS;
    } else {
      process.env.KIE_GEMINI_OMNI_PREUPLOAD_INPUTS = originalPreupload;
    }
    jest.restoreAllMocks();
  });

  it('submits Gemini Omni video tasks through the Kie jobs API', async () => {
    process.env.KIE_GEMINI_OMNI_PREUPLOAD_INPUTS = 'true';
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          code: 200,
          msg: 'File uploaded successfully',
          data: {
            downloadUrl: 'https://tempfile.redpandaai.co/kieai/test/input.png',
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 200,
          msg: 'success',
          data: { taskId: 'task_123' },
        }),
      });
    global.fetch = fetchMock as unknown as typeof fetch;

    const provider = new KieAiGeminiOmniProvider('test-key');
    const response = await provider.submit(
      'kie-gemini-omni-video-image-to-video',
      {
        model: 'gemini-omni-video',
        prompt: 'Animate the fern leaves with harp sounds',
        image_urls: ['https://example.com/input.png'],
        duration: '8s',
        aspect_ratio: '16:9',
        resolution: '720p',
        seed: 42,
      },
      'https://example.com/api/video-generation/webhook'
    );

    expect(response.request_id).toBe('task_123');
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://kieai.redpandaai.co/api/file-url-upload',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-key',
          'Content-Type': 'application/json',
        }),
      })
    );
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual(
      expect.objectContaining({
        fileUrl: 'https://example.com/input.png',
        uploadPath: 'gemini-omni-video',
      })
    );

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://api.test.kie.ai/api/v1/jobs/createTask',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-key',
          'Content-Type': 'application/json',
        }),
      })
    );
    const requestBody = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(requestBody).toEqual({
      model: 'gemini-omni-video',
      input: {
        prompt: 'Animate the fern leaves with harp sounds',
        image_urls: ['https://tempfile.redpandaai.co/kieai/test/input.png'],
        duration: '8',
        aspect_ratio: '16:9',
        resolution: '720p',
        seed: 42,
      },
      callBackUrl: 'https://example.com/api/video-generation/webhook',
    });
  });

  it('passes external image URLs directly unless preupload is explicitly enabled', async () => {
    const fetchMock = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        code: 200,
        msg: 'success',
        data: { taskId: 'task_direct' },
      }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const provider = new KieAiGeminiOmniProvider('test-key');
    await provider.submit('kie-gemini-omni-video-image-to-video', {
      model: 'gemini-omni-video',
      prompt: 'Turn the reference image into a cinematic product teaser',
      image_urls: ['https://cdn.example.com/input.png'],
      duration: '4',
      aspect_ratio: '9:16',
      resolution: '720p',
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(requestBody.input.image_urls).toEqual([
      'https://cdn.example.com/input.png',
    ]);
  });

  it('submits source video edits without requiring image references', async () => {
    const fetchMock = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        code: 200,
        msg: 'success',
        data: { taskId: 'task_video_edit' },
      }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const provider = new KieAiGeminiOmniProvider('test-key');
    await provider.submit('kie-gemini-omni-video-image-to-video', {
      model: 'gemini-omni-video',
      prompt: 'Change the room into a neon glass studio while preserving motion',
      video_list: [
        {
          url: 'https://cdn.example.com/source.mp4',
          start: 0,
          ends: 8,
        },
      ],
      duration: '8',
      aspect_ratio: '16:9',
      resolution: '720p',
    });

    const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(requestBody.input).toEqual(
      expect.objectContaining({
        video_list: [
          {
            url: 'https://cdn.example.com/source.mp4',
            start: 0,
            ends: 8,
          },
        ],
      })
    );
    expect(requestBody.input.image_urls).toBeUndefined();
  });

  it('parses successful recordInfo responses into completed video results', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 200,
        msg: 'success',
        data: {
          taskId: 'task_123',
          model: 'gemini-omni-video',
          state: 'success',
          resultJson: JSON.stringify({
            resultUrls: ['https://cdn.example.com/result.mp4'],
          }),
        },
      }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const provider = new KieAiGeminiOmniProvider('test-key');
    const result = await provider.result(
      'kie-gemini-omni-video-image-to-video',
      'task_123'
    );

    expect(result).toEqual(
      expect.objectContaining({
        request_id: 'task_123',
        status: 'COMPLETED',
        video_url: 'https://cdn.example.com/result.mp4',
        model: 'gemini-omni-video',
      })
    );
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.test.kie.ai/api/v1/jobs/recordInfo?taskId=task_123',
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('rejects unsupported Gemini Omni durations instead of silently remapping them', async () => {
    const provider = new KieAiGeminiOmniProvider('test-key');

    await expect(
      provider.submit('kie-gemini-omni-video-text-to-video', {
        model: 'gemini-omni-video',
        prompt: 'Create a cinematic shot',
        duration: '5',
        aspect_ratio: '16:9',
      })
    ).rejects.toThrow('Unsupported Gemini Omni duration');
  });
});
