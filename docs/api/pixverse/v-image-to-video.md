# Image-to-Video generation

## OpenAPI Specification

```yaml
openapi: 3.0.1
info:
  title: ''
  description: ''
  version: 1.0.0
paths:
  /openapi/v2/video/img/generate:
    post:
      summary: Image-to-Video generation
      deprecated: false
      description: |
        Image-to-Video generation
      tags:
        - API Reference/Video Generation
        - OpenAPI 接口
      parameters:
        - name: API-KEY
          in: header
          description: API-KEY from PixVerse platform
          required: true
          example: your-api-key
          schema:
            type: string
        - name: Ai-trace-id
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
                duration:
                  description: |-
                    Video duration
                    v.3.5/v4/v4.5 : 5/8 (v3.5 1080p cannot use 8)
                    v5 : 5/8
                    v5.5 : 5/8/10 (1080p cannot use 10)
                  type: integer
                  examples:
                    - 5
                img_id:
                  type: integer
                  description: >-
                    Image ID from Upload image API. single image or single-image
                    templates
                  format: uint64
                img_ids:
                  type: array
                  items:
                    type: integer
                  description: >-
                    img_ids is only for multi-image templates. ex) "img_ids
                    ":[0,0]
                model:
                  description: Model version (now supports v3.5/v4/v4.5/v5/v5.5/v5.6)
                  type: string
                  examples:
                    - v3.5
                motion_mode:
                  description: >-
                    Motion mode (normal, fast, --fast only available when
                    duration=5; --quality=1080p does not support fast) , not
                    supports on v5 
                  type: string
                  default: normal
                  examples:
                    - normal
                negative_prompt:
                  description: Negative prompt
                  type: string
                  maxLength: 2048
                prompt:
                  description: Prompt
                  type: string
                  maxLength: 2048
                quality:
                  description: Video quality ("360p"(Turbo), "540p", "720p", "1080p")
                  type: string
                  examples:
                    - 540p
                seed:
                  description: 'Random seed, range: 0 - 2147483647'
                  type: integer
                style:
                  description: >-
                    Style (effective when model=v3.5, "anime", "3d_animation",
                    "clay", "comic", "cyberpunk") Do not include style parameter
                    unless needed
                  type: string
                  examples:
                    - anime
                template_id:
                  description: Template ID (template_id must be activated before use)
                  type: integer
                  examples:
                    - 302325299692608
                sound_effect_switch:
                  type: boolean
                  description: >-
                    Set to true if you want to enable this feature. Default is
                    false. (v3.5/v4/v4.5/v5)
                sound_effect_content:
                  type: string
                  description: >-
                    Sound effect content to generate. If not provided, a sound
                    effect will be automatically generated based on the video
                    content.(v3.5/v4/v4.5/v5)
                lip_sync_switch:
                  type: boolean
                  description: >-
                    Set to true if you want to enable this feature. Default is
                    false. (v3.5/v4/v4.5/v5)
                lip_sync_tts_content:
                  type: string
                  description: >-
                    ~140 (UTF-8) characters. If the generated audio exceeds the
                    video duration, it will be truncated. (v3.5/v4/v4.5/v5)
                lip_sync_tts_speaker_id:
                  type: string
                  description: id from Get speech tts list (v3.5/v4/v4.5/v5)
                generate_audio_switch:
                  type: boolean
                  description: >-
                    Only in v5.5/v5.6, Audio switch. Controls whether the video
                    has multiple clips or a single clip. **true**: Audio on ,
                    **false**: Audio off 
                generate_multi_clip_switch:
                  type: boolean
                  description: >-
                    Only in v5.5, Single or multi-clip switch. controls
                    single-clip and multi-clip generation modes. **true**:
                    Multi-clip , **false**: Single-clip 
                thinking_type:
                  type: string
                  description: >-
                    Only in v5.5, Prompt reasoning enhancement. Controls whether
                    the system should enhance your prompt with internal
                    reasoning and optimization. **"enabled"** : Turn on
                    system-level optimization. **"disabled"** : Turn off
                    system-level optimization. **"auto"** or **omitted**: Let
                    the model decide automatically
              x-apidog-refs: {}
              x-apidog-orders:
                - duration
                - img_id
                - img_ids
                - model
                - motion_mode
                - negative_prompt
                - prompt
                - quality
                - seed
                - style
                - template_id
                - sound_effect_switch
                - sound_effect_content
                - lip_sync_switch
                - lip_sync_tts_content
                - lip_sync_tts_speaker_id
                - generate_audio_switch
                - generate_multi_clip_switch
                - thinking_type
              required:
                - duration
                - img_id
                - model
                - prompt
                - quality
              x-apidog-ignore-properties: []
            example: |-
              {
                  "duration": 5,
                  "img_id": 0,
                  "model": "v4.5",
                  "motion_mode": "normal",
                  "negative_prompt": "string",
                  //"camera_movement": "zoom_in", //Use this field to apply camera movement if needed.
                  "prompt": "string",
                  "quality": "540p",
                  //"template_id": 302325299692608, //Use this field to apply template which you activated
                  //"sound_effect_switch":true,
                  //"sound_effect_content":"",
                  //"lip_sync_tts_switch":true,
                  //"lip_sync_tts_content":"",
                  //"lip_sync_tts_speaker_id":"",
                  "seed": 0
              }
      responses:
        '200':
          description: Token Expired
          content:
            application/json:
              schema:
                allOf:
                  - $ref: '#/components/schemas/controller.ResponseData'
          headers: {}
          x-apidog-name: OK
      security: []
      x-apidog-folder: API Reference/Video Generation
      x-apidog-status: released
      x-run-in-apidog: https://app.apidog.com/web/project/772214/apis/api-13016633-run
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
