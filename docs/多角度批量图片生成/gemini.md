# Gemini 3.0 Pro - OpenAI SDK - Quick Start

> - Call Gemini-2.5-pro model using OpenAI SDK format

- Synchronous processing mode, returns conversation content in real-time
- Minimal parameters for quick start
- 💡 Need more features? Check [Full API Reference](./openai-sdk-reference)

## OpenAPI

````yaml en/api-manual/language-series/gemini-3.0-pro/openai-sdk/openai-sdk-quickstart.json post /v1/chat/completions
paths:
  path: /v1/chat/completions
  method: post
  servers:
    - url: https://api.evolink.ai
      description: Production environment
  request:
    security:
      - title: bearerAuth
        parameters:
          query: {}
          header:
            Authorization:
              type: http
              scheme: bearer
              description: >-
                ##All APIs require Bearer Token authentication##


                **Get API Key:**


                Visit [API Key Management
                Page](https://evolink.ai/dashboard/keys) to get your API Key


                **Add to request header:**

                ```

                Authorization: Bearer YOUR_API_KEY

                ```
          cookie: {}
    parameters:
      path: {}
      query: {}
      header: {}
      cookie: {}
    body:
      application/json:
        schemaArray:
          - type: object
            properties:
              model:
                allOf:
                  - type: string
                    description: Chat model name
                    enum:
                      - gemini-3-pro-preview
                    default: gemini-3-pro-preview
                    example: gemini-3-pro-preview
              messages:
                allOf:
                  - type: array
                    description: List of chat messages
                    items:
                      $ref: "#/components/schemas/MessageSimple"
                    minItems: 1
                    example:
                      - role: user
                        content: Hello, introduce yourself
            required: true
            refIdentifier: "#/components/schemas/ChatCompletionQuickRequest"
            requiredProperties:
              - model
              - messages
        examples:
          example:
            value:
              model: gemini-3-pro-preview
              messages:
                - role: user
                  content: Hello, introduce yourself
  response:
    "200":
      application/json:
        schemaArray:
          - type: object
            properties:
              id:
                allOf:
                  - type: string
                    description: Unique identifier for the chat completion
                    example: chatcmpl-20251010015944503180122WJNB8Eid
              model:
                allOf:
                  - type: string
                    description: Model name actually used
                    example: gemini-3-pro-preview
              object:
                allOf:
                  - type: string
                    enum:
                      - chat.completion
                    description: Response type
                    example: chat.completion
              created:
                allOf:
                  - type: integer
                    description: Creation timestamp
                    example: 1760032810
              choices:
                allOf:
                  - type: array
                    description: List of chat completion choices
                    items:
                      $ref: "#/components/schemas/Choice"
              usage:
                allOf:
                  - $ref: "#/components/schemas/Usage"
            refIdentifier: "#/components/schemas/ChatCompletionResponse"
        examples:
          example:
            value:
              id: chatcmpl-20251010015944503180122WJNB8Eid
              model: gemini-3-pro-preview
              object: chat.completion
              created: 1760032810
              choices:
                - index: 0
                  message:
                    role: assistant
                    content: >-
                      Note: This is sample code!


                      Hello! I'm pleased to introduce myself.


                      I'm a Large Language Model, trained and developed by
                      Google...
                  finish_reason: stop
              usage:
                prompt_tokens: 13
                completion_tokens: 1891
                total_tokens: 1904
                prompt_tokens_details:
                  cached_tokens: 0
                  text_tokens: 13
                  audio_tokens: 0
                  image_tokens: 0
                completion_tokens_details:
                  text_tokens: 0
                  audio_tokens: 0
                  reasoning_tokens: 1480
                input_tokens: 0
                output_tokens: 0
                input_tokens_details: null
        description: Chat completion generated successfully
    "400":
      application/json:
        schemaArray:
          - type: object
            properties:
              error:
                allOf:
                  - &ref_0
                    type: object
                    properties:
                      code:
                        type: integer
                        description: HTTP status error code
                      message:
                        type: string
                        description: Error description
                      type:
                        type: string
                        description: Error type
                      param:
                        type: string
                        description: Related parameter name
                      fallback_suggestion:
                        type: string
                        description: Suggestion when error occurs
            refIdentifier: "#/components/schemas/ErrorResponse"
        examples:
          example:
            value:
              error:
                code: 400
                message: Invalid request parameters
                type: invalid_request_error
        description: Invalid request parameters
    "401":
      application/json:
        schemaArray:
          - type: object
            properties:
              error:
                allOf:
                  - *ref_0
            refIdentifier: "#/components/schemas/ErrorResponse"
        examples:
          example:
            value:
              error:
                code: 401
                message: Invalid or expired token
                type: authentication_error
        description: Unauthorized, invalid or expired token
    "402":
      application/json:
        schemaArray:
          - type: object
            properties:
              error:
                allOf:
                  - *ref_0
            refIdentifier: "#/components/schemas/ErrorResponse"
        examples:
          example:
            value:
              error:
                code: 402
                message: Insufficient quota
                type: insufficient_quota_error
                fallback_suggestion: https://evolink.ai/dashboard/billing
        description: Insufficient quota, recharge required
    "403":
      application/json:
        schemaArray:
          - type: object
            properties:
              error:
                allOf:
                  - *ref_0
            refIdentifier: "#/components/schemas/ErrorResponse"
        examples:
          example:
            value:
              error:
                code: 403
                message: Access denied for this model
                type: permission_error
                param: model
        description: Access denied
    "404":
      application/json:
        schemaArray:
          - type: object
            properties:
              error:
                allOf:
                  - *ref_0
            refIdentifier: "#/components/schemas/ErrorResponse"
        examples:
          example:
            value:
              error:
                code: 404
                message: Specified model not found
                type: not_found_error
                param: model
                fallback_suggestion: gemini-3-pro-preview
        description: Resource not found
    "429":
      application/json:
        schemaArray:
          - type: object
            properties:
              error:
                allOf:
                  - *ref_0
            refIdentifier: "#/components/schemas/ErrorResponse"
        examples:
          example:
            value:
              error:
                code: 429
                message: Rate limit exceeded
                type: rate_limit_error
                fallback_suggestion: retry after 60 seconds
        description: Rate limit exceeded
    "500":
      application/json:
        schemaArray:
          - type: object
            properties:
              error:
                allOf:
                  - *ref_0
            refIdentifier: "#/components/schemas/ErrorResponse"
        examples:
          example:
            value:
              error:
                code: 500
                message: Internal server error
                type: internal_server_error
                fallback_suggestion: try again later
        description: Internal server error
    "502":
      application/json:
        schemaArray:
          - type: object
            properties:
              error:
                allOf:
                  - *ref_0
            refIdentifier: "#/components/schemas/ErrorResponse"
        examples:
          example:
            value:
              error:
                code: 502
                message: Upstream AI service unavailable
                type: upstream_error
                fallback_suggestion: try different model
        description: Upstream service error
    "503":
      application/json:
        schemaArray:
          - type: object
            properties:
              error:
                allOf:
                  - *ref_0
            refIdentifier: "#/components/schemas/ErrorResponse"
        examples:
          example:
            value:
              error:
                code: 503
                message: Service temporarily unavailable
                type: service_unavailable_error
                fallback_suggestion: retry after 30 seconds
        description: Service temporarily unavailable
  deprecated: false
  type: path
components:
  schemas:
    MessageSimple:
      type: object
      required:
        - role
        - content
      properties:
        role:
          type: string
          description: Message role
          enum:
            - user
        content:
          type: string
          description: Message content (plain text)
    Choice:
      type: object
      properties:
        index:
          type: integer
          description: Choice index
          example: 0
        message:
          $ref: "#/components/schemas/AssistantMessage"
        finish_reason:
          type: string
          description: Finish reason
          enum:
            - stop
            - length
            - content_filter
          example: stop
    AssistantMessage:
      type: object
      properties:
        role:
          type: string
          description: Message sender role
          enum:
            - assistant
          example: assistant
        content:
          type: string
          description: AI response message content
          example: |-
            Note: This is sample code!

            Hello! I'm pleased to introduce myself.

            I'm a Large Language Model, trained and developed by Google...
    Usage:
      type: object
      description: Token usage statistics
      properties:
        prompt_tokens:
          type: integer
          description: Number of tokens in input content
          example: 13
        completion_tokens:
          type: integer
          description: Number of tokens in output content
          example: 1891
        total_tokens:
          type: integer
          description: Total number of tokens
          example: 1904
        prompt_tokens_details:
          type: object
          description: Detailed input token information
          properties:
            cached_tokens:
              type: integer
              description: Number of cached tokens hit
              example: 0
            text_tokens:
              type: integer
              description: Number of text tokens
              example: 13
            audio_tokens:
              type: integer
              description: Number of audio tokens
              example: 0
            image_tokens:
              type: integer
              description: Number of image tokens
              example: 0
        completion_tokens_details:
          type: object
          description: Detailed output token information
          properties:
            text_tokens:
              type: integer
              description: Number of text tokens
              example: 0
            audio_tokens:
              type: integer
              description: Number of audio tokens
              example: 0
            reasoning_tokens:
              type: integer
              description: Number of reasoning tokens
              example: 1480
        input_tokens:
          type: integer
          description: Number of input tokens (compatibility field)
          example: 0
        output_tokens:
          type: integer
          description: Number of output tokens (compatibility field)
          example: 0
        input_tokens_details:
          type: object
          nullable: true
          description: Detailed input token information (compatibility field)
          example: null
````

---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://docs.evolink.ai/llms.txt
