# Get Image generation

## OpenAPI Specification

```yaml
openapi: 3.0.1
info:
  title: ''
  description: ''
  version: 1.0.0
paths:
  /openapi/v2/image/result/{image_id}:
    get:
      summary: Get Image generation
      deprecated: false
      description: ''
      tags:
        - API Reference/Image generation
      parameters:
        - name: image_id
          in: path
          description: ''
          required: true
          example: ''
          schema:
            type: string
        - name: Ai-trace-Id
          in: header
          description: ''
          required: true
          example: your-ai-trace-id
          schema:
            type: string
        - name: API-KEY
          in: header
          description: ''
          required: true
          example: your-api-key
          schema:
            type: string
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
                      image_id:
                        type: integer
                      prompt:
                        type: string
                      url:
                        type: string
                      seed:
                        type: integer
                      status:
                        type: integer
                      prompt_translate:
                        type: string
                      template_id:
                        type: integer
                      create_time:
                        type: string
                      modify_time:
                        type: string
                      outputWidth:
                        type: integer
                      outputHeight:
                        type: integer
                      credits:
                        type: integer
                      customer_paths:
                        type: object
                        properties:
                          ext_info:
                            type: 'null'
                          agent_info:
                            type: 'null'
                          cameo_id_list:
                            type: 'null'
                          duration_type:
                            type: string
                          fusion_id_list:
                            type: 'null'
                          model_evaluator:
                            type: string
                          customer_img_paths:
                            type: array
                            items:
                              type: string
                          gen_img_req_img_ids:
                            type: array
                            items:
                              type: integer
                        required:
                          - ext_info
                          - agent_info
                          - cameo_id_list
                          - duration_type
                          - fusion_id_list
                          - model_evaluator
                          - customer_img_paths
                          - gen_img_req_img_ids
                        x-apidog-orders:
                          - ext_info
                          - agent_info
                          - cameo_id_list
                          - duration_type
                          - fusion_id_list
                          - model_evaluator
                          - customer_img_paths
                          - gen_img_req_img_ids
                    required:
                      - image_id
                      - prompt
                      - url
                      - seed
                      - status
                      - prompt_translate
                      - template_id
                      - create_time
                      - modify_time
                      - outputWidth
                      - outputHeight
                      - credits
                      - customer_paths
                    x-apidog-orders:
                      - image_id
                      - prompt
                      - url
                      - seed
                      - status
                      - prompt_translate
                      - template_id
                      - create_time
                      - modify_time
                      - outputWidth
                      - outputHeight
                      - credits
                      - customer_paths
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
      x-apidog-folder: API Reference/Image generation
      x-apidog-status: released
      x-run-in-apidog: https://app.apidog.com/web/project/772214/apis/api-27565028-run
components:
  schemas: {}
  securitySchemes: {}
servers:
  - url: https://app-api.pixverse.ai
    description: Prod Env
security: []

```
