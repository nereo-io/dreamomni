# Sora 2 Pro Storyboard API Documentation

> Generate videos from multiple images (storyboard) using the Sora 2 Pro Storyboard model

## Overview

This document describes how to use the Sora 2 Pro Storyboard model for content generation. The Storyboard feature allows you to create longer videos by sequencing multiple images together. The process consists of two steps:
1. Create a generation task
2. Query task status and results

## Authentication

All API requests require a Bearer Token in the request header:

```
Authorization: Bearer YOUR_API_KEY
```

Get API Key:
1. Visit [API Key Management Page](https://kie.ai/api-key) to get your API Key
2. Add to request header: `Authorization: Bearer YOUR_API_KEY`

---

## 1. Create Generation Task

### API Information
- **URL**: `POST https://api.kie.ai/api/v1/jobs/createTask`
- **Content-Type**: `application/json`

### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| model | string | Yes | Model name, format: `sora-2-pro-storyboard` |
| input | object | Yes | Input parameters object |
| callBackUrl | string | No | Callback URL for task completion notifications |

### Model Parameter

The `model` parameter specifies which AI model to use for content generation.

| Property | Value | Description |
|----------|-------|-------------|
| **Format** | `sora-2-pro-storyboard` | The exact model identifier for this API |
| **Type** | string | Must be passed as a string value |
| **Required** | Yes | This parameter is mandatory for all requests |

> **Note**: The model parameter must match exactly as shown above. Different models have different capabilities and parameter requirements.

### Callback URL Parameter

The `callBackUrl` parameter allows you to receive automatic notifications when your task completes.

| Property | Value | Description |
|----------|-------|-------------|
| **Purpose** | Task completion notification | Receive real-time updates when your task finishes |
| **Method** | POST request | The system sends POST requests to your callback URL |
| **Timing** | When task completes | Notifications sent for both success and failure states |
| **Content** | Query Task API response | Callback content structure is identical to the Query Task API response |
| **Parameters** | Complete request data | The `param` field contains the complete Create Task request parameters, not just the input section |
| **Optional** | Yes | If not provided, no callback notifications will be sent |

**Important Notes:**
- The callback content structure is identical to the Query Task API response
- The `param` field contains the complete Create Task request parameters, not just the input section
- If `callBackUrl` is not provided, no callback notifications will be sent

### input Object Parameters

#### n_frames
- **Type**: `string`
- **Required**: Yes
- **Description**: Total duration of the video in seconds
- **Options**:
  - `10`: 10 seconds
  - `15`: 15 seconds
  - `25`: 25 seconds
- **Default Value**: `"15"`

#### image_urls
- **Type**: `array`
- **Required**: No (but recommended for storyboard functionality)
- **Description**: Array of image URLs to use as keyframes in the storyboard. Images will be sequenced in the order provided
- **Max File Size**: 10MB per image
- **Accepted File Types**: image/jpeg, image/png, image/webp
- **Multiple Files**: Yes (array format, supports multiple images)
- **Default Value**: `["https://file.aiquickdraw.com/custom-page/akr/section-images/1760776438785hyue5ogz.png"]`
- **Recommended**: 2-8 images for best results

#### aspect_ratio
- **Type**: `string`
- **Required**: No
- **Description**: This parameter defines the aspect ratio of the video
- **Options**:
  - `portrait`: Portrait (vertical video)
  - `landscape`: Landscape (horizontal video)
- **Default Value**: `"landscape"`

### Request Example

```json
{
  "model": "sora-2-pro-storyboard",
  "input": {
    "n_frames": "15",
    "image_urls": [
      "https://file.aiquickdraw.com/custom-page/akr/section-images/1760776438785hyue5ogz.png",
      "https://example.com/keyframe2.jpg",
      "https://example.com/keyframe3.jpg"
    ],
    "aspect_ratio": "landscape"
  },
  "callBackUrl": "https://your-domain.com/api/callback"
}
```

### Response Example

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "taskId": "281e5b0*********************f39b9"
  }
}
```

### Response Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| code | integer | Response status code, 200 indicates success |
| msg | string | Response message |
| data.taskId | string | Task ID for querying task status |

---

## 2. Query Task Status

### API Information
- **URL**: `GET https://api.kie.ai/api/v1/jobs/recordInfo`
- **Parameter**: `taskId` (passed via URL parameter)

### Request Example
```
GET https://api.kie.ai/api/v1/jobs/recordInfo?taskId=281e5b0*********************f39b9
```

### Response Example

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "taskId": "281e5b0*********************f39b9",
    "model": "sora-2-pro-storyboard",
    "state": "success",
    "param": "{\"model\":\"sora-2-pro-storyboard\",\"input\":{\"n_frames\":\"15\",\"image_urls\":[\"https://file.aiquickdraw.com/custom-page/akr/section-images/1760776438785hyue5ogz.png\"],\"aspect_ratio\":\"landscape\"}}",
    "resultJson": "{\"resultUrls\":[\"https://file.aiquickdraw.com/custom-page/akr/section-images/17607764967900u9630hr.mp4\"]}",
    "failCode": null,
    "failMsg": null,
    "costTime": 180000,
    "completeTime": 1757584344490,
    "createTime": 1757584164490
  }
}
```

### Response Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| code | integer | Response status code, 200 indicates success |
| msg | string | Response message |
| data.taskId | string | Task ID |
| data.model | string | Model name used |
| data.state | string | Task status: `waiting` (waiting), `success` (success), `fail` (failed) |
| data.param | string | Task parameters (JSON string) |
| data.resultJson | string | Task result (JSON string, available when task is success). Structure: `{resultUrls: []}` for video content |
| data.failCode | string | Failure code (available when task fails) |
| data.failMsg | string | Failure message (available when task fails) |
| data.costTime | integer | Task duration in milliseconds (available when task is success) |
| data.completeTime | integer | Completion timestamp (available when task is success) |
| data.createTime | integer | Creation timestamp |

---

## Usage Flow

1. **Create Task**: Call `POST https://api.kie.ai/api/v1/jobs/createTask` to create a generation task
2. **Get Task ID**: Extract `taskId` from the response
3. **Wait for Results**:
   - If you provided a `callBackUrl`, wait for the callback notification
   - If no `callBackUrl`, poll status by calling `GET https://api.kie.ai/api/v1/jobs/recordInfo`
4. **Get Results**: When `state` is `success`, extract generation results from `resultJson`

---

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Request successful |
| 400 | Invalid request parameters |
| 401 | Authentication failed, please check API Key |
| 402 | Insufficient account balance |
| 404 | Resource not found |
| 422 | Parameter validation failed |
| 429 | Request rate limit exceeded |
| 500 | Internal server error |

---

## Storyboard Feature Overview

### What is Storyboard Mode?

Storyboard mode allows you to create coherent videos by providing multiple keyframe images. The AI generates smooth transitions between these images, creating a seamless video narrative.

### Key Features

- **Multiple Keyframes**: Provide 2-8 images as keyframes
- **Automatic Transitions**: AI generates smooth transitions between images
- **Extended Duration**: Support for up to 25 seconds
- **Scene Continuity**: Maintains visual consistency across transitions
- **Flexible Pacing**: Duration automatically distributed across keyframes

### How It Works

1. **Keyframe Definition**: You provide multiple images as keyframes
2. **Temporal Sequencing**: Images are processed in the order provided
3. **Transition Generation**: AI creates smooth animations between consecutive frames
4. **Duration Distribution**: Total duration is distributed across all transitions
5. **Output Assembly**: All segments are seamlessly combined into a single video

---

## Implementation Notes

### Performance Considerations

- **Average Generation Time**: ~3-5 minutes for 15-second videos with 3-4 keyframes
- **Longer Videos**: 25-second videos may take 5-7 minutes
- **Keyframe Count Impact**: More keyframes increase processing time
- **Recommended Polling Interval**: 20-30 seconds when using polling instead of callbacks
- **Webhook Timeout**: Ensure your callback endpoint responds within 30 seconds

### Technical Specifications

- **Video Output Format**: MP4
- **Image Requirements**:
  - Must be publicly accessible via HTTPS
  - Maximum file size: 10MB per image
  - Supported formats: JPEG, PNG, WebP
  - Recommended resolution: 1024x1024 or higher

### Best Practices

#### Keyframe Selection

1. **Optimal Count**: 3-5 keyframes work best for most use cases
2. **Visual Consistency**: Use images with similar lighting and style
3. **Logical Progression**: Arrange images in a narrative sequence
4. **Aspect Ratio**: All images should have similar aspect ratios

#### Duration Selection

- **10 seconds**: Best for 2-3 keyframes
- **15 seconds**: Optimal for 3-5 keyframes
- **25 seconds**: Suitable for 5-8 keyframes

#### Quality Optimization

1. **High-Resolution Sources**: Use high-quality images for better results
2. **Consistent Style**: Maintain visual coherence across keyframes
3. **Clear Subjects**: Ensure main subjects are clearly visible
4. **Good Lighting**: Use well-lit images for best results

### Use Cases

- **Product Showcases**: Display products from multiple angles
- **Story Narratives**: Create visual stories with multiple scenes
- **Before/After**: Show transformations over time
- **Tutorial Sequences**: Step-by-step visual guides
- **Mood Boards**: Animate design concepts
- **Marketing Content**: Multi-scene promotional videos

### Limitations

- **Maximum Keyframes**: Recommended limit of 8 images
- **Transition Control**: Limited control over individual transition styles
- **Duration Limits**: Maximum 25 seconds per video
- **File Size**: 10MB per image limitation

### Advanced Tips

1. **Smooth Transitions**: Use images with similar composition for smoother transitions
2. **Subject Continuity**: Keep main subjects in similar positions across frames
3. **Color Harmony**: Match color palettes across keyframes
4. **Progressive Motion**: Design keyframes with logical movement progression
5. **Testing**: Start with 3 keyframes to understand transition quality before scaling up
