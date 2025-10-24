# Sora 2 Pro Text To Video API Documentation

> Generate high-quality videos from text prompts using the Sora 2 Pro Text To Video model

## Overview

This document describes how to use the Sora 2 Pro Text To Video model for content generation. The process consists of two steps:
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
| model | string | Yes | Model name, format: `sora-2-pro-text-to-video` |
| input | object | Yes | Input parameters object |
| callBackUrl | string | No | Callback URL for task completion notifications |

### Model Parameter

The `model` parameter specifies which AI model to use for content generation.

| Property | Value | Description |
|----------|-------|-------------|
| **Format** | `sora-2-pro-text-to-video` | The exact model identifier for this API |
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

#### prompt
- **Type**: `string`
- **Required**: Yes
- **Description**: The text prompt describing the desired video content and motion
- **Max Length**: 5000 characters
- **Default Value**: `"a happy dog running in the garden"`

#### aspect_ratio
- **Type**: `string`
- **Required**: No
- **Description**: This parameter defines the aspect ratio of the video
- **Options**:
  - `portrait`: Portrait (vertical video)
  - `landscape`: Landscape (horizontal video)
- **Default Value**: `"landscape"`

#### n_frames
- **Type**: `string`
- **Required**: No
- **Description**: The duration of the video in seconds
- **Options**:
  - `10`: 10 seconds
  - `15`: 15 seconds
- **Default Value**: `"10"`

#### size
- **Type**: `string`
- **Required**: No
- **Description**: The quality or resolution of the generated video
- **Options**:
  - `standard`: Standard quality
  - `high`: High quality (better resolution and detail)
- **Default Value**: `"high"`

#### remove_watermark
- **Type**: `boolean`
- **Required**: No
- **Description**: When enabled, removes watermarks from the generated video
- **Default Value**: `true`

### Request Example

```json
{
  "model": "sora-2-pro-text-to-video",
  "input": {
    "prompt": "a happy dog running in the garden",
    "aspect_ratio": "landscape",
    "n_frames": "10",
    "size": "high",
    "remove_watermark": true
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
    "model": "sora-2-pro-text-to-video",
    "state": "success",
    "param": "{\"model\":\"sora-2-pro-text-to-video\",\"input\":{\"prompt\":\"a happy dog running in the garden\",\"aspect_ratio\":\"landscape\",\"n_frames\":\"10\",\"size\":\"high\",\"remove_watermark\":true}}",
    "resultJson": "{\"resultUrls\":[\"https://file.aiquickdraw.com/custom-page/akr/section-images/1760182741759dipnk388.mp4\"]}",
    "failCode": null,
    "failMsg": null,
    "costTime": 145000,
    "completeTime": 1757584309490,
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

## Differences from Standard Sora 2

### Enhanced Features
- **Higher Resolution**: Pro version produces higher quality output
- **Size Parameter**: Additional `size` parameter allows selection between standard and high quality
- **Better Detail**: Improved rendering of complex scenes and fine details
- **Enhanced Consistency**: Better temporal coherence across frames

### Performance Considerations
- **Generation Time**: Pro version may take 20-30% longer than standard Sora 2
- **Cost**: Higher credit consumption due to enhanced quality
- **File Size**: High quality outputs produce larger file sizes

### Recommended Use Cases
- **Professional Content**: Marketing videos, product demos
- **High-Quality Productions**: Content requiring maximum detail and clarity
- **Detailed Scenes**: Complex environments with many elements
- **Close-ups**: Scenes requiring fine detail preservation

---

## Implementation Notes

- **Average Generation Time**: ~2.5-4 minutes for 10-second high-quality videos
- **Recommended Polling Interval**: 15-20 seconds when using polling instead of callbacks
- **Webhook Timeout**: Ensure your callback endpoint responds within 30 seconds
- **Video Output Format**: MP4
- **Maximum Prompt Length**: 5000 characters (approximately 800 words)
- **Quality vs Speed**: Use `size: "standard"` for faster generation, `size: "high"` for maximum quality
