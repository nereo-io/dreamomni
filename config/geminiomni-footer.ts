import type { Footer } from '@/types/blocks/footer';
import type { Header } from '@/types/blocks/header';
import { defaultLocale } from '@/i18n/locale';
import { getGeminiOmniIntentLinks } from '@/config/geminiomni-landing';

const geminiOmniLogo = {
  src: '/logo.png',
  alt: 'GeminiOmni AI Video Generator',
};

const isVideoEffectsLink = (url?: string) => url === '/video-effects';

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
    nav: header.nav
      ? {
          ...header.nav,
          items: header.nav.items
            ?.filter((item) => !isVideoEffectsLink(item.url))
            .map((item) => ({
              ...item,
              children: item.children?.filter(
                (child) => !isVideoEffectsLink(child.url)
              ),
            })),
        }
      : header.nav,
  };
}

const footerCopy = {
  en: {
    description:
      'Create Gemini Omni-style AI videos online with text-to-video and image-to-video tools.',
    videoTools: 'Video Tools',
    imageTools: 'Image Tools',
    geminiOmni: 'Gemini Omni',
    resources: 'Resources',
    textToVideo: 'Text to Video',
    imageToVideo: 'Image to Video',
    referenceToVideo: 'Reference to Video',
    textToImage: 'Text to Image',
    imageToImage: 'Image to Image',
    aiVideoGenerator: 'AI Video Generator',
    pricing: 'Pricing',
    blog: 'Blog',
    privacyPolicy: 'Privacy Policy',
  },
  zh: {
    description: '使用文字转视频和图片转视频工具，在线创建 Gemini Omni 风格 AI 视频。',
    videoTools: '视频工具',
    imageTools: '图像工具',
    geminiOmni: 'Gemini Omni',
    resources: '资源',
    textToVideo: '文字转视频',
    imageToVideo: '图片转视频',
    referenceToVideo: '参考视频生成',
    textToImage: '文字转图像',
    imageToImage: '图像转图像',
    aiVideoGenerator: 'AI 视频生成器',
    pricing: '定价',
    blog: '博客',
    privacyPolicy: '隐私政策',
  },
  ja: {
    description: 'テキストから動画、画像から動画のツールで Gemini Omni 風 AI 動画をオンライン作成。',
    videoTools: '動画ツール',
    imageTools: '画像ツール',
    geminiOmni: 'Gemini Omni',
    resources: 'リソース',
    textToVideo: 'テキストから動画',
    imageToVideo: '画像から動画',
    referenceToVideo: '参照から動画',
    textToImage: 'テキストから画像',
    imageToImage: '画像から画像',
    aiVideoGenerator: 'AI 動画生成ツール',
    pricing: '価格',
    blog: 'ブログ',
    privacyPolicy: 'プライバシーポリシー',
  },
  ko: {
    description: '텍스트-비디오와 이미지-비디오 도구로 Gemini Omni 스타일 AI 비디오를 온라인에서 만드세요.',
    videoTools: '비디오 도구',
    imageTools: '이미지 도구',
    geminiOmni: 'Gemini Omni',
    resources: '리소스',
    textToVideo: '텍스트로 비디오 만들기',
    imageToVideo: '이미지로 비디오 만들기',
    referenceToVideo: '참조로 비디오 만들기',
    textToImage: '텍스트로 이미지 만들기',
    imageToImage: '이미지로 이미지 만들기',
    aiVideoGenerator: 'AI 비디오 생성기',
    pricing: '가격',
    blog: '블로그',
    privacyPolicy: '개인정보 처리방침',
  },
  de: {
    description: 'Erstelle Gemini-Omni-ähnliche KI-Videos online mit Text-zu-Video- und Bild-zu-Video-Tools.',
    videoTools: 'Video-Tools',
    imageTools: 'Bild-Tools',
    geminiOmni: 'Gemini Omni',
    resources: 'Ressourcen',
    textToVideo: 'Text zu Video',
    imageToVideo: 'Bild zu Video',
    referenceToVideo: 'Referenz zu Video',
    textToImage: 'Text zu Bild',
    imageToImage: 'Bild zu Bild',
    aiVideoGenerator: 'KI-Videogenerator',
    pricing: 'Preise',
    blog: 'Blog',
    privacyPolicy: 'Datenschutz',
  },
  fr: {
    description: 'Créez des vidéos IA de style Gemini Omni en ligne avec des outils texte vers vidéo et image vers vidéo.',
    videoTools: 'Outils vidéo',
    imageTools: 'Outils image',
    geminiOmni: 'Gemini Omni',
    resources: 'Ressources',
    textToVideo: 'Texte vers vidéo',
    imageToVideo: 'Image vers vidéo',
    referenceToVideo: 'Référence vers vidéo',
    textToImage: 'Texte vers image',
    imageToImage: 'Image vers image',
    aiVideoGenerator: 'Générateur vidéo IA',
    pricing: 'Tarifs',
    blog: 'Blog',
    privacyPolicy: 'Confidentialité',
  },
  es: {
    description: 'Crea videos IA estilo Gemini Omni online con herramientas de texto a video e imagen a video.',
    videoTools: 'Herramientas de video',
    imageTools: 'Herramientas de imagen',
    geminiOmni: 'Gemini Omni',
    resources: 'Recursos',
    textToVideo: 'Texto a video',
    imageToVideo: 'Imagen a video',
    referenceToVideo: 'Referencia a video',
    textToImage: 'Texto a imagen',
    imageToImage: 'Imagen a imagen',
    aiVideoGenerator: 'Generador de video IA',
    pricing: 'Precios',
    blog: 'Blog',
    privacyPolicy: 'Política de privacidad',
  },
  pt: {
    description: 'Crie vídeos IA no estilo Gemini Omni online com ferramentas de texto para vídeo e imagem para vídeo.',
    videoTools: 'Ferramentas de vídeo',
    imageTools: 'Ferramentas de imagem',
    geminiOmni: 'Gemini Omni',
    resources: 'Recursos',
    textToVideo: 'Texto para vídeo',
    imageToVideo: 'Imagem para vídeo',
    referenceToVideo: 'Referência para vídeo',
    textToImage: 'Texto para imagem',
    imageToImage: 'Imagem para imagem',
    aiVideoGenerator: 'Gerador de vídeo IA',
    pricing: 'Preços',
    blog: 'Blog',
    privacyPolicy: 'Política de privacidade',
  },
  ru: {
    description: 'Создавайте ИИ-видео в стиле Gemini Omni онлайн с инструментами текст-в-видео и изображение-в-видео.',
    videoTools: 'Инструменты видео',
    imageTools: 'Инструменты изображений',
    geminiOmni: 'Gemini Omni',
    resources: 'Ресурсы',
    textToVideo: 'Текст в видео',
    imageToVideo: 'Изображение в видео',
    referenceToVideo: 'Референс в видео',
    textToImage: 'Текст в изображение',
    imageToImage: 'Изображение в изображение',
    aiVideoGenerator: 'ИИ-видеогенератор',
    pricing: 'Цены',
    blog: 'Блог',
    privacyPolicy: 'Политика конфиденциальности',
  },
};

function getFooterCopy(locale: string) {
  return footerCopy[locale as keyof typeof footerCopy] || footerCopy[defaultLocale];
}

export function buildGeminiOmniFooter(footer: Footer, locale = defaultLocale): Footer {
  const copy = getFooterCopy(locale);
  const intentLinks = getGeminiOmniIntentLinks(locale);

  return {
    ...footer,
    brand: footer.brand
      ? {
          ...footer.brand,
          title: 'GeminiOmni',
          description: copy.description,
          logo: geminiOmniLogo,
        }
      : footer.brand,
    nav: {
      name: footer.nav?.name,
      items: [
        {
          title: copy.videoTools,
          children: [
            { title: copy.textToVideo, url: '/text-to-video' },
            { title: copy.imageToVideo, url: '/image-to-video' },
            { title: copy.referenceToVideo, url: '/reference-to-video' },
          ],
        },
        {
          title: copy.imageTools,
          children: [
            { title: copy.textToImage, url: '/text-to-image' },
            { title: copy.imageToImage, url: '/image-to-image' },
          ],
        },
        {
          title: copy.geminiOmni,
          children: [
            { title: copy.aiVideoGenerator, url: '/' },
            { title: copy.textToVideo, url: '/text-to-video' },
            { title: copy.imageToVideo, url: '/image-to-video' },
            ...intentLinks.map((item) => ({
              title: item.title,
              url: item.href,
            })),
          ],
        },
        {
          title: copy.resources,
          children: [
            { title: copy.pricing, url: '/pricing' },
            { title: copy.blog, url: '/blog' },
            { title: copy.privacyPolicy, url: '/privacy-policy' },
          ],
        },
      ],
    },
  };
}
