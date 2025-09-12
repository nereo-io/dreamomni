"use client";

interface HighlightFeatureProps {
  feature: string;
}

export default function HighlightFeature({ feature }: HighlightFeatureProps) {
  // 解析feature字符串，查找并高亮数字
  const parts = feature.split(/(<highlight>.*?<\/highlight>)/g);
  
  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith('<highlight>') && part.endsWith('</highlight>')) {
          // 提取高亮内容
          const content = part.replace('<highlight>', '').replace('</highlight>', '');
          return (
            <span key={index} className="font-bold text-primary">
              {content}
            </span>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
}