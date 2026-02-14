# Transition(First-last frame) generation

## OpenAPI Specification

```yaml
openapi: 3.0.1
info:
  title: ''
  description: ''
  version: 1.0.0
paths:
  /openapi/v2/video/transition/generate:
    post:
      summary: Transition(First-last frame) generation
      deprecated: false
      description: Transition(First-last frame) generation
      tags:
        - API Reference/Video Generation
      parameters:
        - name: API-KEY
          in: header
          description: api-key from PixVerse platform
          required: true
          example: your-api-key
          schema:
            type: string
        - name: Ai-Trace-Id
          in: header
          description: 'traceID format: UUID, must be unique for each request'
          required: true
          example: '{{$string.uuid}}'
          schema:
            type: string
        - name: Content-Type
          in: header
          description: ''
          required: true
          example: application/json
          schema:
            type: string
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                prompt:
                  type: string
                  description: Prompt
                model:
                  type: string
                  description: Model version (now supports v3.5/v4/v4.5/v5/v5.5/v5.6)
                duration:
                  type: integer
                  description: |-
                    Video duration
                    v.3.5/v4/v4.5 : 5/8 (v3.5 1080p cannot use 8)
                    v5 : 5/8
                    v5.5 : 5/8/10 (1080p cannot use 10)
                quality:
                  type: string
                  description: Video quality ("360p"(Turbo), "540p", "720p", "1080p")
                motion_mode:
                  type: string
                  description: >-
                    Motion mode (normal, fast, --fast only available when
                    duration=5; --quality=1080p does not support fast) , not
                    supports on v5 
                seed:
                  type: integer
                  description: 'Random seed, range: 0 - 2147483647'
                first_frame_img:
                  type: integer
                  description: Image ID from Upload image API
                last_frame_img:
                  type: integer
                  description: Image ID from Upload image API
                sound_effect_switch:
                  type: string
                  description: >-
                    Set to true if you want to enable this feature. Default is
                    false. (v3.5/v4/v4.5/v5)
                sound_effect_content:
                  type: string
                  description: >-
                    Sound effect content to generate. If not provided, a sound
                    effect will be automatically generated based on the video
                    content. (v3.5/v4/v4.5/v5)
                lip_sync_switch:
                  type: string
                  description: >-
                    Set to true if you want to enable this feature. Default is
                    false.(v3.5/v4/v4.5/v5)
                lip_sync_tts_content:
                  type: string
                  description: |
                    ~140 (UTF-8) characters (v3.5/v4/v4.5/v5)
                lip_sync_tts_speaker_id:
                  type: string
                  description: 'id from Get speech tts list '
                generate_audio_switch:
                  type: boolean
                  description: >-
                    Only in v5.5, Audio switch. Controls whether the video has
                    multiple clips or a single clip. **true**: Audio on ,
                    **false**: Audio off 
              required:
                - prompt
                - model
                - duration
                - quality
                - first_frame_img
                - last_frame_img
              x-apidog-orders:
                - prompt
                - model
                - duration
                - quality
                - motion_mode
                - seed
                - first_frame_img
                - last_frame_img
                - sound_effect_switch
                - sound_effect_content
                - lip_sync_switch
                - lip_sync_tts_content
                - lip_sync_tts_speaker_id
                - generate_audio_switch
              x-apidog-ignore-properties: []
            example: |-
              {
                  "prompt": "transform into a puppy",
                  "model": "v5",
                  "duration": 5,
                  "quality": "540p",
                  //"motion_mode": "normal",
                  "first_frame_img": 0,
                  "last_frame_img": 0,
                  //"sound_effect_switch":true,
                  //"sound_effect_content":"",
                  //"lip_sync_tts_switch":true,
                  //"lip_sync_tts_content":"",
                  //"lip_sync_tts_speaker_id":"",
                  "seed": 0
              }
      responses:
        '200':
          description: ''
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/controller.ResponseData'
          headers: {}
          x-apidog-name: Success
      security: []
      x-apidog-folder: API Reference/Video Generation
      x-apidog-status: released
      x-run-in-apidog: https://app.apidog.com/web/project/772214/apis/api-15123014-run
components:
  schemas:
    controller.ResponseData:
      type: object
      properties:
        ErrCode:
          type: integer
        ErrMsg:
          type: string
        Resp:
          $ref: '#/components/schemas/dto.V2OpenAPII2VResp'
      x-apidog-orders:
        - ErrCode
        - ErrMsg
        - Resp
      x-apidog-ignore-properties: []
      x-apidog-folder: ''
    dto.V2OpenAPII2VResp:
      type: object
      properties:
        video_id:
          description: Video_id
          type: integer
      x-apidog-orders:
        - video_id
      x-apidog-ignore-properties: []
      x-apidog-folder: ''
  securitySchemes: {}
servers:
  - url: https://app-api.pixverse.ai
    description: Prod Env
security: []

```
