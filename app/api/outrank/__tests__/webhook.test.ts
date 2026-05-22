const upsertPostFromOutrankMock = jest.fn();

jest.mock('@/models/post', () => ({
  PostStatus: {
    Online: 'online',
  },
  upsertPostFromOutrank: upsertPostFromOutrankMock,
}));

async function loadRoute() {
  return import('@/app/api/outrank/webhook/route');
}

function buildRequest(body: unknown, token = 'test-secret') {
  return new Request('https://dreamomni.ai/api/outrank/webhook', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

function buildArticle(overrides: Record<string, unknown> = {}) {
  return {
    id: 'article-123',
    title: '10 Best AI Video Generator for Free Tools (2026 Guide)',
    slug: '10-best-ai-video-generator-for-free-tools-2026-guide',
    content_markdown: '# Article',
    content_html: '<h1>Article</h1>',
    meta_description: 'A guide to free AI video generator tools.',
    image_url: 'https://example.com/cover.png',
    tags: ['ai-video'],
    created_at: '2026-05-21T00:00:00.000Z',
    ...overrides,
  };
}

describe('Outrank webhook', () => {
  const originalSecret = process.env.OUTRANK_WEBHOOK_SECRET;

  beforeEach(() => {
    process.env.OUTRANK_WEBHOOK_SECRET = 'test-secret';
    upsertPostFromOutrankMock.mockReset();
  });

  afterEach(() => {
    process.env.OUTRANK_WEBHOOK_SECRET = originalSecret;
  });

  it('stores published articles from Outrank', async () => {
    const { POST } = await loadRoute();

    const response = await POST(
      buildRequest({
        event_type: 'publish_articles',
        data: { articles: [buildArticle()] },
      }) as never
    );

    await expect(response.json()).resolves.toEqual({
      code: 0,
      message: 'ok',
      data: { received: true },
    });
    expect(upsertPostFromOutrankMock).toHaveBeenCalledWith(
      expect.objectContaining({
        outrank_id: 'article-123',
        slug: '10-best-ai-video-generator-for-free-tools-2026-guide',
        status: 'online',
        locale: 'en',
      })
    );
    expect(upsertPostFromOutrankMock.mock.calls[0][0]).not.toHaveProperty(
      'uuid'
    );
  });

  it('stores updated articles from Outrank', async () => {
    const { POST } = await loadRoute();

    const response = await POST(
      buildRequest({
        event_type: 'update_article',
        data: { article: buildArticle({ title: 'Updated article title' }) },
      }) as never
    );

    await expect(response.json()).resolves.toEqual({
      code: 0,
      message: 'ok',
      data: { received: true },
    });
    expect(upsertPostFromOutrankMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Updated article title',
        outrank_id: 'article-123',
        slug: '10-best-ai-video-generator-for-free-tools-2026-guide',
      })
    );
  });

  it('rejects requests with the wrong token', async () => {
    const { POST } = await loadRoute();

    const response = await POST(
      buildRequest(
        {
          event_type: 'publish_articles',
          data: { articles: [buildArticle()] },
        },
        'wrong-secret'
      ) as never
    );

    await expect(response.json()).resolves.toEqual({
      code: -1,
      message: 'Unauthorized',
    });
    expect(upsertPostFromOutrankMock).not.toHaveBeenCalled();
  });
});
