export async function getAiReaderInfo(readerId: string, locale: string = "zh") {
  const info = {
    zh: {
      name: "清风明月",
      avatar: "/qingfeng.png",
      description:
        "精通八字命理，专注于人生方向指引的AI算命大师。融合传统易学与现代分析，为您提供独到见解。",
    },
    en: {
      name: "Qing Feng",
      avatar: "/qingfeng.png",
      description:
        "An AI destiny master specializing in BaZi analysis and life guidance. Combining traditional Chinese metaphysics with modern analysis to provide unique insights.",
    },
    ja: {
      name: "清風明月",
      avatar: "/qingfeng.png",
      description:
        "八字命理の専門家で、人生の方向を指導するAI算命師。伝統的な易学と現代分析を融合し、独到の見解を提供します。",
    },
    ko: {
      name: "화랑달빛",
      avatar: "/qingfeng.png",
      description:
        "바지 명리 전문가로, 인생 방향을 안내하는 AI 운세사。전통적인 중국 신화와 현대 분석을 결합하여 독특한 인사이트를 제공합니다.",
    },
    "zh-TW": {
      name: "清風明月",
      avatar: "/qingfeng.png",
      description:
        "精通八字命理，專注於人生方向指引的AI算命大師。融合傳統易學與現代分析，為您提供獨到見解。",
    },
  };

  return info[locale as keyof typeof info] || info.en;
}

export async function getAiIChingReaderInfo(
  readerId: string,
  locale: string = "zh"
) {
  const info = {
    zh: {
      name: "清风明月",
      avatar: "/qingfeng.png",
      description:
        "精通八字命理，专注于人生方向指引的AI算命大师。融合传统易学与现代分析，为您提供独到见解。",
    },
    en: {
      name: "Qing Feng",
      avatar: "/qingfeng.png",
      description:
        "An AI destiny master specializing in BaZi analysis and life guidance. Combining traditional Chinese metaphysics with modern analysis to provide unique insights.",
    },
    ja: {
      name: "清風明月",
      avatar: "/qingfeng.png",
      description:
        "八字命理の専門家で、人生の方向を指導するAI算命師。伝統的な易学と現代分析を融合し、独到の見解を提供します。",
    },
    ko: {
      name: "화랑달빛",
      avatar: "/qingfeng.png",
      description:
        "바지 명리 전문가로, 인생 방향을 안내하는 AI 운세사。전통적인 중국 신화와 현대 분석을 결합하여 독특한 인사이트를 제공합니다.",
    },
    "zh-TW": {
      name: "清風明月",
      avatar: "/qingfeng.png",
      description:
        "精通八字命理，專注於人生方向指引的AI算命大師。融合傳統易學與現代分析，為您提供獨到見解。",
    },
  };

  return info[locale as keyof typeof info] || info.en;
}
