'use client';

import { useEffect } from 'react';
import Script from 'next/script';
import { initClientId } from '@/lib/yandex-metrica';
import { useHasInteracted } from "@/hooks/useHasInteracted";

export default function YandexMetrica() {
  const hasInteracted = useHasInteracted();

  useEffect(() => {
    if (!hasInteracted) return;
    initClientId();
  }, [hasInteracted]);

  if (process.env.NODE_ENV !== "production") {
    return null;
  }

  if (!hasInteracted) {
    return null;
  }

  const metricaId = process.env.NEXT_PUBLIC_YANDEX_METRICA_ID;

  if (!metricaId) {
    return null;
  }

  return (
    <>
      <Script
        id="yandex-metrica"
        strategy="lazyOnload"
        dangerouslySetInnerHTML={{
          __html: `
            (function(m,e,t,r,i,k,a){
              m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
              m[i].l=1*new Date();
              for (var j = 0; j < document.scripts.length; j++) {
                if (document.scripts[j].src === r) { return; }
              }
              k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
            })(window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");

            ym(${metricaId}, "init", {
              clickmap:true,
              trackLinks:true,
              accurateTrackBounce:true,
              webvisor:true,
              ecommerce:"dataLayer"
            });
          `,
        }}
      />
    </>
  );
}
