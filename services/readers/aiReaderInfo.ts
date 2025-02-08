export async function getAiReaderInfo(readerId: string, locale: string = 'zh') {
  const info = {
    zh: {
      name: "清风明月",
      avatar: "/qingfeng.png",
      description: "精通八字命理，专注于人生方向指引的AI算命大师。融合传统易学与现代分析，为您提供独到见解。"
    },
    en: {
      name: "Teacher QingFeng",
      avatar: "/qingfeng.png",
      description: "An AI destiny master specializing in BaZi analysis and life guidance. Combining traditional Chinese metaphysics with modern analysis to provide unique insights."
    }
  };

  return info[locale as keyof typeof info] || info.en;
}
  
  
  