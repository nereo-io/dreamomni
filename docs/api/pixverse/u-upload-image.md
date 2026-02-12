# Upload Image

## OpenAPI Specification

```yaml
openapi: 3.0.1
info:
  title: ''
  description: ''
  version: 1.0.0
paths:
  /openapi/v2/image/upload:
    post:
      summary: Upload Image
      deprecated: false
      description: >-
        Uploads an image to the server. 

        Image requirements

        1. maximum dimensions 10000 pixels

        2. file size less than 20MB

        3. Supported formats: "png", "webp", "jpeg", "jpg" . supported mime-type
        "image/jpeg","image/jpg","image/png","image/webp"
      tags:
        - API Reference
        - OpenAPI 接口
      parameters:
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
      requestBody:
        content:
          multipart/form-data:
            schema:
              type: object
              properties:
                image:
                  format: binary
                  type: string
                  description: Either image or image_url is required.
                  example: ''
                image_url:
                  description: >-
                    image file from url, application/octet-stream is not
                    supported.Either image or image_url is required. supported
                    mime-type "image/jpeg","image/jpg","image/png","image/webp"
                  example: >-
                    https://media.pixverse.ai/openapi%2Ff4c512d1-0110-4360-8515-d84d788ca8d1test_image_auto.jpg
                  type: string
            examples: {}
      responses:
        '200':
          description: Success
          content:
            application/json:
              schema:
                allOf:
                  - type: object
                    x-apidog-refs:
                      01JP7G4DBABJC41Q5GF009NQ58:
                        $ref: '#/components/schemas/controller.ResponseData'
                        x-apidog-overrides:
                          Resp: &ref_0
                            $ref: '#/components/schemas/dto.UploadImgResp'
                        required: []
                    x-apidog-orders:
                      - 01JP7G4DBABJC41Q5GF009NQ58
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
        '500':
          description: 审核不通过
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/dto.ResponseData500'
          headers: {}
          x-apidog-name: Server Error
      security: []
      x-apidog-folder: API Reference
      x-apidog-status: released
      x-run-in-apidog: https://app.apidog.com/web/project/772214/apis/api-13016631-run
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
    dto.UploadImgResp:
      type: object
      properties:
        img_id:
          type: integer
        img_url:
          type: string
      x-apidog-orders:
        - img_id
        - img_url
      x-apidog-ignore-properties: []
      x-apidog-folder: ''
    dto.ResponseData500:
      type: object
      properties:
        err_code:
          type: integer
          examples:
            - 500052
        err_msg:
          type: string
          examples:
            - 图片未过审，疑含敏感内容，请修改后重试。
        resp:
          type: string
      x-apidog-orders:
        - err_code
        - err_msg
        - resp
      x-apidog-ignore-properties: []
      x-apidog-folder: ''
  securitySchemes: {}
servers:
  - url: https://app-api.pixverse.ai
    description: Prod Env
security: []

```
