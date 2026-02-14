# Veo 3.1 AI Video Generation API

> Create a new video generation task using the Veo3.1 AI model.

## Endpoint

```
POST /api/v1/veo/generate
```

**Base URL:** `https://api.kie.ai`

## Authentication

All APIs require authentication via Bearer Token.

**Get API Key:**
1. Visit [API Key Management Page](https://kie.ai/api-key) to get your API Key

**Usage:**
Add to request header:
```
Authorization: Bearer YOUR_API_KEY
```

## Request Body

**Content-Type:** `application/json`

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `prompt` | string | ✅ Yes | Text prompt describing the desired video content. Should be detailed and specific in describing video content. Can include actions, scenes, style and other information. For image-to-video, describe how you want the image to come alive. |
| `imageUrls` | string[] | No | Image URL list (used in image-to-video mode). Supports 1 or 2 images:<br>- **1 image**: The generated video will unfold around this image, with the image content presented dynamically<br>- **2 images**: The first image serves as the video's first frame, and the second image serves as the video's last frame, with the video transitioning between them<br>- Must be valid image URLs<br>- Images must be accessible to the API server |
| `model` | string | No | Select the model type to use:<br>- `veo3`: Veo 3.1 Quality, supports both text-to-video and image-to-video generation<br>- `veo3_fast`: Veo3.1 Fast generation model (default)<br><br>**Default:** `veo3_fast` |
| `generationType` | string | No | Video generation mode:<br>- `TEXT_2_VIDEO`: Text-to-video - Generate videos using only text prompts<br>- `FIRST_AND_LAST_FRAMES_2_VIDEO`: First and last frames to video - Flexible image-to-video generation mode (1 image: Generate video based on the provided image; 2 images: First image as first frame, second image as last frame, generating transition video)<br>- `REFERENCE_2_VIDEO`: Reference-to-video - Generate videos based on reference images, requires 1-3 images in imageUrls (minimum 1, maximum 3)<br><br>**Important Notes:**<br>- REFERENCE_2_VIDEO mode currently only supports veo3_fast model and 16:9 aspect ratio<br>- If not specified, the system will automatically determine the generation mode based on whether imageUrls are provided |
| `aspectRatio` | string | No | Video aspect ratio:<br>- `16:9`: Landscape video format, supports 1080P HD video generation (**Only 16:9 aspect ratio supports 1080P**)<br>- `9:16`: Portrait video format, suitable for mobile short videos<br>- `Auto`: Auto-detect<br><br>**Default:** `16:9` |
| `seeds` | integer | No | Random seed parameter to control the randomness of the generated content. Value range: 10000-99999. The same seed will generate similar video content, different seeds will generate different content. If not provided, the system will assign one automatically. |
| `callBackUrl` | string | No | Completion callback URL for receiving video generation status updates.<br>- Optional but recommended for production use<br>- System will POST task completion status to this URL when the video generation is completed<br>- Callback will include task results, video URLs, and status information<br>- Your callback endpoint should accept POST requests with JSON payload<br>- Alternatively, use the Get Video Details endpoint to poll task status |
| `enableFallback` | boolean | No | **DEPRECATED** - Enable fallback functionality. Default: `false`<br><br>**Note: This parameter is deprecated. The system has automatically optimized the content review mechanism without requiring manual fallback configuration.** |
| `enableTranslation` | boolean | No | Enable prompt translation to English. When set to true, the system will automatically translate prompts to English before video generation for better generation results.<br>- `true`: Enable translation (default)<br>- `false`: Disable translation<br><br>**Default:** `true` |
| `watermark` | string | No | Watermark text. If provided, a watermark will be added to the generated video. |

### Request Example

```json
{
  "prompt": "A dog playing in a park",
  "imageUrls": [
    "http://example.com/image1.jpg",
    "http://example.com/image2.jpg"
  ],
  "model": "veo3_fast",
  "watermark": "MyBrand",
  "callBackUrl": "http://your-callback-url.com/complete",
  "aspectRatio": "16:9",
  "seeds": 12345,
  "enableFallback": false,
  "enableTranslation": true,
  "generationType": "REFERENCE_2_VIDEO"
}
```

## Response

### Success Response (200)

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "taskId": "veo_task_abcdef123456"
  }
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `code` | integer | Response status code |
| `msg` | string | Response message |
| `data.taskId` | string | Task ID, can be used with Get Video Details endpoint to query task status |

### Error Codes

| Code | Description |
|------|-------------|
| `200` | Success - Request has been processed successfully |
| `400` | 1080P is processing. It should be ready in 1-2 minutes. Please check back shortly. |
| `401` | Unauthorized - Authentication credentials are missing or invalid |
| `402` | Insufficient Credits - Account does not have enough credits to perform the operation |
| `404` | Not Found - The requested resource or endpoint does not exist |
| `422` | Validation Error - Request parameters failed validation |
| `429` | Rate Limited - Request limit has been exceeded for this resource |
| `455` | Service Unavailable - System is currently undergoing maintenance |
| `500` | Server Error - An unexpected error occurred while processing the request |
| `501` | Generation Failed - Video generation task failed |
| `505` | Feature Disabled - The requested feature is currently disabled |

### Error Response Example

```json
{
  "code": 402,
  "msg": "Insufficient Credits"
}
```

## Notes

- Task ID can be used to query generation status via the Get Video Details endpoint
- For callback implementation details, see the [Callback Documentation](./generate-veo-3-video-callbacks)
- Only 16:9 aspect ratio supports 1080P HD video generation
- REFERENCE_2_VIDEO mode currently only supports veo3_fast model and 16:9 aspect ratio
