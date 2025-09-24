"use client";
import { RainbowButton } from "@/components/ui/rainbow-button";
import { NanoBananaCtaProps } from "@/types/pages/nano-banana";

/**
 * NanoBanana CTA 组件
 * 提供吸引人的行动召唤区域，带有背景图片和彩虹按钮效果
 */
export default function NanoBananaCta({ section }: NanoBananaCtaProps) {
  // 提供默认值以防止潜在的渲染错误
  const title = section?.title || "开始你的创意之旅";
  const buttonText = section?.buttonText || "立即尝试";

  /**
   * 处理按钮点击事件
   * 平滑滚动到页面顶部
   */
  const handleButtonClick = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <section 
      className="relative w-full overflow-hidden transition-all duration-300"
      aria-labelledby="cta-title"
    >
      <div 
        className='relative flex min-h-[400px] items-center justify-center bg-[url("/imgs/cta-bg.png")] bg-cover bg-center bg-no-repeat py-20 text-center'
        // 优化背景图片加载
        style={{
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* 半透明覆盖层，提升文本可读性 */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
        
        <div className="relative z-10 mx-auto max-w-4xl px-8">
          <h2 
            id="cta-title"
            className="mb-10 text-balance text-4xl font-bold text-white md:text-6xl lg:text-7xl tracking-tight leading-tight"
          >
            {title}
          </h2>
          
          {/* 带有增强效果的CTA按钮 */}
          <RainbowButton 
            onClick={handleButtonClick}
            className="transition-transform duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white/50"
            aria-label={`${buttonText} - 点击返回页面顶部`}
          >
            {buttonText}
          </RainbowButton>
        </div>
      </div>
    </section>
  );
}
