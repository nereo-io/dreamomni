import type { Footer } from '@/types/blocks/footer';

export function buildGeminiOmniFooter(footer: Footer): Footer {
  return {
    ...footer,
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
            { title: 'Gemini Omni News', url: '/' },
            { title: 'API Status', url: '/#gemini-omni-status' },
            { title: 'KIE Support Monitor', url: '/#gemini-omni-updates' },
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
