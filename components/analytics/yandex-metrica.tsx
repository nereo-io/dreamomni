'use client';

import { useEffect, useRef } from 'react';
import Script from 'next/script';
import { initClientId } from '@/lib/yandex-metrica';
import { usePathname, useSearchParams } from 'next/navigation';

export default function YandexMetrica() {
  const metricaId = process.env.NEXT_PUBLIC_YANDEX_METRICA_ID;
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hasBootstrappedRef = useRef(false);
  const search = searchParams?.toString() || '';

  useEffect(() => {
    if (!metricaId) return;
    initClientId();
  }, [metricaId]);

  useEffect(() => {
    if (!metricaId || typeof window === 'undefined') return;
    if (typeof window.ym !== 'function') return;

    if (!hasBootstrappedRef.current) {
      hasBootstrappedRef.current = true;
      return;
    }

    const path = pathname || window.location.pathname;
    const query = search ? `?${search}` : '';
    const url = `${window.location.origin}${path}${query}`;

    window.ym(Number(metricaId), 'hit', url, {
      title: document.title,
    });
  }, [metricaId, pathname, search]);

  if (process.env.NODE_ENV !== 'production') {
    return null;
  }

  if (!metricaId) {
    return null;
  }

  return (
    <>
      <Script
        id="yandex-metrica"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
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
