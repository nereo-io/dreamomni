import { defaultLocale } from "@/i18n/locale";

type LandingLocaleCopy = {
  metadata: {
    title: string;
    description: string;
    keywords: string;
  };
  hero: {
    title: string;
    description: string;
    primaryCta: string;
    secondaryCta: string;
    highlights: string[];
    imageAlt: string;
    preview: Array<{
      label: string;
      value: string;
    }>;
  };
  model: {
    title: string;
    description: string;
  };
  capabilities: Array<{
    title: string;
    description: string;
  }>;
  workflow: {
    title: string;
    description: string;
    cta: string;
    steps: Array<{
      title: string;
      description: string;
    }>;
  };
  useCases: {
    title: string;
    description: string;
    items: string[];
  };
  faq: {
    title: string;
    independentNotice: string;
    items: Array<{
      question: string;
      answer: string;
    }>;
  };
};

const landingCopy: Record<string, LandingLocaleCopy> = {
  en: {
    metadata: {
      title: "Free Gemini Omni AI Video Generator",
      description:
        "Create cinematic AI videos with GeminiOmni. Turn text prompts and images into videos online with a free Gemini Omni-style AI video generator.",
      keywords:
        "Gemini Omni, Gemini Omni AI video generator, free AI video generator, Google Gemini Omni, text to video AI, image to video AI, multimodal video generator",
    },
    hero: {
      title: "Free Gemini Omni AI Video Generator",
      description:
        "Create cinematic AI videos from text prompts and images. GeminiOmni turns Gemini Omni-style multimodal creation into a fast online generator for creators, marketers, educators, and storytellers.",
      primaryCta: "Generate AI Video Free",
      secondaryCta: "Image to Video",
      highlights: [
        "Text-to-video for cinematic prompt ideas",
        "Image-to-video for visual references",
        "History, playback, and download when outputs are ready",
      ],
      imageAlt: "GeminiOmni AI video generator visual",
      preview: [
        {
          label: "Prompt",
          value: "A cinematic reveal of a glass AI filmmaker shaping light into video",
        },
        {
          label: "Reference",
          value: "Image, camera direction, scene mood",
        },
        {
          label: "Output",
          value: "Playable AI video ready for download",
        },
      ],
    },
    model: {
      title: "A new model direction for multimodal AI video creation.",
      description:
        "Google describes Gemini Omni as a model that can create from many input types, starting with video. The headline capabilities are natural-language editing, references from images, text, audio, and video, and scene generation grounded in world knowledge. GeminiOmni turns that direction into an approachable generator workflow for people who want to create videos now.",
    },
    capabilities: [
      {
        title: "Any-input creative direction",
        description:
          "Gemini Omni's official direction centers on combining text, image, audio, and video inputs into one coherent video creation flow.",
      },
      {
        title: "Natural language video editing",
        description:
          "Describe the scene, then refine the action, camera, subjects, style, and effects conversationally instead of rebuilding the whole idea from scratch.",
      },
      {
        title: "Cinematic world-aware output",
        description:
          "Use prompts for realistic physics, historical context, product details, explainers, and camera language to create more structured videos.",
      },
    ],
    workflow: {
      title: "Create AI videos online in four simple steps.",
      description:
        "No filming equipment, editing timeline, or production team is required. Start from a prompt or a reference image, generate a video, and keep iterating until the scene feels right.",
      cta: "Start Creating",
      steps: [
        {
          title: "Describe the scene",
          description:
            "Write the subject, setting, motion, camera angle, style, dialogue, and mood in one clear prompt.",
        },
        {
          title: "Add a reference image",
          description:
            "Guide identity, composition, product appearance, or style with an uploaded visual reference.",
        },
        {
          title: "Tune generation settings",
          description:
            "Choose the available workflow, aspect ratio, duration, quality, and model options for your clip.",
        },
        {
          title: "Preview and download",
          description:
            "Keep finished outputs in your creation history, download the video, and iterate on the next cut.",
        },
      ],
    },
    useCases: {
      title: "One generator for campaigns, explainers, concepts, and social clips.",
      description:
        "Use GeminiOmni to move quickly from an idea to a polished AI video draft. It is built for creators who need output, not a passive news page.",
      items: [
        "Short-form ads and UGC concepts",
        "Product demos and launch videos",
        "Image-to-video character moments",
        "Educational explainers",
        "Music video storyboards",
        "Reels, Shorts, and TikTok clips",
      ],
    },
    faq: {
      title: "Gemini Omni AI video generator questions.",
      independentNotice:
        "GeminiOmni.tv is an independent product and is not affiliated with Google, Gemini, or Google DeepMind.",
      items: [
        {
          question: "What is the Gemini Omni AI Video Generator?",
          answer:
            "GeminiOmni is an independent online AI video generator inspired by Google Gemini Omni's multimodal video direction. It helps creators turn prompts and images into cinematic videos with a fast, browser-based workflow.",
        },
        {
          question: "What can I create with Gemini Omni-style video tools?",
          answer:
            "You can create social clips, product demos, cinematic scene concepts, educational explainers, avatar-style videos, and image-to-video animations from simple prompts and references.",
        },
        {
          question: "Can I start for free?",
          answer:
            "Yes. GeminiOmni offers a free starting path so you can try AI video generation before choosing a paid plan or larger credit package.",
        },
        {
          question: "Is GeminiOmni affiliated with Google?",
          answer:
            "No. GeminiOmni.tv is an independent product and is not affiliated with Google, Gemini, or Google DeepMind.",
        },
      ],
    },
  },
  zh: {
    metadata: {
      title: "免费 Gemini Omni AI 视频生成器",
      description:
        "使用 GeminiOmni 在线创建电影级 AI 视频。将文字提示词和图片快速转换为 Gemini Omni 风格的视频内容。",
      keywords:
        "Gemini Omni, Gemini Omni AI 视频生成器,免费 AI 视频生成器,文字转视频 AI,图片转视频 AI,多模态视频生成器",
    },
    hero: {
      title: "免费 Gemini Omni AI 视频生成器",
      description:
        "通过文字提示词和图片创建电影级 AI 视频。GeminiOmni 将 Gemini Omni 风格的多模态创作能力变成适合创作者、营销团队、教育者和故事创作者使用的在线生成器。",
      primaryCta: "免费生成 AI 视频",
      secondaryCta: "图片转视频",
      highlights: [
        "用文字提示词生成电影感视频创意",
        "用图片参考控制主体、构图与风格",
        "视频完成后可查看历史、播放与下载",
      ],
      imageAlt: "GeminiOmni AI 视频生成器视觉图",
      preview: [
        {
          label: "提示词",
          value: "一位玻璃质感的 AI 电影创作者，将光塑造成视频的电影级揭幕镜头",
        },
        {
          label: "参考",
          value: "图片、镜头方向、场景氛围",
        },
        {
          label: "输出",
          value: "可播放并下载的 AI 视频",
        },
      ],
    },
    model: {
      title: "面向多模态 AI 视频创作的新模型方向。",
      description:
        "Google 对 Gemini Omni 的介绍强调，它可以从多种输入类型开始创作，首先聚焦视频。核心能力包括自然语言编辑、图片/文字/音频/视频参考，以及基于世界知识的场景生成。GeminiOmni 将这种方向转化为更容易上手的生成器流程，让用户现在就能开始创作视频。",
    },
    capabilities: [
      {
        title: "多输入创意控制",
        description:
          "Gemini Omni 的官方方向强调把文字、图片、音频和视频输入融合到同一个连贯的视频创作流程中。",
      },
      {
        title: "自然语言视频编辑",
        description:
          "用语言描述场景，再继续调整动作、镜头、主体、风格和特效，而不必每次从头重做。",
      },
      {
        title: "具备世界知识的电影级输出",
        description:
          "通过提示词控制真实物理、历史语境、产品细节、讲解内容和镜头语言，生成更有结构的视频。",
      },
    ],
    workflow: {
      title: "四步在线创建 AI 视频。",
      description:
        "无需拍摄设备、剪辑时间线或制作团队。从提示词或参考图片开始，生成视频，并持续迭代到画面符合预期。",
      cta: "开始创作",
      steps: [
        {
          title: "描述场景",
          description:
            "用一句清晰提示词写出主体、环境、动作、镜头角度、风格、对白和情绪。",
        },
        {
          title: "添加参考图片",
          description:
            "上传视觉参考来控制身份、构图、产品外观或整体风格。",
        },
        {
          title: "调整生成设置",
          description:
            "选择可用工作流、画幅、时长、质量和模型选项。",
        },
        {
          title: "预览并下载",
          description:
            "在创作历史中保存成片，播放视频，下载结果，并继续迭代下一版。",
        },
      ],
    },
    useCases: {
      title: "一个生成器覆盖广告、讲解、概念片和社交短视频。",
      description:
        "使用 GeminiOmni 从想法快速推进到可用的 AI 视频草稿。它不是资讯页，而是为需要产出的创作者打造的工具。",
      items: [
        "短视频广告和 UGC 创意",
        "产品演示和发布视频",
        "图片转视频角色瞬间",
        "教育讲解视频",
        "音乐视频分镜",
        "Reels、Shorts 和 TikTok 内容",
      ],
    },
    faq: {
      title: "Gemini Omni AI 视频生成器常见问题。",
      independentNotice:
        "GeminiOmni.tv 是独立产品，与 Google、Gemini 或 Google DeepMind 无隶属关系。",
      items: [
        {
          question: "Gemini Omni AI 视频生成器是什么？",
          answer:
            "GeminiOmni 是一个独立的在线 AI 视频生成器，灵感来自 Google Gemini Omni 的多模态视频方向。它帮助创作者用快速的浏览器流程，把提示词和图片转换为电影级视频。",
        },
        {
          question: "我可以用 Gemini Omni 风格的视频工具创作什么？",
          answer:
            "你可以创作社交短片、产品演示、电影级场景概念、教育讲解、头像风格视频，以及基于提示词和参考图的图片转视频动画。",
        },
        {
          question: "可以免费开始吗？",
          answer:
            "可以。GeminiOmni 提供免费起步路径，你可以先体验 AI 视频生成，再选择付费套餐或更大的积分包。",
        },
        {
          question: "GeminiOmni 与 Google 有关联吗？",
          answer:
            "没有。GeminiOmni.tv 是独立产品，与 Google、Gemini 或 Google DeepMind 无隶属关系。",
        },
      ],
    },
  },
  ja: {
    metadata: {
      title: "無料 Gemini Omni AI 動画生成ツール",
      description:
        "GeminiOmni で映画のような AI 動画をオンライン作成。テキストプロンプトや画像を Gemini Omni 風の動画へ変換できます。",
      keywords:
        "Gemini Omni, Gemini Omni AI 動画生成, 無料 AI 動画生成, テキストから動画, 画像から動画, マルチモーダル動画生成",
    },
    hero: {
      title: "無料 Gemini Omni AI 動画生成ツール",
      description:
        "テキストプロンプトや画像から映画のような AI 動画を作成。GeminiOmni は Gemini Omni 風のマルチモーダル制作を、クリエイター、マーケター、教育者、ストーリーテラー向けの高速なオンライン生成体験にします。",
      primaryCta: "無料で AI 動画を生成",
      secondaryCta: "画像から動画",
      highlights: [
        "映画的なアイデアをテキストから動画へ",
        "画像参照でビジュアルを誘導",
        "完成後は履歴、再生、ダウンロードに対応",
      ],
      imageAlt: "GeminiOmni AI 動画生成ツールのビジュアル",
      preview: [
        {
          label: "プロンプト",
          value: "光を動画へ形づくるガラス質の AI 映像作家を描いた映画的なリビール",
        },
        {
          label: "参照",
          value: "画像、カメラ方向、シーンのムード",
        },
        {
          label: "出力",
          value: "再生してダウンロードできる AI 動画",
        },
      ],
    },
    model: {
      title: "マルチモーダル AI 動画制作の新しいモデル方向。",
      description:
        "Google は Gemini Omni を、複数の入力タイプから創作できる動画起点のモデルとして説明しています。主な能力は自然言語編集、画像・テキスト・音声・動画の参照、世界知識に基づくシーン生成です。GeminiOmni はその方向性を、今すぐ動画を作りたい人のための使いやすい生成フローにします。",
    },
    capabilities: [
      {
        title: "あらゆる入力から創作を指示",
        description:
          "Gemini Omni の方向性は、テキスト、画像、音声、動画入力を一つの一貫した動画制作フローに統合することです。",
      },
      {
        title: "自然言語による動画編集",
        description:
          "シーンを説明し、会話するように動き、カメラ、被写体、スタイル、効果を調整できます。",
      },
      {
        title: "世界知識を備えた映画的出力",
        description:
          "物理表現、歴史背景、商品詳細、解説、カメラ言語をプロンプトで指定し、より構造化された動画を作成できます。",
      },
    ],
    workflow: {
      title: "4 つの簡単な手順で AI 動画をオンライン作成。",
      description:
        "撮影機材、編集タイムライン、制作チームは不要。プロンプトや参照画像から始め、動画を生成し、理想のシーンになるまで反復できます。",
      cta: "作成を始める",
      steps: [
        {
          title: "シーンを説明",
          description:
            "被写体、場所、動き、カメラ角度、スタイル、会話、ムードを明確なプロンプトにまとめます。",
        },
        {
          title: "参照画像を追加",
          description:
            "アップロードした画像で人物性、構図、商品外観、スタイルを誘導します。",
        },
        {
          title: "生成設定を調整",
          description:
            "利用可能なワークフロー、アスペクト比、長さ、品質、モデルオプションを選びます。",
        },
        {
          title: "プレビューしてダウンロード",
          description:
            "完成した出力を履歴に保存し、動画を再生、ダウンロードして次の案へ進めます。",
        },
      ],
    },
    useCases: {
      title: "キャンペーン、解説、コンセプト、SNS クリップを一つの生成ツールで。",
      description:
        "GeminiOmni なら、アイデアから磨かれた AI 動画ドラフトまで素早く進めます。ニュースページではなく、成果物が必要なクリエイターのためのツールです。",
      items: [
        "短尺広告と UGC コンセプト",
        "商品デモとローンチ動画",
        "画像から動画のキャラクター演出",
        "教育用解説動画",
        "ミュージックビデオの絵コンテ",
        "Reels、Shorts、TikTok クリップ",
      ],
    },
    faq: {
      title: "Gemini Omni AI 動画生成ツールのよくある質問。",
      independentNotice:
        "GeminiOmni.tv は独立した製品であり、Google、Gemini、Google DeepMind とは提携していません。",
      items: [
        {
          question: "Gemini Omni AI 動画生成ツールとは何ですか？",
          answer:
            "GeminiOmni は Google Gemini Omni のマルチモーダル動画の方向性に着想を得た独立系オンライン AI 動画生成ツールです。プロンプトや画像から映画的な動画を素早く作成できます。",
        },
        {
          question: "Gemini Omni 風の動画ツールで何を作れますか？",
          answer:
            "SNS クリップ、商品デモ、映画的なシーン案、教育用解説、アバター風動画、参照画像からのアニメーションなどを作成できます。",
        },
        {
          question: "無料で始められますか？",
          answer:
            "はい。GeminiOmni には無料で始められる導線があり、AI 動画生成を試してから有料プランや大きなクレジットパックを選べます。",
        },
        {
          question: "GeminiOmni は Google と提携していますか？",
          answer:
            "いいえ。GeminiOmni.tv は独立した製品であり、Google、Gemini、Google DeepMind とは提携していません。",
        },
      ],
    },
  },
  ko: {
    metadata: {
      title: "무료 Gemini Omni AI 비디오 생성기",
      description:
        "GeminiOmni로 영화 같은 AI 비디오를 온라인에서 만드세요. 텍스트 프롬프트와 이미지를 Gemini Omni 스타일 영상으로 변환할 수 있습니다.",
      keywords:
        "Gemini Omni, Gemini Omni AI 비디오 생성기, 무료 AI 비디오 생성기, 텍스트 투 비디오, 이미지 투 비디오, 멀티모달 비디오 생성기",
    },
    hero: {
      title: "무료 Gemini Omni AI 비디오 생성기",
      description:
        "텍스트 프롬프트와 이미지로 영화 같은 AI 비디오를 만드세요. GeminiOmni는 Gemini Omni 스타일의 멀티모달 창작을 크리에이터, 마케터, 교육자, 스토리텔러를 위한 빠른 온라인 생성기로 바꿉니다.",
      primaryCta: "무료 AI 비디오 생성",
      secondaryCta: "이미지로 비디오 만들기",
      highlights: [
        "영화적인 아이디어를 텍스트에서 비디오로",
        "이미지 참조로 비주얼 방향 제어",
        "완성된 결과는 기록, 재생, 다운로드 지원",
      ],
      imageAlt: "GeminiOmni AI 비디오 생성기 비주얼",
      preview: [
        {
          label: "프롬프트",
          value: "빛을 비디오로 빚어내는 유리 질감의 AI 영화 제작자를 보여주는 시네마틱 장면",
        },
        {
          label: "참조",
          value: "이미지, 카메라 방향, 장면 분위기",
        },
        {
          label: "출력",
          value: "재생 및 다운로드 가능한 AI 비디오",
        },
      ],
    },
    model: {
      title: "멀티모달 AI 비디오 제작을 위한 새로운 모델 방향.",
      description:
        "Google은 Gemini Omni를 여러 입력 유형에서 창작할 수 있고, 우선 비디오에 초점을 맞춘 모델로 설명합니다. 핵심 기능은 자연어 편집, 이미지·텍스트·오디오·비디오 참조, 세계 지식에 기반한 장면 생성입니다. GeminiOmni는 이 방향을 지금 비디오를 만들고 싶은 사람들을 위한 쉬운 생성 흐름으로 제공합니다.",
    },
    capabilities: [
      {
        title: "어떤 입력이든 창작 방향으로",
        description:
          "Gemini Omni의 공식 방향은 텍스트, 이미지, 오디오, 비디오 입력을 하나의 일관된 비디오 제작 흐름으로 결합하는 데 있습니다.",
      },
      {
        title: "자연어 비디오 편집",
        description:
          "장면을 설명한 뒤 대화하듯 액션, 카메라, 피사체, 스타일, 효과를 조정할 수 있습니다.",
      },
      {
        title: "세계 지식 기반 시네마틱 출력",
        description:
          "현실적인 물리, 역사적 맥락, 제품 디테일, 설명 영상, 카메라 언어를 프롬프트로 제어해 더 구조적인 비디오를 만듭니다.",
      },
    ],
    workflow: {
      title: "네 단계로 온라인 AI 비디오를 만드세요.",
      description:
        "촬영 장비, 편집 타임라인, 제작 팀이 필요 없습니다. 프롬프트나 참조 이미지에서 시작해 비디오를 생성하고 원하는 장면이 될 때까지 반복하세요.",
      cta: "제작 시작",
      steps: [
        {
          title: "장면 설명",
          description:
            "피사체, 배경, 움직임, 카메라 각도, 스타일, 대사, 분위기를 하나의 명확한 프롬프트로 작성하세요.",
        },
        {
          title: "참조 이미지 추가",
          description:
            "업로드한 이미지로 정체성, 구도, 제품 외형, 스타일을 안내하세요.",
        },
        {
          title: "생성 설정 조정",
          description:
            "사용 가능한 워크플로, 화면비, 길이, 품질, 모델 옵션을 선택하세요.",
        },
        {
          title: "미리보기 및 다운로드",
          description:
            "완성된 결과를 생성 기록에 보관하고, 재생하고, 다운로드한 뒤 다음 버전으로 반복하세요.",
        },
      ],
    },
    useCases: {
      title: "캠페인, 설명 영상, 콘셉트, 소셜 클립을 위한 하나의 생성기.",
      description:
        "GeminiOmni로 아이디어에서 완성도 있는 AI 비디오 초안까지 빠르게 이동하세요. 단순 뉴스 페이지가 아니라 결과물이 필요한 크리에이터를 위한 도구입니다.",
      items: [
        "숏폼 광고와 UGC 콘셉트",
        "제품 데모와 출시 영상",
        "이미지 기반 캐릭터 모먼트",
        "교육용 설명 영상",
        "뮤직비디오 스토리보드",
        "Reels, Shorts, TikTok 클립",
      ],
    },
    faq: {
      title: "Gemini Omni AI 비디오 생성기 질문.",
      independentNotice:
        "GeminiOmni.tv는 독립 제품이며 Google, Gemini 또는 Google DeepMind와 제휴되어 있지 않습니다.",
      items: [
        {
          question: "Gemini Omni AI 비디오 생성기는 무엇인가요?",
          answer:
            "GeminiOmni는 Google Gemini Omni의 멀티모달 비디오 방향에서 영감을 받은 독립 온라인 AI 비디오 생성기입니다. 프롬프트와 이미지를 빠른 브라우저 기반 흐름으로 영화 같은 영상으로 바꿔줍니다.",
        },
        {
          question: "Gemini Omni 스타일 비디오 도구로 무엇을 만들 수 있나요?",
          answer:
            "소셜 클립, 제품 데모, 시네마틱 장면 콘셉트, 교육 설명 영상, 아바타 스타일 영상, 이미지 기반 애니메이션을 만들 수 있습니다.",
        },
        {
          question: "무료로 시작할 수 있나요?",
          answer:
            "네. GeminiOmni는 무료 시작 경로를 제공하므로 유료 플랜이나 더 큰 크레딧 패키지를 선택하기 전에 AI 비디오 생성을 체험할 수 있습니다.",
        },
        {
          question: "GeminiOmni는 Google과 관련이 있나요?",
          answer:
            "아니요. GeminiOmni.tv는 독립 제품이며 Google, Gemini 또는 Google DeepMind와 제휴되어 있지 않습니다.",
        },
      ],
    },
  },
  de: {
    metadata: {
      title: "Kostenloser Gemini Omni KI-Videogenerator",
      description:
        "Erstelle mit GeminiOmni filmische KI-Videos online. Verwandle Text-Prompts und Bilder in Videos im Gemini-Omni-Stil.",
      keywords:
        "Gemini Omni, Gemini Omni KI Videogenerator, kostenloser KI Videogenerator, Text zu Video KI, Bild zu Video KI, multimodaler Videogenerator",
    },
    hero: {
      title: "Kostenloser Gemini Omni KI-Videogenerator",
      description:
        "Erstelle filmische KI-Videos aus Text-Prompts und Bildern. GeminiOmni macht multimodale Erstellung im Gemini-Omni-Stil zu einem schnellen Online-Generator für Creator, Marketingteams, Lehrende und Storyteller.",
      primaryCta: "KI-Video kostenlos erstellen",
      secondaryCta: "Bild zu Video",
      highlights: [
        "Text-zu-Video für filmische Prompt-Ideen",
        "Bild-zu-Video für visuelle Referenzen",
        "Verlauf, Wiedergabe und Download nach Fertigstellung",
      ],
      imageAlt: "GeminiOmni KI-Videogenerator Visual",
      preview: [
        {
          label: "Prompt",
          value: "Eine filmische Enthüllung eines gläsernen KI-Filmemachers, der Licht zu Video formt",
        },
        {
          label: "Referenz",
          value: "Bild, Kamerarichtung, Szenenstimmung",
        },
        {
          label: "Output",
          value: "Abspielbares KI-Video bereit zum Download",
        },
      ],
    },
    model: {
      title: "Eine neue Modellrichtung für multimodale KI-Videoproduktion.",
      description:
        "Google beschreibt Gemini Omni als Modell, das aus vielen Eingabetypen erstellen kann, zunächst mit Fokus auf Video. Zu den Kernfähigkeiten zählen Bearbeitung per natürlicher Sprache, Referenzen aus Bild, Text, Audio und Video sowie szenische Generierung mit Weltwissen. GeminiOmni macht diese Richtung zu einem zugänglichen Generator-Workflow für alle, die jetzt Videos erstellen möchten.",
    },
    capabilities: [
      {
        title: "Kreative Steuerung aus jeder Eingabe",
        description:
          "Die offizielle Richtung von Gemini Omni verbindet Text-, Bild-, Audio- und Videoeingaben in einem konsistenten Videoproduktionsfluss.",
      },
      {
        title: "Videobearbeitung per natürlicher Sprache",
        description:
          "Beschreibe die Szene und verfeinere Action, Kamera, Motive, Stil und Effekte im Gespräch, statt die Idee neu aufzubauen.",
      },
      {
        title: "Filmische Ausgabe mit Weltwissen",
        description:
          "Nutze Prompts für realistische Physik, historischen Kontext, Produktdetails, Erklärungen und Kamerasprache, um strukturiertere Videos zu erstellen.",
      },
    ],
    workflow: {
      title: "Erstelle KI-Videos online in vier einfachen Schritten.",
      description:
        "Keine Kameraausrüstung, Timeline oder Produktionsteam nötig. Starte mit einem Prompt oder Referenzbild, generiere ein Video und iteriere, bis die Szene passt.",
      cta: "Jetzt erstellen",
      steps: [
        {
          title: "Szene beschreiben",
          description:
            "Formuliere Motiv, Setting, Bewegung, Kamerawinkel, Stil, Dialog und Stimmung in einem klaren Prompt.",
        },
        {
          title: "Referenzbild hinzufügen",
          description:
            "Steuere Identität, Komposition, Produktlook oder Stil mit einer hochgeladenen visuellen Referenz.",
        },
        {
          title: "Generierung einstellen",
          description:
            "Wähle Workflow, Seitenverhältnis, Dauer, Qualität und Modelloptionen für deinen Clip.",
        },
        {
          title: "Vorschau und Download",
          description:
            "Speichere fertige Ergebnisse im Verlauf, spiele das Video ab und lade es herunter.",
        },
      ],
    },
    useCases: {
      title: "Ein Generator für Kampagnen, Erklärvideos, Konzepte und Social Clips.",
      description:
        "Mit GeminiOmni kommst du schnell von der Idee zu einem polierten KI-Videoentwurf. Es ist für Creator gebaut, die Output brauchen, nicht nur Nachrichten.",
      items: [
        "Short-Form-Ads und UGC-Konzepte",
        "Produktdemos und Launch-Videos",
        "Bild-zu-Video-Charaktermomente",
        "Lehr- und Erklärvideos",
        "Musikvideo-Storyboards",
        "Reels, Shorts und TikTok-Clips",
      ],
    },
    faq: {
      title: "Fragen zum Gemini Omni KI-Videogenerator.",
      independentNotice:
        "GeminiOmni.tv ist ein unabhängiges Produkt und nicht mit Google, Gemini oder Google DeepMind verbunden.",
      items: [
        {
          question: "Was ist der Gemini Omni KI-Videogenerator?",
          answer:
            "GeminiOmni ist ein unabhängiger Online-KI-Videogenerator, inspiriert von Google Gemini Omnis multimodaler Videorichtung. Er hilft, Prompts und Bilder in einem schnellen Browser-Workflow in filmische Videos zu verwandeln.",
        },
        {
          question: "Was kann ich mit Gemini-Omni-ähnlichen Videotools erstellen?",
          answer:
            "Du kannst Social Clips, Produktdemos, filmische Szenenkonzepte, Erklärvideos, Avatar-Videos und Bild-zu-Video-Animationen erstellen.",
        },
        {
          question: "Kann ich kostenlos starten?",
          answer:
            "Ja. GeminiOmni bietet einen kostenlosen Einstieg, damit du KI-Videogenerierung testen kannst, bevor du einen Plan oder ein größeres Credit-Paket wählst.",
        },
        {
          question: "Ist GeminiOmni mit Google verbunden?",
          answer:
            "Nein. GeminiOmni.tv ist ein unabhängiges Produkt und nicht mit Google, Gemini oder Google DeepMind verbunden.",
        },
      ],
    },
  },
  fr: {
    metadata: {
      title: "Générateur vidéo IA Gemini Omni gratuit",
      description:
        "Créez des vidéos IA cinématographiques avec GeminiOmni. Transformez des prompts texte et des images en vidéos de style Gemini Omni.",
      keywords:
        "Gemini Omni, générateur vidéo IA Gemini Omni, générateur vidéo IA gratuit, texte en vidéo IA, image en vidéo IA, générateur vidéo multimodal",
    },
    hero: {
      title: "Générateur vidéo IA Gemini Omni gratuit",
      description:
        "Créez des vidéos IA cinématographiques à partir de prompts texte et d'images. GeminiOmni transforme la création multimodale de style Gemini Omni en générateur en ligne rapide pour créateurs, marketers, enseignants et storytellers.",
      primaryCta: "Générer une vidéo IA gratuite",
      secondaryCta: "Image vers vidéo",
      highlights: [
        "Texte vers vidéo pour des idées cinématographiques",
        "Image vers vidéo pour guider les références visuelles",
        "Historique, lecture et téléchargement des résultats",
      ],
      imageAlt: "Visuel du générateur vidéo IA GeminiOmni",
      preview: [
        {
          label: "Prompt",
          value: "Révélation cinématographique d'un réalisateur IA en verre façonnant la lumière en vidéo",
        },
        {
          label: "Référence",
          value: "Image, direction caméra, ambiance de scène",
        },
        {
          label: "Sortie",
          value: "Vidéo IA lisible prête à télécharger",
        },
      ],
    },
    model: {
      title: "Une nouvelle direction de modèle pour la vidéo IA multimodale.",
      description:
        "Google décrit Gemini Omni comme un modèle capable de créer à partir de nombreux types d'entrées, en commençant par la vidéo. Ses capacités clés incluent l'édition en langage naturel, les références image, texte, audio et vidéo, et la génération de scènes ancrée dans la connaissance du monde. GeminiOmni transforme cette direction en workflow accessible pour créer des vidéos maintenant.",
    },
    capabilities: [
      {
        title: "Direction créative depuis toute entrée",
        description:
          "La direction officielle de Gemini Omni consiste à combiner texte, image, audio et vidéo dans un flux cohérent de création vidéo.",
      },
      {
        title: "Édition vidéo en langage naturel",
        description:
          "Décrivez la scène, puis affinez l'action, la caméra, les sujets, le style et les effets de façon conversationnelle.",
      },
      {
        title: "Sortie cinématographique avec connaissance du monde",
        description:
          "Utilisez des prompts pour contrôler physique réaliste, contexte historique, détails produit, explications et langage caméra.",
      },
    ],
    workflow: {
      title: "Créez des vidéos IA en ligne en quatre étapes simples.",
      description:
        "Aucun matériel de tournage, timeline de montage ou équipe de production n'est nécessaire. Partez d'un prompt ou d'une image de référence, générez une vidéo et itérez.",
      cta: "Commencer à créer",
      steps: [
        {
          title: "Décrire la scène",
          description:
            "Rédigez le sujet, le décor, le mouvement, l'angle caméra, le style, le dialogue et l'ambiance dans un prompt clair.",
        },
        {
          title: "Ajouter une image de référence",
          description:
            "Guidez identité, composition, apparence produit ou style avec une référence visuelle importée.",
        },
        {
          title: "Ajuster les réglages",
          description:
            "Choisissez le workflow disponible, le ratio, la durée, la qualité et les options de modèle.",
        },
        {
          title: "Prévisualiser et télécharger",
          description:
            "Conservez les résultats dans votre historique, lisez la vidéo, téléchargez-la et itérez.",
        },
      ],
    },
    useCases: {
      title: "Un générateur pour campagnes, explicatifs, concepts et clips sociaux.",
      description:
        "Avec GeminiOmni, passez rapidement d'une idée à un brouillon vidéo IA soigné. C'est un outil pour créer, pas une page d'actualité passive.",
      items: [
        "Publicités courtes et concepts UGC",
        "Démos produit et vidéos de lancement",
        "Moments personnage image vers vidéo",
        "Vidéos explicatives pédagogiques",
        "Storyboards de clips musicaux",
        "Reels, Shorts et clips TikTok",
      ],
    },
    faq: {
      title: "Questions sur le générateur vidéo IA Gemini Omni.",
      independentNotice:
        "GeminiOmni.tv est un produit indépendant et n'est pas affilié à Google, Gemini ou Google DeepMind.",
      items: [
        {
          question: "Qu'est-ce que le générateur vidéo IA Gemini Omni ?",
          answer:
            "GeminiOmni est un générateur vidéo IA en ligne indépendant, inspiré de la direction multimodale vidéo de Google Gemini Omni. Il aide à transformer prompts et images en vidéos cinématographiques dans le navigateur.",
        },
        {
          question: "Que puis-je créer avec des outils vidéo de style Gemini Omni ?",
          answer:
            "Vous pouvez créer des clips sociaux, démos produit, concepts de scènes cinématographiques, explicatifs, vidéos avatar et animations image vers vidéo.",
        },
        {
          question: "Puis-je commencer gratuitement ?",
          answer:
            "Oui. GeminiOmni propose un accès de départ gratuit pour tester la génération vidéo IA avant de choisir un plan ou un pack de crédits.",
        },
        {
          question: "GeminiOmni est-il affilié à Google ?",
          answer:
            "Non. GeminiOmni.tv est un produit indépendant et n'est pas affilié à Google, Gemini ou Google DeepMind.",
        },
      ],
    },
  },
  es: {
    metadata: {
      title: "Generador de video IA Gemini Omni gratis",
      description:
        "Crea videos IA cinematográficos con GeminiOmni. Convierte prompts de texto e imágenes en videos estilo Gemini Omni.",
      keywords:
        "Gemini Omni, generador de video IA Gemini Omni, generador de video IA gratis, texto a video IA, imagen a video IA, generador de video multimodal",
    },
    hero: {
      title: "Generador de video IA Gemini Omni gratis",
      description:
        "Crea videos IA cinematográficos desde prompts de texto e imágenes. GeminiOmni convierte la creación multimodal estilo Gemini Omni en un generador online rápido para creadores, marketers, educadores y narradores.",
      primaryCta: "Generar video IA gratis",
      secondaryCta: "Imagen a video",
      highlights: [
        "Texto a video para ideas cinematográficas",
        "Imagen a video para referencias visuales",
        "Historial, reproducción y descarga cuando el resultado está listo",
      ],
      imageAlt: "Visual del generador de video IA GeminiOmni",
      preview: [
        {
          label: "Prompt",
          value: "Una revelación cinematográfica de un cineasta IA de vidrio dando forma a la luz como video",
        },
        {
          label: "Referencia",
          value: "Imagen, dirección de cámara, ambiente de escena",
        },
        {
          label: "Salida",
          value: "Video IA reproducible listo para descargar",
        },
      ],
    },
    model: {
      title: "Una nueva dirección de modelo para creación de video IA multimodal.",
      description:
        "Google describe Gemini Omni como un modelo que puede crear desde muchos tipos de entrada, empezando por video. Sus capacidades principales son edición en lenguaje natural, referencias de imagen, texto, audio y video, y generación de escenas basada en conocimiento del mundo. GeminiOmni convierte esa dirección en un flujo accesible para crear videos ahora.",
    },
    capabilities: [
      {
        title: "Dirección creativa desde cualquier entrada",
        description:
          "La dirección oficial de Gemini Omni combina texto, imagen, audio y video en un flujo coherente de creación audiovisual.",
      },
      {
        title: "Edición de video en lenguaje natural",
        description:
          "Describe la escena y refina acción, cámara, sujetos, estilo y efectos de forma conversacional.",
      },
      {
        title: "Salida cinematográfica con conocimiento del mundo",
        description:
          "Usa prompts para física realista, contexto histórico, detalles de producto, explicaciones y lenguaje de cámara.",
      },
    ],
    workflow: {
      title: "Crea videos IA online en cuatro pasos simples.",
      description:
        "No necesitas equipo de filmación, línea de edición ni equipo de producción. Empieza con un prompt o imagen de referencia, genera un video e itera.",
      cta: "Empezar a crear",
      steps: [
        {
          title: "Describe la escena",
          description:
            "Escribe el sujeto, entorno, movimiento, ángulo de cámara, estilo, diálogo y tono en un prompt claro.",
        },
        {
          title: "Añade una imagen de referencia",
          description:
            "Guía identidad, composición, apariencia de producto o estilo con una referencia visual cargada.",
        },
        {
          title: "Ajusta la generación",
          description:
            "Elige flujo disponible, relación de aspecto, duración, calidad y opciones de modelo.",
        },
        {
          title: "Previsualiza y descarga",
          description:
            "Guarda resultados en tu historial, reproduce el video, descárgalo e itera.",
        },
      ],
    },
    useCases: {
      title: "Un generador para campañas, explicadores, conceptos y clips sociales.",
      description:
        "Usa GeminiOmni para pasar rápido de una idea a un borrador de video IA pulido. Está hecho para creadores que necesitan resultados.",
      items: [
        "Anuncios cortos y conceptos UGC",
        "Demos de producto y videos de lanzamiento",
        "Momentos de personaje desde imagen a video",
        "Explicadores educativos",
        "Storyboards de videos musicales",
        "Reels, Shorts y clips de TikTok",
      ],
    },
    faq: {
      title: "Preguntas sobre el generador de video IA Gemini Omni.",
      independentNotice:
        "GeminiOmni.tv es un producto independiente y no está afiliado a Google, Gemini ni Google DeepMind.",
      items: [
        {
          question: "¿Qué es el generador de video IA Gemini Omni?",
          answer:
            "GeminiOmni es un generador de video IA online independiente inspirado en la dirección multimodal de Google Gemini Omni. Ayuda a convertir prompts e imágenes en videos cinematográficos con un flujo rápido en el navegador.",
        },
        {
          question: "¿Qué puedo crear con herramientas de video estilo Gemini Omni?",
          answer:
            "Puedes crear clips sociales, demos de producto, conceptos de escenas cinematográficas, explicadores, videos tipo avatar y animaciones imagen a video.",
        },
        {
          question: "¿Puedo empezar gratis?",
          answer:
            "Sí. GeminiOmni ofrece una ruta inicial gratuita para probar la generación de video IA antes de elegir un plan o paquete de créditos.",
        },
        {
          question: "¿GeminiOmni está afiliado a Google?",
          answer:
            "No. GeminiOmni.tv es un producto independiente y no está afiliado a Google, Gemini ni Google DeepMind.",
        },
      ],
    },
  },
  pt: {
    metadata: {
      title: "Gerador de vídeo IA Gemini Omni gratuito",
      description:
        "Crie vídeos IA cinematográficos com GeminiOmni. Transforme prompts de texto e imagens em vídeos no estilo Gemini Omni.",
      keywords:
        "Gemini Omni, gerador de vídeo IA Gemini Omni, gerador de vídeo IA grátis, texto para vídeo IA, imagem para vídeo IA, gerador de vídeo multimodal",
    },
    hero: {
      title: "Gerador de vídeo IA Gemini Omni gratuito",
      description:
        "Crie vídeos IA cinematográficos a partir de prompts de texto e imagens. GeminiOmni transforma criação multimodal no estilo Gemini Omni em um gerador online rápido para criadores, equipes de marketing, educadores e narradores.",
      primaryCta: "Gerar vídeo IA grátis",
      secondaryCta: "Imagem para vídeo",
      highlights: [
        "Texto para vídeo para ideias cinematográficas",
        "Imagem para vídeo com referências visuais",
        "Histórico, reprodução e download quando o resultado fica pronto",
      ],
      imageAlt: "Visual do gerador de vídeo IA GeminiOmni",
      preview: [
        {
          label: "Prompt",
          value: "Uma revelação cinematográfica de um cineasta IA de vidro moldando luz em vídeo",
        },
        {
          label: "Referência",
          value: "Imagem, direção de câmera, clima da cena",
        },
        {
          label: "Saída",
          value: "Vídeo IA reproduzível pronto para download",
        },
      ],
    },
    model: {
      title: "Uma nova direção de modelo para criação de vídeo IA multimodal.",
      description:
        "O Google descreve Gemini Omni como um modelo capaz de criar a partir de muitos tipos de entrada, começando por vídeo. As capacidades principais incluem edição em linguagem natural, referências de imagem, texto, áudio e vídeo, e geração de cenas baseada em conhecimento de mundo. GeminiOmni transforma essa direção em um fluxo acessível para criar vídeos agora.",
    },
    capabilities: [
      {
        title: "Direção criativa a partir de qualquer entrada",
        description:
          "A direção oficial do Gemini Omni combina texto, imagem, áudio e vídeo em um fluxo coerente de criação de vídeo.",
      },
      {
        title: "Edição de vídeo em linguagem natural",
        description:
          "Descreva a cena e refine ação, câmera, sujeitos, estilo e efeitos de forma conversacional.",
      },
      {
        title: "Resultado cinematográfico com conhecimento de mundo",
        description:
          "Use prompts para física realista, contexto histórico, detalhes de produto, explicações e linguagem de câmera.",
      },
    ],
    workflow: {
      title: "Crie vídeos IA online em quatro passos simples.",
      description:
        "Sem equipamento de filmagem, timeline de edição ou equipe de produção. Comece com um prompt ou imagem de referência, gere o vídeo e itere.",
      cta: "Começar a criar",
      steps: [
        {
          title: "Descreva a cena",
          description:
            "Escreva sujeito, cenário, movimento, ângulo de câmera, estilo, diálogo e clima em um prompt claro.",
        },
        {
          title: "Adicione uma imagem de referência",
          description:
            "Oriente identidade, composição, aparência do produto ou estilo com uma referência visual enviada.",
        },
        {
          title: "Ajuste as configurações",
          description:
            "Escolha fluxo disponível, proporção, duração, qualidade e opções de modelo.",
        },
        {
          title: "Pré-visualize e baixe",
          description:
            "Guarde os resultados no histórico, reproduza o vídeo, baixe e continue iterando.",
        },
      ],
    },
    useCases: {
      title: "Um gerador para campanhas, explicativos, conceitos e clipes sociais.",
      description:
        "Use GeminiOmni para ir rapidamente de uma ideia a um rascunho de vídeo IA polido. É feito para criadores que precisam de resultado.",
      items: [
        "Anúncios curtos e conceitos UGC",
        "Demonstrações de produto e vídeos de lançamento",
        "Momentos de personagem com imagem para vídeo",
        "Vídeos educativos explicativos",
        "Storyboards de clipes musicais",
        "Reels, Shorts e clipes TikTok",
      ],
    },
    faq: {
      title: "Perguntas sobre o gerador de vídeo IA Gemini Omni.",
      independentNotice:
        "GeminiOmni.tv é um produto independente e não é afiliado ao Google, Gemini ou Google DeepMind.",
      items: [
        {
          question: "O que é o Gerador de Vídeo IA Gemini Omni?",
          answer:
            "GeminiOmni é um gerador de vídeo IA online independente inspirado na direção multimodal de vídeo do Google Gemini Omni. Ele ajuda a transformar prompts e imagens em vídeos cinematográficos em um fluxo rápido no navegador.",
        },
        {
          question: "O que posso criar com ferramentas de vídeo estilo Gemini Omni?",
          answer:
            "Você pode criar clipes sociais, demos de produto, conceitos de cenas cinematográficas, explicativos, vídeos tipo avatar e animações de imagem para vídeo.",
        },
        {
          question: "Posso começar gratuitamente?",
          answer:
            "Sim. GeminiOmni oferece um caminho gratuito para testar geração de vídeo IA antes de escolher um plano pago ou pacote maior de créditos.",
        },
        {
          question: "GeminiOmni é afiliado ao Google?",
          answer:
            "Não. GeminiOmni.tv é um produto independente e não é afiliado ao Google, Gemini ou Google DeepMind.",
        },
      ],
    },
  },
  ru: {
    metadata: {
      title: "Бесплатный ИИ-видеогенератор Gemini Omni",
      description:
        "Создавайте кинематографичные ИИ-видео с GeminiOmni. Превращайте текстовые промпты и изображения в видео в стиле Gemini Omni.",
      keywords:
        "Gemini Omni, ИИ видеогенератор Gemini Omni, бесплатный ИИ видеогенератор, текст в видео ИИ, изображение в видео ИИ, мультимодальный видеогенератор",
    },
    hero: {
      title: "Бесплатный ИИ-видеогенератор Gemini Omni",
      description:
        "Создавайте кинематографичные ИИ-видео из текстовых промптов и изображений. GeminiOmni превращает мультимодальное создание в стиле Gemini Omni в быстрый онлайн-генератор для авторов, маркетологов, преподавателей и рассказчиков.",
      primaryCta: "Создать ИИ-видео бесплатно",
      secondaryCta: "Изображение в видео",
      highlights: [
        "Текст в видео для кинематографичных идей",
        "Изображение в видео для визуальных референсов",
        "История, воспроизведение и скачивание готовых результатов",
      ],
      imageAlt: "Визуал ИИ-видеогенератора GeminiOmni",
      preview: [
        {
          label: "Промпт",
          value: "Кинематографичное раскрытие стеклянного ИИ-режиссера, превращающего свет в видео",
        },
        {
          label: "Референс",
          value: "Изображение, направление камеры, настроение сцены",
        },
        {
          label: "Результат",
          value: "Готовое к скачиванию воспроизводимое ИИ-видео",
        },
      ],
    },
    model: {
      title: "Новое направление моделей для мультимодального ИИ-видео.",
      description:
        "Google описывает Gemini Omni как модель, которая может создавать из разных типов входных данных, начиная с видео. Главные возможности: редактирование на естественном языке, референсы из изображений, текста, аудио и видео, а также генерация сцен с учетом знаний о мире. GeminiOmni превращает это направление в понятный workflow для тех, кто хочет создавать видео уже сейчас.",
    },
    capabilities: [
      {
        title: "Креативное управление из любого ввода",
        description:
          "Официальное направление Gemini Omni объединяет текст, изображения, аудио и видео в единый связный процесс создания видео.",
      },
      {
        title: "Редактирование видео естественным языком",
        description:
          "Опишите сцену, затем уточняйте действие, камеру, объекты, стиль и эффекты в разговорном формате.",
      },
      {
        title: "Кинематографичный результат со знанием мира",
        description:
          "Используйте промпты для реалистичной физики, исторического контекста, деталей продукта, объяснений и языка камеры.",
      },
    ],
    workflow: {
      title: "Создавайте ИИ-видео онлайн в четыре простых шага.",
      description:
        "Не нужны съемочное оборудование, монтажная шкала или команда. Начните с промпта или референса, создайте видео и итеративно улучшайте сцену.",
      cta: "Начать создание",
      steps: [
        {
          title: "Опишите сцену",
          description:
            "Укажите объект, окружение, движение, ракурс камеры, стиль, диалог и настроение в одном понятном промпте.",
        },
        {
          title: "Добавьте референс",
          description:
            "Задайте идентичность, композицию, внешний вид продукта или стиль с помощью загруженного изображения.",
        },
        {
          title: "Настройте генерацию",
          description:
            "Выберите доступный workflow, соотношение сторон, длительность, качество и параметры модели.",
        },
        {
          title: "Просмотрите и скачайте",
          description:
            "Сохраняйте готовые результаты в истории, воспроизводите видео, скачивайте и создавайте следующую версию.",
        },
      ],
    },
    useCases: {
      title: "Один генератор для кампаний, объясняющих роликов, концептов и соцсетей.",
      description:
        "GeminiOmni помогает быстро перейти от идеи к готовому черновику ИИ-видео. Это инструмент для авторов, которым нужен результат, а не пассивная новостная страница.",
      items: [
        "Короткая реклама и UGC-концепты",
        "Демо продуктов и launch-видео",
        "Персонажные моменты из изображения в видео",
        "Обучающие объясняющие ролики",
        "Раскадровки музыкальных клипов",
        "Reels, Shorts и TikTok-клипы",
      ],
    },
    faq: {
      title: "Вопросы об ИИ-видеогенераторе Gemini Omni.",
      independentNotice:
        "GeminiOmni.tv — независимый продукт и не связан с Google, Gemini или Google DeepMind.",
      items: [
        {
          question: "Что такое ИИ-видеогенератор Gemini Omni?",
          answer:
            "GeminiOmni — независимый онлайн ИИ-видеогенератор, вдохновленный мультимодальным видео-направлением Google Gemini Omni. Он помогает превращать промпты и изображения в кинематографичные видео через быстрый браузерный workflow.",
        },
        {
          question: "Что можно создать с видео-инструментами в стиле Gemini Omni?",
          answer:
            "Можно создавать клипы для соцсетей, демо продуктов, кинематографичные концепты сцен, обучающие ролики, avatar-видео и анимации из изображения в видео.",
        },
        {
          question: "Можно начать бесплатно?",
          answer:
            "Да. GeminiOmni предлагает бесплатный старт, чтобы вы могли попробовать ИИ-видеогенерацию перед выбором платного плана или пакета кредитов.",
        },
        {
          question: "GeminiOmni связан с Google?",
          answer:
            "Нет. GeminiOmni.tv — независимый продукт и не связан с Google, Gemini или Google DeepMind.",
        },
      ],
    },
  },
};

export function getGeminiOmniLandingCopy(locale: string): LandingLocaleCopy {
  return landingCopy[locale] || landingCopy[defaultLocale];
}
