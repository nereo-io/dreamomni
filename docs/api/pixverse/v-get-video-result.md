# Get Video Generation Status

## OpenAPI Specification

```yaml
openapi: 3.0.1
info:
  title: ''
  description: ''
  version: 1.0.0
paths:
  /openapi/v2/video/result/{id}:
    get:
      summary: Get Video Generation Status
      deprecated: false
      description: >-
        1: Generation successful; 5: Generating; 7: Contents moderation failed;
        8: Generation failed;
      tags:
        - API Reference/Video Generation
        - OpenAPI 接口
      parameters:
        - name: id
          in: path
          description: video_id from generation task
          required: true
          example: 0
          schema:
            type: integer
        - name: API-KEY
          in: header
          description: api-key from PixVerse platform
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
      responses:
        '200':
          description: Success
          content:
            application/json:
              schema:
                allOf:
                  - type: object
                    x-apidog-refs:
                      01JP7G5G4C0NX4J4BE6SSFXZC0:
                        $ref: '#/components/schemas/controller.ResponseData'
                        x-apidog-overrides:
                          Resp: &ref_0
                            $ref: '#/components/schemas/dto.GetOpenapiMediaDetailResp'
                        required: []
                    x-apidog-orders:
                      - 01JP7G5G4C0NX4J4BE6SSFXZC0
                    properties:
                      ErrCode:
                        type: integer
                      ErrMsg:
                        type: string
                      Resp: *ref_0
                    x-apidog-ignore-properties:
                      - ErrCode
                      - ErrMsg
                      - Resp
          headers: {}
          x-apidog-name: OK
      security: []
      x-apidog-folder: API Reference/Video Generation
      x-apidog-status: released
      x-run-in-apidog: https://app.apidog.com/web/project/772214/apis/api-13016632-run
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
    dto.GetOpenapiMediaDetailResp:
      type: object
      properties:
        create_time:
          description: create_time
          type: string
        id:
          type: integer
          description: video_id
        modify_time:
          description: update_time
          type: string
        negative_prompt:
          description: negative Prompt
          type: string
        outputHeight:
          description: height of video
          type: integer
        outputWidth:
          description: width of video
          type: integer
        prompt:
          description: prompt
          type: string
        resolution_ratio:
          description: video_quality
          type: integer
        seed:
          description: seed
          type: integer
        size:
          description: video size
          type: integer
        status:
          description: >-
            video status: Generation succesful = 1; Generating=5; Deleted = 6;
            Contents moderation failed = 7; Generation failed= 8;
          type: integer
        style:
          description: style
          type: string
        url:
          description: video result
          type: string
      x-apidog-orders:
        - create_time
        - id
        - modify_time
        - negative_prompt
        - outputHeight
        - outputWidth
        - prompt
        - resolution_ratio
        - seed
        - size
        - status
        - style
        - url
      x-apidog-ignore-properties: []
      x-apidog-folder: ''
  securitySchemes: {}
servers:
  - url: https://app-api.pixverse.ai
    description: Prod Env
security: []

```
