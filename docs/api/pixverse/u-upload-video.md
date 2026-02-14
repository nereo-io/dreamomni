# Upload Video&audio

## OpenAPI Specification

```yaml
openapi: 3.0.1
info:
  title: ''
  description: ''
  version: 1.0.0
paths:
  /openapi/v2/media/upload:
    post:
      summary: Upload Video&audio
      deprecated: false
      description: >+
        1. Supported mime-type

        "video/mp4":       "mp4", "video/mov":       "mov", "video/webm":     
        "webm", "video/quicktime": "mov"

        "audio/mpeg":     "mp3", "audio/wav":      "wav", "audio/vnd.wave":
        "wav", "audio/x-wav":    "wav", "audio/x-m4a":    "m4a",
        "audio/aac":      "aac", "audio/x-aac":    "aac", "audio/wave":    
        "wav", "audio/mp4":      "mp3"


        2. Video File Limits

        - File size: Up to 50MB

        - Length: Up to 30 seconds

        - Resolution: Up to 1920px width or height


        3. Audio File Limits

        - File size: Up to 50MB

        - Length: Up to 30 seconds

      tags:
        - API Reference
      parameters:
        - name: Ai-Trace-Id
          in: header
          description: 'traceID format: UUID, must be unique for each request'
          required: true
          example: '{{$string.uuid}}'
          schema:
            type: string
        - name: API-KEY
          in: header
          description: api-key from PixVerse platform
          required: true
          example: your-api-key
          schema:
            type: string
      requestBody:
        content:
          multipart/form-data:
            schema:
              type: object
              properties:
                file:
                  format: binary
                  type: string
                  description: Either file or file_url is required.
                  example: ''
                file_url:
                  description: >-
                    media file from url, Either file or file_url is required.
                    supported mime-type : "video/mp4":       "mp4",
                    "video/mov":       "mov", "video/webm":      "webm",
                    "video/quicktime": "mov"


                    "audio/mpeg":     "mp3", "audio/wav":      "wav",
                    "audio/vnd.wave": "wav", "audio/x-wav":    "wav",
                    "audio/x-m4a":    "m4a", "audio/aac":      "aac",
                    "audio/x-aac":    "aac", "audio/wave":     "wav",
                    "audio/mp4":      "mp3"
                  example: >-
                    https://media.pixverse.ai/openapi%2F90f96bd5-5b77-461c-9b8e-c0e40526c9ca.mp4
                  type: string
            examples: {}
      responses:
        '200':
          description: ''
          content:
            application/json:
              schema:
                type: object
                properties:
                  ErrCode:
                    type: integer
                  ErrMsg:
                    type: string
                  Resp:
                    type: object
                    properties:
                      media_id:
                        type: integer
                        description: 'ID of the uploaded media  '
                      media_type:
                        type: string
                        description: 'Type of the uploaded media file '
                      url:
                        type: string
                        description: URL of the uploaded resource
                    required:
                      - media_id
                      - media_type
                      - url
                    x-apidog-orders:
                      - media_id
                      - media_type
                      - url
                required:
                  - ErrCode
                  - ErrMsg
                  - Resp
                x-apidog-orders:
                  - ErrCode
                  - ErrMsg
                  - Resp
          headers: {}
          x-apidog-name: Success
      security: []
      x-apidog-folder: API Reference
      x-apidog-status: released
      x-run-in-apidog: https://app.apidog.com/web/project/772214/apis/api-19094401-run
components:
  schemas: {}
  securitySchemes: {}
servers:
  - url: https://app-api.pixverse.ai
    description: Prod Env
security: []

```
