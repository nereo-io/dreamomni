# Show HN: Veo3 AI Video Generator - 10+ Models for Text-to-Video & Image-to-Video (Kling, Luma, etc.)

Hey HN,

I'm excited to share the Veo3 AI Video Generator ([https://veo3ai.io](https://veo3ai.io)), a platform I've been building to make advanced AI video generation accessible and user-friendly. Our goal is to provide a unified interface for creating stunning videos from text prompts or existing images, leveraging a diverse suite of AI models.

**What it is:**

Veo3 AI Video Generator ([https://veo3ai.io](https://veo3ai.io)) is focused on empowering creators with powerful video synthesis tools. We currently support both text-to-video and image-to-video generation, integrating over 10 different AI models, including some of the latest and most capable ones like:

- Kuaishou's Kling (1.6 & 2.0 for high-quality results)
- Luma Labs' Dream Machine
- MiniMax (for both text-to-video and image-to-video)
- And others like Pixverse, Hunyuan, Mochi, and Haiper.

(Note: While our brand is Veo3 AI, we are continuously working on integrating various models, including upcoming ones. The current list reflects what's available now.)

We support features like multilingual interfaces (6 languages), user accounts, and a credit system with a free tier for trying things out.

**Tech Stack Highlights:**

- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS, Shadcn/ui
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: NextAuth.js 5.0
- **Video Generation**: FAL.AI for orchestrating the 10+ video models
- **Payments**: Stripe
- **File Storage**: AWS S3

**Why I built this:**

I've been fascinated by the rapid advancements in generative video. However, accessing and experimenting with these often means hopping between different services, each with its own interface and pricing. I wanted to create a single platform where users (developers, creators, or just AI enthusiasts) could easily access a wide range of top-tier AI video generation tools. The integration of Kling models was a particular focus, given their impressive text understanding and motion quality.

**Key Features:**

- **Diverse Video Generation**: Access 10+ models for text-to-video and image-to-video, catering to different styles and needs.
- **Text-to-Video**: Bring your written concepts to life.
- **Image-to-Video**: Animate your static images into dynamic videos.
- **Free Tier & Usage Credits**: Get started for free and explore the capabilities.
- **Multilingual**: UI available in English, Chinese, Japanese, Korean, French, and Traditional Chinese.
- **Modern Interface**: Built with a focus on usability and responsiveness.

**What's Next:**

- Activating our planned AI chat functionalities.
- Expanding our library of supported AI video models (including exploring direct Veo model integrations as they become available).
- Developing a public API for developers.
- Launching dedicated mobile apps.
- More fine-grained controls for video generation parameters.

**I'd love to get your feedback!**

- What do you think of the concept?
- Are there any specific AI models (chat or video) you'd like to see added?
- Any features you think would make it more useful for your projects or creative endeavors?

You can try it out at [https://veo3ai.io](https://veo3ai.io).

Thanks for checking it out!
