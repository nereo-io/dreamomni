import type { Footer } from '@/types/blocks/footer';
import type { Header } from '@/types/blocks/header';

const geminiOmniLogo = {
  src: '/logo.png',
  alt: 'GeminiOmni AI Video Generator',
};

export function buildGeminiOmniHeader(header: Header): Header {
  return {
    ...header,
    brand: header.brand
      ? {
          ...header.brand,
          title: 'GeminiOmni',
          logo: geminiOmniLogo,
          url: header.brand.url || '/',
        }
      : header.brand,
  };
}

export function buildGeminiOmniFooter(footer: Footer): Footer {
  return {
    ...footer,
    brand: footer.brand
      ? {
          ...footer.brand,
          title: 'GeminiOmni',
          description:
            'Create Gemini Omni-style AI videos online with text-to-video and image-to-video tools.',
          logo: geminiOmniLogo,
        }
      : footer.brand,
    nav: {
      name: footer.nav?.name,
      items: [
        {
          title: 'Video Tools',
          children: [
            { title: 'Text to Video', url: '/text-to-video' },
            { title: 'Image to Video', url: '/image-to-video' },
            { title: 'Reference to Video', url: '/reference-to-video' },
          ],
        },
        {
          title: 'Image Tools',
          children: [
            { title: 'Text to Image', url: '/text-to-image' },
            { title: 'Image to Image', url: '/image-to-image' },
          ],
        },
        {
          title: 'Gemini Omni',
          children: [
            { title: 'AI Video Generator', url: '/' },
            { title: 'Text to Video', url: '/text-to-video' },
            { title: 'Image to Video', url: '/image-to-video' },
          ],
        },
        {
          title: 'Resources',
          children: [
            { title: 'Pricing', url: '/pricing' },
            { title: 'Blog', url: '/blog' },
            { title: 'Privacy Policy', url: '/privacy-policy' },
          ],
        },
      ],
    },
  };
}
