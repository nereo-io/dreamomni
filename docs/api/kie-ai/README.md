# Kie.ai Sora 2 API Documentation

This directory contains comprehensive API documentation for all Kie.ai Sora 2 video generation models.

## Available Models

### Standard Models

1. **[Sora 2 Text To Video](./sora-2-text-to-video.md)**
   - Generate videos from text prompts
   - Duration: 10s or 15s
   - Aspect ratios: Portrait, Landscape
   - Best for: Quick video generation from descriptions

2. **[Sora 2 Image To Video](./sora-2-image-to-video.md)**
   - Generate videos from a single image
   - Duration: 10s or 15s
   - Aspect ratios: Portrait, Landscape
   - Best for: Animating static images

### Pro Models (Enhanced Quality)

3. **[Sora 2 Pro Text To Video](./sora-2-pro-text-to-video.md)**
   - High-quality video generation from text
   - Duration: 10s or 15s
   - Quality options: Standard, High
   - Best for: Professional content creation

4. **[Sora 2 Pro Image To Video](./sora-2-pro-image-to-video.md)**
   - High-quality video from images
   - Duration: 10s or 15s
   - Quality options: Standard, High
   - Best for: Premium animations from photos

5. **[Sora 2 Pro Storyboard](./sora-2-pro-storyboard.md)**
   - Multi-keyframe video generation
   - Duration: 10s, 15s, or 25s
   - Support for 2-8 keyframe images
   - Best for: Sequential storytelling and complex narratives

## Quick Start

### Authentication

All APIs require Bearer Token authentication:

```bash
Authorization: Bearer YOUR_API_KEY
```

Get your API key at: [https://kie.ai/api-key](https://kie.ai/api-key)

### Basic Workflow

1. **Create Task**
   ```bash
   POST https://api.kie.ai/api/v1/jobs/createTask
   ```

2. **Query Status**
   ```bash
   GET https://api.kie.ai/api/v1/jobs/recordInfo?taskId=YOUR_TASK_ID
   ```

### Example Request

```json
{
  "model": "sora-2-text-to-video",
  "input": {
    "prompt": "A beautiful sunset over the ocean",
    "aspect_ratio": "landscape",
    "n_frames": "10",
    "remove_watermark": true
  },
  "callBackUrl": "https://your-domain.com/api/callback"
}
```

## Model Comparison

| Feature | Standard | Pro | Storyboard |
|---------|----------|-----|------------|
| Duration | 10-15s | 10-15s | 10-25s |
| Quality Options | Standard | Standard/High | Standard |
| Input Type | Text or Image | Text or Image | Multiple Images |
| Best For | Quick generation | High quality | Complex narratives |
| Generation Time | 2-3 min | 2.5-4 min | 3-7 min |
| Max Keyframes | 1 | 1 | 8 |

## Common Parameters

### Aspect Ratio
- `portrait`: Vertical video format
- `landscape`: Horizontal video format

### Duration (n_frames)
- `10`: 10 seconds
- `15`: 15 seconds
- `25`: 25 seconds (Storyboard only)

### Quality (Pro models only)
- `standard`: Standard resolution
- `high`: Enhanced resolution and detail

### Watermark Removal
- `remove_watermark: true`: Remove watermarks (default)
- `remove_watermark: false`: Keep watermarks

## Error Handling

| Code | Description | Action |
|------|-------------|--------|
| 200 | Success | Process results |
| 400 | Invalid parameters | Check request format |
| 401 | Auth failed | Verify API key |
| 402 | Insufficient balance | Add credits |
| 422 | Validation failed | Review parameters |
| 429 | Rate limit | Implement backoff |
| 500 | Server error | Retry later |

## Best Practices

### Image Requirements
- **Format**: JPEG, PNG, WebP
- **Size**: Maximum 10MB per image
- **Resolution**: 1024x1024 or higher recommended
- **Accessibility**: Must be publicly accessible via HTTPS

### Prompt Guidelines
- **Length**: Up to 5000 characters (~800 words)
- **Specificity**: Be detailed and specific
- **Motion**: Describe desired movements clearly
- **Style**: Include style/mood descriptions

### Polling Strategy
- **Standard Models**: Poll every 10-15 seconds
- **Pro Models**: Poll every 15-20 seconds
- **Storyboard**: Poll every 20-30 seconds
- **Callbacks**: Recommended for production use

### Performance Optimization
1. Use callbacks instead of polling when possible
2. Implement exponential backoff for retries
3. Cache completed results to avoid duplicate requests
4. Monitor generation times and adjust timeouts accordingly

## Integration Examples

### With Webhook (Recommended)

```typescript
// Create task with callback
const response = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'sora-2-text-to-video',
    input: { /* your params */ },
    callBackUrl: 'https://your-domain.com/api/callback'
  })
});

// Handle callback in your webhook endpoint
app.post('/api/callback', (req, res) => {
  const { state, resultJson, failMsg } = req.body.data;

  if (state === 'success') {
    const { resultUrls } = JSON.parse(resultJson);
    // Process successful generation
  } else if (state === 'fail') {
    // Handle failure
  }

  res.status(200).send('OK');
});
```

### With Polling

```typescript
async function generateVideo(params) {
  // Create task
  const createResponse = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(params)
  });

  const { data: { taskId } } = await createResponse.json();

  // Poll for results
  while (true) {
    const statusResponse = await fetch(
      `https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`,
      {
        headers: { 'Authorization': `Bearer ${API_KEY}` }
      }
    );

    const { data } = await statusResponse.json();

    if (data.state === 'success') {
      const { resultUrls } = JSON.parse(data.resultJson);
      return resultUrls[0];
    } else if (data.state === 'fail') {
      throw new Error(data.failMsg);
    }

    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, 15000));
  }
}
```

## Support

- **API Documentation**: [https://kie.ai/docs](https://kie.ai/docs)
- **API Key Management**: [https://kie.ai/api-key](https://kie.ai/api-key)
- **Support Email**: support@kie.ai

## Changelog

### 2025-01
- Added Sora 2 Pro models with quality options
- Introduced Storyboard feature with multi-keyframe support
- Enhanced callback mechanism with complete parameter passing
- Improved error messaging and validation

---

**Last Updated**: January 2025
