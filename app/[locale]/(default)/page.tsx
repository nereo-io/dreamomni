import Link from 'next/link';
import type React from 'react';
import {
  ArrowRight,
  Camera,
  Download,
  Film,
  ImageIcon,
  Images,
  Layers3,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  Wand2,
} from 'lucide-react';
import HoverPlayVideo from '@/components/blocks/hover-play-video';
import OmniVideoHero from '@/components/blocks/omni-video-hero';
import CTA from '@/components/blocks/cta';
import AuthRedirect from '@/components/auth/auth-redirect';
import StructuredData from '@/components/seo/structured-data';
import { Button } from '@/components/ui/button';
import {
  getGeminiOmniIntentLinks,
  getGeminiOmniLandingCopy,
} from '@/config/geminiomni-landing';
import { defaultLocale, locales } from '@/i18n/locale';

export const revalidate = 3600;

const exampleVideos = [
  'https://r2.seedance.tv/showcase/gemini-omni/hero.webm',
  'https://r2.seedance.tv/showcase/gemini-omni/fern-harp.webm',
  'https://r2.seedance.tv/showcase/gemini-omni/puppet-transform.webm',
  'https://r2.seedance.tv/showcase/gemini-omni/marble-physics.webm',
];

const featureVideoSources = [
  'https://r2.seedance.tv/showcase/gemini-omni/zoom-action.webm',
  'https://r2.seedance.tv/showcase/gemini-omni/protein-folding.webm',
  'https://r2.seedance.tv/showcase/gemini-omni/alphabet-sync.webm',
  'https://r2.seedance.tv/showcase/gemini-omni/text-sync.webm',
];

const productUseCaseSources = [
  'https://r2.seedance.tv/showcase/gemini-omni/sailor-combine.webm',
  'https://r2.seedance.tv/showcase/gemini-omni/crystal-rose.webm',
  'https://r2.seedance.tv/showcase/gemini-omni/anime-swap.webm',
  'https://r2.seedance.tv/showcase/gemini-omni/fish-drawing.webm',
];

type LocalizedCard = {
  title: string;
  description: string;
};

type LocalizedPromptTip = LocalizedCard & {
  label: string;
};

type HomePageSectionCopy = {
  examples: {
    title: string;
    description: string;
    cta: string;
    ariaLabel: string;
  };
  features: {
    title: string;
    description: string;
    videos: LocalizedCard[];
  };
  productUseCases: LocalizedCard[];
  promptTips: {
    title: string;
    items: LocalizedPromptTip[];
  };
  reasons: {
    title: string;
    description: string;
    items: LocalizedCard[];
  };
};

const homePageSectionCopy: Record<string, HomePageSectionCopy> = {
  en: {
    examples: {
      title: 'Gemini Omni video examples',
      description: 'Explore sample clips, then create your own.',
      cta: 'Start creating',
      ariaLabel: 'Gemini Omni sample video',
    },
    features: {
      title: 'Key features of the Gemini Omni AI video generator',
      description:
        'The page now borrows the SEO depth of model overview pages while staying focused on creators: prompts, images, natural-language iteration, examples, history, and downloads.',
      videos: [
        {
          title: 'Text prompts become cinematic scenes',
          description:
            'Describe the subject, action, camera move, lighting, and mood. GeminiOmni helps turn that creative brief into a watchable AI video draft.',
        },
        {
          title: 'Images guide identity and style',
          description:
            'Use a product shot, character image, artwork, or reference frame to help the generated video preserve the visual direction you care about.',
        },
        {
          title: 'Natural language keeps iteration simple',
          description:
            'Adjust the action, scene, tone, object, or camera language in words, then regenerate until the clip fits the story you want to tell.',
        },
        {
          title: 'Outputs fit creator workflows',
          description:
            'Preview finished clips, keep generation history, download usable outputs, and turn the best results into ads, demos, explainers, or social videos.',
        },
      ],
    },
    productUseCases: [
      {
        title: 'Product and launch videos',
        description:
          'Turn product images, campaign concepts, or launch ideas into short video drafts for ads, websites, and social posts.',
      },
      {
        title: 'Visual learning and explainers',
        description:
          'Convert a lesson, workflow, or abstract concept into a short visual sequence that is easier to understand and share.',
      },
      {
        title: 'Character moments from images',
        description:
          'Start from a still image and create expressive motion, scene atmosphere, and a clearer character-led video moment.',
      },
      {
        title: 'Storyboard and music-video ideas',
        description:
          'Write a shot-by-shot prompt, preserve the important details, and create quick video drafts before investing in production.',
      },
    ],
    promptTips: {
      title: 'Gemini Omni prompt tips for realistic AI videos',
      items: [
        {
          label: '01',
          title: 'Start with the main video elements',
          description:
            'Name the subject, setting, action, framing, camera movement, style, lighting, and mood before adding advanced effects.',
        },
        {
          label: '02',
          title: 'Use references with a clear purpose',
          description:
            'When uploading an image, say whether it should control character identity, product appearance, composition, color, or overall art direction.',
        },
        {
          label: '03',
          title: 'Write camera direction clearly',
          description:
            'Use phrases like wide shot, close-up, locked camera, handheld motion, push-in, tilt-up, or continuous shot to shape the final clip.',
        },
        {
          label: '04',
          title: 'Add consistency rules',
          description:
            'For explainers, storyboards, and product videos, specify what must stay consistent and how the idea should unfold over time.',
        },
      ],
    },
    reasons: {
      title: 'Why choose GeminiOmni for Gemini Omni-style video creation',
      description:
        'GeminiOmni keeps the product promise simple: free starting access, creator-friendly workflows, and enough SEO content to answer search intent without changing the site into a developer platform.',
      items: [
        {
          title: 'Free starting path',
          description:
            'Try Gemini Omni-style video generation online before deciding whether you need a larger credit package or paid plan.',
        },
        {
          title: 'Built for creators',
          description:
            'The homepage leads users to real text-to-video and image-to-video workflows before anything else.',
        },
        {
          title: 'Clear model overview',
          description:
            'GeminiOmni explains what the model direction means, then gives search visitors examples, use cases, prompt advice, and creation routes.',
        },
      ],
    },
  },
  zh: {
    examples: {
      title: 'Gemini Omni 视频示例',
      description: '浏览示例短片，然后创建你自己的视频。',
      cta: '开始创作',
      ariaLabel: 'Gemini Omni 示例视频',
    },
    features: {
      title: 'Gemini Omni AI 视频生成器核心功能',
      description:
        '首页保留模型介绍页需要的 SEO 深度，同时聚焦创作者关心的提示词、图片参考、自然语言迭代、示例、历史记录和下载。',
      videos: [
        {
          title: '文字提示词变成电影级场景',
          description:
            '描述主体、动作、镜头运动、光线和情绪，GeminiOmni 会把创意简报转换成可观看的 AI 视频草稿。',
        },
        {
          title: '图片参考控制身份和风格',
          description:
            '使用产品图、角色图、艺术作品或参考帧，帮助生成视频保留你关心的视觉方向。',
        },
        {
          title: '自然语言让迭代更简单',
          description:
            '用文字调整动作、场景、语气、物体或镜头语言，然后继续生成，直到短片符合你的故事。',
        },
        {
          title: '输出适合创作者工作流',
          description:
            '预览完成视频，保留生成历史，下载可用结果，并用于广告、演示、讲解或社交短视频。',
        },
      ],
    },
    productUseCases: [
      {
        title: '产品和发布视频',
        description:
          '把产品图片、活动概念或发布创意转换成适合广告、网站和社交平台的短视频草稿。',
      },
      {
        title: '视觉学习和讲解内容',
        description:
          '把课程、流程或抽象概念转换成更容易理解和分享的短视觉片段。',
      },
      {
        title: '从图片生成角色瞬间',
        description:
          '从一张静态图片开始，生成更有表现力的动作、场景氛围和角色视频片段。',
      },
      {
        title: '分镜和音乐视频创意',
        description:
          '写出分镜式提示词，保留关键细节，在投入制作前快速生成视频草稿。',
      },
    ],
    promptTips: {
      title: '用于真实感 AI 视频的 Gemini Omni 提示词技巧',
      items: [
        {
          label: '01',
          title: '先写清视频核心元素',
          description:
            '在添加高级效果前，先写明主体、环境、动作、构图、镜头运动、风格、光线和情绪。',
        },
        {
          label: '02',
          title: '明确参考图的作用',
          description:
            '上传图片时说明它要控制角色身份、产品外观、构图、颜色，还是整体美术方向。',
        },
        {
          label: '03',
          title: '清楚描述镜头语言',
          description:
            '使用 wide shot、close-up、locked camera、handheld motion、push-in、tilt-up 或 continuous shot 等表达来塑造最终画面。',
        },
        {
          label: '04',
          title: '补充一致性规则',
          description:
            '做讲解、分镜或产品视频时，说明哪些元素必须保持一致，以及创意应该如何随时间展开。',
        },
      ],
    },
    reasons: {
      title: '为什么选择 GeminiOmni 创作 Gemini Omni 风格视频',
      description:
        'GeminiOmni 保持清晰的产品承诺：免费起步、创作者友好的流程，以及足够回答搜索意图的 SEO 内容，而不是把网站改成开发者平台。',
      items: [
        {
          title: '免费起步路径',
          description:
            '先在线尝试 Gemini Omni 风格视频生成，再决定是否需要更大的积分包或付费计划。',
        },
        {
          title: '为创作者设计',
          description:
            '首页优先引导用户进入真实的文字转视频和图片转视频流程。',
        },
        {
          title: '清晰的模型介绍',
          description:
            'GeminiOmni 解释模型方向的含义，并提供示例、使用场景、提示词建议和创作入口。',
        },
      ],
    },
  },
  ru: {
    examples: {
      title: 'Примеры видео Gemini Omni',
      description: 'Посмотрите короткие примеры и создайте собственное видео.',
      cta: 'Начать создание',
      ariaLabel: 'Пример видео Gemini Omni',
    },
    features: {
      title: 'Ключевые возможности ИИ-генератора видео Gemini Omni',
      description:
        'Главная страница дает поисковым пользователям подробный обзор и при этом остается ориентированной на авторов: промпты, изображения, итерации на естественном языке, примеры, история и загрузка результатов.',
      videos: [
        {
          title: 'Текстовые промпты становятся кинематографичными сценами',
          description:
            'Опишите объект, действие, движение камеры, свет и настроение. GeminiOmni помогает превратить такую идею в готовый черновик ИИ-видео.',
        },
        {
          title: 'Изображения задают идентичность и стиль',
          description:
            'Используйте фото продукта, персонажа, иллюстрацию или референсный кадр, чтобы сохранить нужное визуальное направление в видео.',
        },
        {
          title: 'Естественный язык упрощает доработку',
          description:
            'Меняйте действие, сцену, тон, объект или операторский язык словами и перегенерируйте ролик, пока он не подойдет вашей истории.',
        },
        {
          title: 'Результаты подходят для рабочего процесса автора',
          description:
            'Просматривайте готовые клипы, храните историю генераций, скачивайте результаты и используйте их для рекламы, демо, обучающих роликов и соцсетей.',
        },
      ],
    },
    productUseCases: [
      {
        title: 'Видео для продуктов и запусков',
        description:
          'Преобразуйте изображения продукта, идеи кампании или запусков в короткие видеочерновики для рекламы, сайтов и социальных сетей.',
      },
      {
        title: 'Визуальное обучение и объясняющие ролики',
        description:
          'Превращайте урок, процесс или абстрактную концепцию в короткую визуальную сцену, которую легче понять и распространить.',
      },
      {
        title: 'Персонажные моменты из изображений',
        description:
          'Начните со статичного изображения и создайте выразительное движение, атмосферу сцены и более ясный ролик с персонажем.',
      },
      {
        title: 'Сториборды и идеи для музыкальных видео',
        description:
          'Опишите сцену по кадрам, сохраните важные детали и быстро получите видеочерновик до полноценного производства.',
      },
    ],
    promptTips: {
      title: 'Советы по промптам Gemini Omni для реалистичных ИИ-видео',
      items: [
        {
          label: '01',
          title: 'Начните с главных элементов видео',
          description:
            'Укажите объект, место, действие, кадрирование, движение камеры, стиль, свет и настроение до добавления сложных эффектов.',
        },
        {
          label: '02',
          title: 'Задавайте референсам четкую роль',
          description:
            'При загрузке изображения уточните, должно ли оно контролировать идентичность персонажа, вид продукта, композицию, цвет или арт-направление.',
        },
        {
          label: '03',
          title: 'Пишите операторские указания ясно',
          description:
            'Используйте wide shot, close-up, locked camera, handheld motion, push-in, tilt-up или continuous shot, чтобы управлять финальным кадром.',
        },
        {
          label: '04',
          title: 'Добавляйте правила постоянства',
          description:
            'Для объясняющих роликов, сторибордов и продуктовых видео уточняйте, что должно оставаться неизменным и как идея развивается во времени.',
        },
      ],
    },
    reasons: {
      title: 'Почему стоит выбрать GeminiOmni для видео в стиле Gemini Omni',
      description:
        'GeminiOmni сохраняет простое обещание продукта: бесплатный старт, удобный для авторов процесс и достаточно SEO-контента, чтобы ответить на поисковый запрос без превращения сайта в платформу для разработчиков.',
      items: [
        {
          title: 'Бесплатный старт',
          description:
            'Попробуйте генерацию видео в стиле Gemini Omni онлайн, прежде чем выбирать большой пакет кредитов или платный план.',
        },
        {
          title: 'Создано для авторов',
          description:
            'Главная страница сначала ведет пользователей к реальным сценариям text-to-video и image-to-video.',
        },
        {
          title: 'Понятный обзор модели',
          description:
            'GeminiOmni объясняет направление модели и дает посетителям примеры, сценарии использования, советы по промптам и пути к созданию видео.',
        },
      ],
    },
  },
  ja: {
    examples: {
      title: 'Gemini Omni 動画サンプル',
      description: 'サンプルクリップを見て、自分の動画を作成しましょう。',
      cta: '作成を始める',
      ariaLabel: 'Gemini Omni 動画サンプル',
    },
    features: {
      title: 'Gemini Omni AI 動画生成ツールの主な機能',
      description:
        'このページはモデル紹介ページとしての SEO 情報量を保ちつつ、プロンプト、画像参照、自然言語での反復、サンプル、履歴、ダウンロードなど、クリエイターの実用面に焦点を当てています。',
      videos: [
        {
          title: 'テキストプロンプトを映画的なシーンへ',
          description:
            '被写体、動き、カメラワーク、照明、ムードを説明すると、GeminiOmni がそのクリエイティブブリーフを視聴できる AI 動画ドラフトに近づけます。',
        },
        {
          title: '画像で人物性とスタイルを誘導',
          description:
            '商品写真、キャラクター画像、アートワーク、参照フレームを使い、生成動画で守りたいビジュアル方向を伝えられます。',
        },
        {
          title: '自然言語で反復がしやすい',
          description:
            'アクション、場面、トーン、オブジェクト、カメラ表現を言葉で調整し、物語に合うまで再生成できます。',
        },
        {
          title: 'クリエイターの制作フローに合う出力',
          description:
            '完成したクリップをプレビューし、生成履歴を残し、使える出力をダウンロードして広告、デモ、解説、SNS 動画に活用できます。',
        },
      ],
    },
    productUseCases: [
      {
        title: '商品動画とローンチ動画',
        description:
          '商品画像、キャンペーン案、ローンチアイデアを、広告、Web サイト、SNS 投稿向けの短い動画ドラフトに変換します。',
      },
      {
        title: '視覚学習と解説動画',
        description:
          '授業、ワークフロー、抽象的な概念を、理解しやすく共有しやすい短いビジュアルシーケンスにします。',
      },
      {
        title: '画像からキャラクターの一瞬を作成',
        description:
          '静止画像から始めて、表情のある動き、シーンの空気感、キャラクター中心の動画表現を作れます。',
      },
      {
        title: '絵コンテとミュージックビデオのアイデア',
        description:
          'ショットごとのプロンプトを書き、重要なディテールを保ったまま、本制作前に動画ドラフトを素早く確認できます。',
      },
    ],
    promptTips: {
      title: 'リアルな AI 動画のための Gemini Omni プロンプトのコツ',
      items: [
        {
          label: '01',
          title: '主要な動画要素から書き始める',
          description:
            '高度な効果を足す前に、被写体、場所、動き、構図、カメラ移動、スタイル、照明、ムードを明確にします。',
        },
        {
          label: '02',
          title: '参照画像の目的を明確にする',
          description:
            '画像をアップロードする際は、人物性、商品外観、構図、色、全体のアート方向のどれを制御したいのかを書きます。',
        },
        {
          label: '03',
          title: 'カメラ指示を具体的に書く',
          description:
            'wide shot、close-up、locked camera、handheld motion、push-in、tilt-up、continuous shot などで最終映像の見え方を指定します。',
        },
        {
          label: '04',
          title: '一貫性のルールを加える',
          description:
            '解説、絵コンテ、商品動画では、何を一貫させるべきか、アイデアを時間の中でどう展開するかを指定します。',
        },
      ],
    },
    reasons: {
      title: 'Gemini Omni 風の動画制作に GeminiOmni を選ぶ理由',
      description:
        'GeminiOmni は、無料で始められること、クリエイターに使いやすい制作フロー、検索意図に応える十分な SEO コンテンツという約束を保ち、サイトを開発者向けプラットフォームには寄せません。',
      items: [
        {
          title: '無料で始められる導線',
          description:
            '大きなクレジットパックや有料プランを選ぶ前に、Gemini Omni 風の動画生成をオンラインで試せます。',
        },
        {
          title: 'クリエイター向けに設計',
          description:
            'ホームページはまず、実際の text-to-video と image-to-video の制作フローへユーザーを案内します。',
        },
        {
          title: 'わかりやすいモデル概要',
          description:
            'GeminiOmni はモデルの方向性を説明し、検索ユーザーにサンプル、用途、プロンプトのヒント、作成導線を提供します。',
        },
      ],
    },
  },
  ko: {
    examples: {
      title: 'Gemini Omni 비디오 예시',
      description: '샘플 클립을 살펴보고 나만의 비디오를 만들어 보세요.',
      cta: '제작 시작',
      ariaLabel: 'Gemini Omni 샘플 비디오',
    },
    features: {
      title: 'Gemini Omni AI 비디오 생성기의 핵심 기능',
      description:
        '홈페이지는 모델 소개 페이지에 필요한 SEO 깊이를 유지하면서도 프롬프트, 이미지 참조, 자연어 반복, 예시, 기록, 다운로드처럼 크리에이터가 바로 쓰는 기능에 집중합니다.',
      videos: [
        {
          title: '텍스트 프롬프트가 시네마틱 장면으로',
          description:
            '피사체, 액션, 카메라 움직임, 조명, 분위기를 설명하면 GeminiOmni가 그 크리에이티브 브리프를 볼 수 있는 AI 비디오 초안으로 만드는 데 도움을 줍니다.',
        },
        {
          title: '이미지로 정체성과 스타일 안내',
          description:
            '제품 사진, 캐릭터 이미지, 아트워크, 참조 프레임을 사용해 생성 비디오가 원하는 시각 방향을 유지하도록 안내할 수 있습니다.',
        },
        {
          title: '자연어로 반복 작업을 단순하게',
          description:
            '액션, 장면, 톤, 오브젝트, 카메라 언어를 말로 조정하고 원하는 스토리에 맞을 때까지 다시 생성하세요.',
        },
        {
          title: '크리에이터 워크플로에 맞는 결과',
          description:
            '완성된 클립을 미리 보고, 생성 기록을 보관하고, 사용 가능한 결과를 다운로드해 광고, 데모, 설명 영상, 소셜 비디오로 활용하세요.',
        },
      ],
    },
    productUseCases: [
      {
        title: '제품 및 출시 비디오',
        description:
          '제품 이미지, 캠페인 콘셉트, 출시 아이디어를 광고, 웹사이트, 소셜 게시물용 짧은 비디오 초안으로 바꿉니다.',
      },
      {
        title: '시각 학습과 설명 영상',
        description:
          '수업, 워크플로, 추상적인 개념을 이해하고 공유하기 쉬운 짧은 시각 시퀀스로 변환합니다.',
      },
      {
        title: '이미지에서 캐릭터 순간 만들기',
        description:
          '정지 이미지에서 시작해 표현력 있는 움직임, 장면 분위기, 캐릭터 중심의 비디오 순간을 만듭니다.',
      },
      {
        title: '스토리보드와 뮤직비디오 아이디어',
        description:
          '샷별 프롬프트를 작성하고 중요한 디테일을 유지하면서 제작 전에 빠르게 비디오 초안을 확인하세요.',
      },
    ],
    promptTips: {
      title: '사실적인 AI 비디오를 위한 Gemini Omni 프롬프트 팁',
      items: [
        {
          label: '01',
          title: '핵심 비디오 요소부터 시작하세요',
          description:
            '고급 효과를 추가하기 전에 피사체, 배경, 액션, 프레이밍, 카메라 움직임, 스타일, 조명, 분위기를 먼저 적으세요.',
        },
        {
          label: '02',
          title: '참조 이미지의 목적을 분명히 하세요',
          description:
            '이미지를 업로드할 때 캐릭터 정체성, 제품 외형, 구도, 색상, 전체 아트 방향 중 무엇을 제어할지 설명하세요.',
        },
        {
          label: '03',
          title: '카메라 지시를 명확하게 쓰세요',
          description:
            'wide shot, close-up, locked camera, handheld motion, push-in, tilt-up, continuous shot 같은 표현으로 최종 장면을 구체화하세요.',
        },
        {
          label: '04',
          title: '일관성 규칙을 추가하세요',
          description:
            '설명 영상, 스토리보드, 제품 비디오에서는 무엇이 유지되어야 하는지와 아이디어가 시간에 따라 어떻게 전개되어야 하는지 적으세요.',
        },
      ],
    },
    reasons: {
      title: 'Gemini Omni 스타일 비디오 제작에 GeminiOmni를 선택하는 이유',
      description:
        'GeminiOmni는 무료 시작, 크리에이터 친화적인 워크플로, 검색 의도에 답하는 충분한 SEO 콘텐츠라는 제품 약속을 지키며 사이트를 개발자 플랫폼으로 바꾸지 않습니다.',
      items: [
        {
          title: '무료 시작 경로',
          description:
            '더 큰 크레딧 패키지나 유료 플랜을 선택하기 전에 온라인에서 Gemini Omni 스타일 비디오 생성을 먼저 체험해 보세요.',
        },
        {
          title: '크리에이터를 위해 설계',
          description:
            '홈페이지는 사용자를 먼저 실제 text-to-video 및 image-to-video 워크플로로 안내합니다.',
        },
        {
          title: '명확한 모델 개요',
          description:
            'GeminiOmni는 모델 방향을 설명하고 검색 방문자에게 예시, 활용 사례, 프롬프트 조언, 제작 경로를 제공합니다.',
        },
      ],
    },
  },
  de: {
    examples: {
      title: 'Gemini Omni Videobeispiele',
      description: 'Sehen Sie sich Beispielclips an und erstellen Sie danach Ihr eigenes Video.',
      cta: 'Jetzt erstellen',
      ariaLabel: 'Gemini Omni Beispielvideo',
    },
    features: {
      title: 'Kernfunktionen des Gemini Omni KI-Videogenerators',
      description:
        'Die Startseite bietet die SEO-Tiefe einer Modellübersicht und bleibt zugleich auf Creator ausgerichtet: Prompts, Bildreferenzen, natürlichsprachliche Iteration, Beispiele, Verlauf und Downloads.',
      videos: [
        {
          title: 'Textprompts werden zu filmischen Szenen',
          description:
            'Beschreiben Sie Motiv, Handlung, Kamerabewegung, Licht und Stimmung. GeminiOmni hilft dabei, dieses Briefing in einen nutzbaren KI-Videoentwurf zu verwandeln.',
        },
        {
          title: 'Bilder steuern Identität und Stil',
          description:
            'Nutzen Sie Produktfotos, Charakterbilder, Artwork oder Referenzframes, damit das generierte Video die gewünschte visuelle Richtung beibehält.',
        },
        {
          title: 'Natürliche Sprache macht Iteration einfach',
          description:
            'Passen Sie Handlung, Szene, Ton, Objekt oder Kamerasprache in Worten an und generieren Sie neu, bis der Clip zur Geschichte passt.',
        },
        {
          title: 'Ausgaben passen in Creator-Workflows',
          description:
            'Vorschau ansehen, Generierungsverlauf behalten, nutzbare Ergebnisse herunterladen und daraus Ads, Demos, Erklärvideos oder Social-Clips machen.',
        },
      ],
    },
    productUseCases: [
      {
        title: 'Produkt- und Launch-Videos',
        description:
          'Verwandeln Sie Produktbilder, Kampagnenideen oder Launch-Konzepte in kurze Videoentwürfe für Anzeigen, Websites und Social Posts.',
      },
      {
        title: 'Visuelles Lernen und Erklärvideos',
        description:
          'Machen Sie aus einer Lektion, einem Ablauf oder einem abstrakten Konzept eine kurze visuelle Sequenz, die leichter verständlich und teilbar ist.',
      },
      {
        title: 'Charakter-Momente aus Bildern',
        description:
          'Starten Sie mit einem Standbild und erzeugen Sie ausdrucksstarke Bewegung, Szenenatmosphäre und einen klareren charaktergeführten Videomoment.',
      },
      {
        title: 'Storyboard- und Musikvideo-Ideen',
        description:
          'Schreiben Sie einen Prompt Bild für Bild, bewahren Sie wichtige Details und prüfen Sie schnelle Videoentwürfe vor der Produktion.',
      },
    ],
    promptTips: {
      title: 'Gemini Omni Prompt-Tipps für realistische KI-Videos',
      items: [
        {
          label: '01',
          title: 'Beginnen Sie mit den wichtigsten Videoelementen',
          description:
            'Nennen Sie Motiv, Ort, Handlung, Bildausschnitt, Kamerabewegung, Stil, Licht und Stimmung, bevor Sie komplexe Effekte hinzufügen.',
        },
        {
          label: '02',
          title: 'Geben Sie Referenzen eine klare Aufgabe',
          description:
            'Sagen Sie beim Hochladen eines Bildes, ob es Charakteridentität, Produktlook, Komposition, Farbe oder die allgemeine Art Direction steuern soll.',
        },
        {
          label: '03',
          title: 'Formulieren Sie Kameraanweisungen klar',
          description:
            'Nutzen Sie Begriffe wie wide shot, close-up, locked camera, handheld motion, push-in, tilt-up oder continuous shot, um den finalen Clip zu formen.',
        },
        {
          label: '04',
          title: 'Ergänzen Sie Regeln für Konsistenz',
          description:
            'Für Erklärvideos, Storyboards und Produktvideos sollten Sie festlegen, was gleich bleiben muss und wie sich die Idee über die Zeit entfaltet.',
        },
      ],
    },
    reasons: {
      title: 'Warum GeminiOmni für Gemini-Omni-Style-Videos wählen',
      description:
        'GeminiOmni hält das Produktversprechen klar: kostenloser Einstieg, creatorfreundliche Workflows und genug SEO-Inhalt, um Suchintentionen zu beantworten, ohne die Seite in eine Entwicklerplattform zu verwandeln.',
      items: [
        {
          title: 'Kostenloser Einstieg',
          description:
            'Testen Sie die Gemini-Omni-Style-Videogenerierung online, bevor Sie ein größeres Credit-Paket oder einen kostenpflichtigen Plan wählen.',
        },
        {
          title: 'Für Creator gebaut',
          description:
            'Die Startseite führt Nutzer zuerst zu echten text-to-video- und image-to-video-Workflows.',
        },
        {
          title: 'Klare Modellübersicht',
          description:
            'GeminiOmni erklärt die Richtung des Modells und bietet Suchbesuchern Beispiele, Anwendungsfälle, Prompt-Tipps und Wege zur Erstellung.',
        },
      ],
    },
  },
  fr: {
    examples: {
      title: 'Exemples de vidéos Gemini Omni',
      description: 'Parcourez des clips d’exemple, puis créez votre propre vidéo.',
      cta: 'Commencer à créer',
      ariaLabel: 'Exemple de vidéo Gemini Omni',
    },
    features: {
      title: 'Fonctionnalités clés du générateur de vidéos IA Gemini Omni',
      description:
        'La page conserve la profondeur SEO d’une présentation de modèle tout en restant centrée sur les créateurs : prompts, images de référence, itération en langage naturel, exemples, historique et téléchargements.',
      videos: [
        {
          title: 'Les prompts texte deviennent des scènes cinématographiques',
          description:
            'Décrivez le sujet, l’action, le mouvement de caméra, la lumière et l’ambiance. GeminiOmni aide à transformer ce brief créatif en brouillon vidéo IA regardable.',
        },
        {
          title: 'Les images guident l’identité et le style',
          description:
            'Utilisez une photo produit, une image de personnage, une œuvre ou une image de référence pour préserver la direction visuelle importante.',
        },
        {
          title: 'Le langage naturel simplifie les itérations',
          description:
            'Ajustez l’action, la scène, le ton, l’objet ou le langage caméra avec des mots, puis régénérez jusqu’à ce que le clip corresponde à votre histoire.',
        },
        {
          title: 'Des sorties adaptées aux workflows créatifs',
          description:
            'Prévisualisez les clips, gardez l’historique de génération, téléchargez les résultats utiles et transformez-les en pubs, démos, explications ou vidéos sociales.',
        },
      ],
    },
    productUseCases: [
      {
        title: 'Vidéos produit et lancements',
        description:
          'Transformez images produit, idées de campagne ou concepts de lancement en courts brouillons vidéo pour les publicités, sites web et réseaux sociaux.',
      },
      {
        title: 'Apprentissage visuel et vidéos explicatives',
        description:
          'Convertissez une leçon, un processus ou un concept abstrait en courte séquence visuelle plus facile à comprendre et à partager.',
      },
      {
        title: 'Moments de personnage à partir d’images',
        description:
          'Partez d’une image fixe pour créer un mouvement expressif, une ambiance de scène et un moment vidéo centré sur le personnage.',
      },
      {
        title: 'Storyboards et idées de clips musicaux',
        description:
          'Rédigez un prompt plan par plan, conservez les détails importants et obtenez rapidement des brouillons vidéo avant la production.',
      },
    ],
    promptTips: {
      title: 'Conseils de prompts Gemini Omni pour des vidéos IA réalistes',
      items: [
        {
          label: '01',
          title: 'Commencez par les éléments principaux de la vidéo',
          description:
            'Précisez le sujet, le décor, l’action, le cadrage, le mouvement de caméra, le style, la lumière et l’ambiance avant d’ajouter des effets avancés.',
        },
        {
          label: '02',
          title: 'Donnez un rôle clair aux références',
          description:
            'Quand vous importez une image, indiquez si elle doit contrôler l’identité du personnage, l’apparence du produit, la composition, la couleur ou la direction artistique.',
        },
        {
          label: '03',
          title: 'Écrivez clairement la direction caméra',
          description:
            'Utilisez des expressions comme wide shot, close-up, locked camera, handheld motion, push-in, tilt-up ou continuous shot pour façonner le rendu final.',
        },
        {
          label: '04',
          title: 'Ajoutez des règles de cohérence',
          description:
            'Pour les vidéos explicatives, storyboards et vidéos produit, indiquez ce qui doit rester cohérent et comment l’idée doit se dérouler dans le temps.',
        },
      ],
    },
    reasons: {
      title: 'Pourquoi choisir GeminiOmni pour créer des vidéos style Gemini Omni',
      description:
        'GeminiOmni garde une promesse produit simple : démarrage gratuit, workflows adaptés aux créateurs et contenu SEO suffisant pour répondre à l’intention de recherche sans transformer le site en plateforme développeur.',
      items: [
        {
          title: 'Démarrage gratuit',
          description:
            'Essayez la génération de vidéos style Gemini Omni en ligne avant de choisir un plus grand pack de crédits ou une offre payante.',
        },
        {
          title: 'Pensé pour les créateurs',
          description:
            'La page d’accueil dirige d’abord les utilisateurs vers de vrais workflows text-to-video et image-to-video.',
        },
        {
          title: 'Présentation claire du modèle',
          description:
            'GeminiOmni explique la direction du modèle et propose aux visiteurs des exemples, cas d’usage, conseils de prompts et chemins de création.',
        },
      ],
    },
  },
  es: {
    examples: {
      title: 'Ejemplos de video de Gemini Omni',
      description: 'Explora clips de muestra y luego crea tu propio video.',
      cta: 'Empezar a crear',
      ariaLabel: 'Video de muestra de Gemini Omni',
    },
    features: {
      title: 'Funciones clave del generador de video con IA Gemini Omni',
      description:
        'La página mantiene la profundidad SEO de una página de modelo, pero sigue enfocada en creadores: prompts, imágenes de referencia, iteración en lenguaje natural, ejemplos, historial y descargas.',
      videos: [
        {
          title: 'Los prompts de texto se convierten en escenas cinematográficas',
          description:
            'Describe el sujeto, la acción, el movimiento de cámara, la iluminación y el ambiente. GeminiOmni ayuda a convertir ese brief creativo en un borrador de video con IA.',
        },
        {
          title: 'Las imágenes guían identidad y estilo',
          description:
            'Usa una foto de producto, una imagen de personaje, una ilustración o un fotograma de referencia para conservar la dirección visual que te importa.',
        },
        {
          title: 'El lenguaje natural facilita la iteración',
          description:
            'Ajusta la acción, la escena, el tono, el objeto o el lenguaje de cámara con palabras y vuelve a generar hasta que el clip encaje con tu historia.',
        },
        {
          title: 'Resultados pensados para flujos de creadores',
          description:
            'Previsualiza clips terminados, conserva el historial, descarga resultados útiles y conviértelos en anuncios, demos, explicaciones o videos sociales.',
        },
      ],
    },
    productUseCases: [
      {
        title: 'Videos de producto y lanzamiento',
        description:
          'Convierte imágenes de producto, conceptos de campaña o ideas de lanzamiento en borradores de video cortos para anuncios, sitios web y redes sociales.',
      },
      {
        title: 'Aprendizaje visual y videos explicativos',
        description:
          'Transforma una lección, un flujo de trabajo o un concepto abstracto en una secuencia visual breve, más fácil de entender y compartir.',
      },
      {
        title: 'Momentos de personaje a partir de imágenes',
        description:
          'Empieza con una imagen fija y crea movimiento expresivo, atmósfera de escena y un momento de video centrado en el personaje.',
      },
      {
        title: 'Storyboards e ideas para videos musicales',
        description:
          'Escribe un prompt plano por plano, conserva los detalles importantes y crea borradores rápidos antes de invertir en producción.',
      },
    ],
    promptTips: {
      title: 'Consejos de prompts Gemini Omni para videos con IA realistas',
      items: [
        {
          label: '01',
          title: 'Empieza por los elementos principales del video',
          description:
            'Nombra el sujeto, el entorno, la acción, el encuadre, el movimiento de cámara, el estilo, la iluminación y el ambiente antes de añadir efectos avanzados.',
        },
        {
          label: '02',
          title: 'Usa referencias con un propósito claro',
          description:
            'Al subir una imagen, indica si debe controlar la identidad del personaje, la apariencia del producto, la composición, el color o la dirección artística general.',
        },
        {
          label: '03',
          title: 'Escribe la dirección de cámara con claridad',
          description:
            'Usa frases como wide shot, close-up, locked camera, handheld motion, push-in, tilt-up o continuous shot para dar forma al clip final.',
        },
        {
          label: '04',
          title: 'Añade reglas de consistencia',
          description:
            'Para videos explicativos, storyboards y videos de producto, especifica qué debe mantenerse consistente y cómo debe desarrollarse la idea en el tiempo.',
        },
      ],
    },
    reasons: {
      title: 'Por qué elegir GeminiOmni para crear videos estilo Gemini Omni',
      description:
        'GeminiOmni mantiene una promesa de producto simple: acceso gratuito para empezar, flujos amigables para creadores y suficiente contenido SEO para responder a la intención de búsqueda sin convertir el sitio en una plataforma para desarrolladores.',
      items: [
        {
          title: 'Ruta gratuita para empezar',
          description:
            'Prueba la generación de videos estilo Gemini Omni en línea antes de decidir si necesitas más créditos o un plan de pago.',
        },
        {
          title: 'Creado para creadores',
          description:
            'La página de inicio lleva primero a los usuarios a flujos reales de text-to-video e image-to-video.',
        },
        {
          title: 'Resumen claro del modelo',
          description:
            'GeminiOmni explica qué significa la dirección del modelo y ofrece ejemplos, casos de uso, consejos de prompts y rutas de creación.',
        },
      ],
    },
  },
  pt: {
    examples: {
      title: 'Exemplos de vídeo Gemini Omni',
      description: 'Veja clipes de exemplo e depois crie o seu próprio vídeo.',
      cta: 'Começar a criar',
      ariaLabel: 'Vídeo de exemplo Gemini Omni',
    },
    features: {
      title: 'Principais recursos do gerador de vídeo com IA Gemini Omni',
      description:
        'A página mantém a profundidade de SEO de uma visão geral de modelo, mas continua focada em criadores: prompts, imagens de referência, iteração em linguagem natural, exemplos, histórico e downloads.',
      videos: [
        {
          title: 'Prompts de texto viram cenas cinematográficas',
          description:
            'Descreva o assunto, a ação, o movimento de câmera, a luz e o clima. O GeminiOmni ajuda a transformar esse briefing criativo em um rascunho de vídeo com IA.',
        },
        {
          title: 'Imagens orientam identidade e estilo',
          description:
            'Use uma foto de produto, imagem de personagem, arte ou frame de referência para preservar a direção visual que importa no vídeo gerado.',
        },
        {
          title: 'A linguagem natural simplifica a iteração',
          description:
            'Ajuste ação, cena, tom, objeto ou linguagem de câmera com palavras e gere novamente até que o clipe combine com a história.',
        },
        {
          title: 'Resultados feitos para fluxos de criadores',
          description:
            'Pré-visualize clipes prontos, mantenha o histórico, baixe resultados úteis e transforme-os em anúncios, demos, explicações ou vídeos sociais.',
        },
      ],
    },
    productUseCases: [
      {
        title: 'Vídeos de produto e lançamento',
        description:
          'Transforme imagens de produto, conceitos de campanha ou ideias de lançamento em rascunhos curtos para anúncios, sites e redes sociais.',
      },
      {
        title: 'Aprendizado visual e vídeos explicativos',
        description:
          'Converta uma aula, fluxo de trabalho ou conceito abstrato em uma sequência visual curta, mais fácil de entender e compartilhar.',
      },
      {
        title: 'Momentos de personagem a partir de imagens',
        description:
          'Comece com uma imagem estática e crie movimento expressivo, atmosfera de cena e um momento de vídeo centrado no personagem.',
      },
      {
        title: 'Storyboards e ideias para videoclipes',
        description:
          'Escreva um prompt cena a cena, preserve detalhes importantes e crie rascunhos rápidos antes de investir em produção.',
      },
    ],
    promptTips: {
      title: 'Dicas de prompt Gemini Omni para vídeos com IA realistas',
      items: [
        {
          label: '01',
          title: 'Comece pelos principais elementos do vídeo',
          description:
            'Informe assunto, cenário, ação, enquadramento, movimento de câmera, estilo, iluminação e clima antes de adicionar efeitos avançados.',
        },
        {
          label: '02',
          title: 'Use referências com um objetivo claro',
          description:
            'Ao enviar uma imagem, diga se ela deve controlar identidade do personagem, aparência do produto, composição, cor ou direção de arte geral.',
        },
        {
          label: '03',
          title: 'Escreva a direção de câmera com clareza',
          description:
            'Use termos como wide shot, close-up, locked camera, handheld motion, push-in, tilt-up ou continuous shot para moldar o clipe final.',
        },
        {
          label: '04',
          title: 'Adicione regras de consistência',
          description:
            'Para explicações, storyboards e vídeos de produto, especifique o que deve permanecer consistente e como a ideia deve se desenvolver no tempo.',
        },
      ],
    },
    reasons: {
      title: 'Por que escolher o GeminiOmni para criar vídeos no estilo Gemini Omni',
      description:
        'O GeminiOmni mantém uma promessa simples: acesso gratuito para começar, fluxos amigáveis para criadores e conteúdo de SEO suficiente para responder à intenção de busca sem transformar o site em uma plataforma para desenvolvedores.',
      items: [
        {
          title: 'Caminho gratuito para começar',
          description:
            'Teste a geração de vídeos no estilo Gemini Omni online antes de escolher um pacote maior de créditos ou um plano pago.',
        },
        {
          title: 'Feito para criadores',
          description:
            'A página inicial leva os usuários primeiro a fluxos reais de text-to-video e image-to-video.',
        },
        {
          title: 'Visão clara do modelo',
          description:
            'O GeminiOmni explica o significado da direção do modelo e oferece exemplos, casos de uso, dicas de prompt e caminhos de criação.',
        },
      ],
    },
  },
};

const capabilityIcons = [Layers3, Images, Wand2];
const workflowIcons = [Sparkles, ImageIcon, Camera, Download];

function getLocalizedPath(locale: string, path: string) {
  return locale === defaultLocale ? path : `/${locale}${path}`;
}

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || 'https://geminiomni.tv';
  const canonicalUrl = locale === defaultLocale ? baseUrl : `${baseUrl}/${locale}`;
  const copy = getGeminiOmniLandingCopy(locale);

  return {
    title: copy.metadata.title,
    description: copy.metadata.description,
    keywords: copy.metadata.keywords,
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function LandingPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const textToVideoHref = getLocalizedPath(locale, '/text-to-video');
  const omniStudioHref = getLocalizedPath(locale, '/omni-studio');
  const copy = getGeminiOmniLandingCopy(locale);
  const homeCopy =
    homePageSectionCopy[locale] || homePageSectionCopy[defaultLocale];
  const intentLinks = getGeminiOmniIntentLinks(locale);
  const relatedIntentLinks = intentLinks.filter(
    (item) => !item.href.includes('api')
  );
  const featureVideos = homeCopy.features.videos.map((item, index) => ({
    ...item,
    src: featureVideoSources[index],
  }));
  const productUseCases = homeCopy.productUseCases.map((item, index) => ({
    ...item,
    src: productUseCaseSources[index],
  }));
  const ctaSection = {
    name: 'cta',
    title: copy.workflow.title,
    buttons: [{ title: 'Free Gemini Omni', url: omniStudioHref }],
  };

  return (
    <>
      <AuthRedirect preserveSearchParams />
      <OmniVideoHero
        title={copy.hero.title}
        highlightText="Gemini Omni"
        description={copy.hero.description}
        videoSrc="https://r2.seedance.tv/intro/gemini%20omin/YTDown_YouTube_Introducing-Gemini-Omni-Create-Anything-_Media_KUyRq7szZsM_002_720p.mp4"
        posterSrc="/imgs/intro/gemini-omni-hero-poster.jpg"
      />
      <main className="bg-slate-950 text-white">
        <section className="bg-slate-950 px-5 py-16 text-white sm:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-3xl font-semibold tracking-normal sm:text-4xl">
                  {homeCopy.examples.title}
                </h2>
                <p className="mt-4 max-w-2xl leading-7 text-slate-300">
                  {homeCopy.examples.description}
                </p>
              </div>
              <Button asChild className="rounded-md bg-blue-600 text-white hover:bg-blue-700">
                <Link href={textToVideoHref}>
                  {homeCopy.examples.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 md:grid md:grid-cols-2 md:overflow-visible md:pb-0 lg:grid-cols-4">
              {exampleVideos.map((src, index) => (
                <HoverPlayVideo
                  key={src}
                  className="aspect-[9/16] w-[78%] shrink-0 snap-start rounded-md border border-white/10 bg-black object-cover shadow-lg shadow-black/40 md:w-full md:shrink"
                  src={src}
                  ariaLabel={`${homeCopy.examples.ariaLabel} ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </section>

        <ArticleSection
          title={copy.model.title}
          description={copy.model.description}
          className="bg-slate-950 text-white"
        >
          <div className="grid gap-4 md:grid-cols-3">
            {copy.capabilities.map((item, index) => {
              const Icon = capabilityIcons[index] || Film;
              return (
                <article
                  key={item.title}
                  className="rounded-md border border-white/10 bg-white/[0.045] p-6"
                >
                  <Icon className="h-6 w-6 text-cyan-200" />
                  <h3 className="mt-5 text-xl font-semibold text-white">
                    {item.title}
                  </h3>
                  <p className="mt-3 leading-7 text-slate-300">
                    {item.description}
                  </p>
                </article>
              );
            })}
          </div>
        </ArticleSection>

        <ArticleSection
          title={homeCopy.features.title}
          description={homeCopy.features.description}
          className="bg-slate-950 text-white"
        >
          <div className="grid gap-5 md:grid-cols-2">
            {featureVideos.map((item) => (
              <VideoFeatureCard key={item.title} item={item} />
            ))}
          </div>
        </ArticleSection>

        <section className="bg-slate-950 px-5 py-16 text-white sm:px-8">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.82fr_1.18fr]">
            <div>
              <h2 className="text-3xl font-semibold tracking-normal sm:text-4xl">
                {copy.workflow.title}
              </h2>
              <p className="mt-5 leading-8 text-slate-300">
                {copy.workflow.description}
              </p>
              <Button asChild className="mt-7 rounded-md bg-blue-600 text-white hover:bg-blue-700">
                <Link href={textToVideoHref}>
                  {copy.workflow.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {copy.workflow.steps.map((item, index) => {
                const Icon = workflowIcons[index] || Sparkles;
                return (
                  <article
                    key={item.title}
                    className="rounded-md border border-white/10 bg-white/[0.045] p-5"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <Icon className="h-6 w-6 text-blue-400" />
                      <span className="text-sm font-semibold text-slate-400">
                        0{index + 1}
                      </span>
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-white">
                      {item.title}
                    </h3>
                    <p className="mt-2 leading-7 text-slate-300">
                      {item.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <ArticleSection
          title={copy.useCases.title}
          description={copy.useCases.description}
          className="bg-slate-950 text-white"
        >
          <div className="grid gap-5 md:grid-cols-2">
            {productUseCases.map((item) => (
              <VideoFeatureCard key={item.title} item={item} />
            ))}
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {copy.useCases.items.map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-md border border-white/10 bg-white/[0.045] p-4"
              >
                <PlayCircle className="h-5 w-5 text-blue-400" />
                <span className="text-slate-300">{item}</span>
              </div>
            ))}
          </div>
        </ArticleSection>

        <section className="bg-slate-950 px-5 py-16 text-white sm:px-8">
          <div className="mx-auto max-w-7xl">
            <h2 className="text-3xl font-semibold tracking-normal sm:text-4xl">
              {homeCopy.promptTips.title}
            </h2>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {homeCopy.promptTips.items.map((item) => (
                <article
                  key={item.title}
                  className="rounded-md border border-white/10 bg-white/[0.045] p-5"
                >
                  <span className="text-sm font-semibold text-cyan-200">
                    {item.label}
                  </span>
                  <h3 className="mt-3 text-xl font-semibold text-white">
                    {item.title}
                  </h3>
                  <p className="mt-3 leading-7 text-slate-300">
                    {item.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <ArticleSection
          title={homeCopy.reasons.title}
          description={homeCopy.reasons.description}
          className="bg-slate-950 text-white"
        >
          <div className="grid gap-4 md:grid-cols-3">
            {homeCopy.reasons.items.map((item) => (
              <article
                key={item.title}
                className="rounded-md border border-white/10 bg-white/[0.045] p-6"
              >
                <ShieldCheck className="h-6 w-6 text-blue-400" />
                <h3 className="mt-5 text-xl font-semibold text-white">{item.title}</h3>
                <p className="mt-3 leading-7 text-slate-300">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
          <div className="mt-8 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {relatedIntentLinks.map((item) => (
              <Link
                key={item.href}
                href={getLocalizedPath(locale, item.href)}
                className="group rounded-md border border-blue-500/30 bg-blue-500/10 p-5 transition hover:border-blue-400/50 hover:bg-blue-500/20"
              >
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-base font-semibold text-white">
                    {item.title}
                  </h3>
                  <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-blue-400 transition group-hover:translate-x-0.5" />
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  {item.description}
                </p>
              </Link>
            ))}
          </div>
        </ArticleSection>

        <section className="border-t border-white/10 bg-slate-950 px-5 py-16 text-white sm:px-8">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-3xl font-semibold tracking-normal sm:text-4xl">
              {copy.faq.title}
            </h2>
            <div className="mt-8 divide-y divide-white/10 rounded-md border border-white/10 bg-white/[0.03]">
              {copy.faq.items.map((item) => (
                <div key={item.question} className="p-6">
                  <h3 className="text-lg font-semibold text-white">
                    {item.question}
                  </h3>
                  <p className="mt-3 leading-7 text-slate-300">
                    {item.answer}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-8 text-sm leading-6 text-slate-500">
              {copy.faq.independentNotice}
            </p>
          </div>
        </section>

        <CTA section={ctaSection} />
      </main>

      <StructuredData type="faq" data={{ questions: copy.faq.items }} />
    </>
  );
}

function ArticleSection({
  title,
  description,
  className,
  children,
}: {
  title: string;
  description: string;
  className: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`px-5 py-16 sm:px-8 ${className}`}>
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <h2 className="text-3xl font-semibold tracking-normal sm:text-4xl">
            {title}
          </h2>
          <p className="mt-5 leading-8 opacity-80">{description}</p>
        </div>
        <div className="mt-8">{children}</div>
      </div>
    </section>
  );
}

function VideoFeatureCard({
  item,
}: {
  item: {
    title: string;
    description: string;
    src: string;
  };
}) {
  return (
    <article className="overflow-hidden rounded-md border border-white/10 bg-white/[0.045] text-white shadow-sm">
      <HoverPlayVideo
        className="aspect-video w-full bg-black object-cover"
        src={item.src}
      />
      <div className="p-5">
        <Film className="h-5 w-5 text-blue-400" />
        <h3 className="mt-4 text-xl font-semibold">{item.title}</h3>
        <p className="mt-3 leading-7 text-slate-300">{item.description}</p>
      </div>
    </article>
  );
}
