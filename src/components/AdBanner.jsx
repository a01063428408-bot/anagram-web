import { useEffect, useRef } from 'react';

/**
 * Google AdSense 광고 배너 컴포넌트
 * 실제 사용 시 data-ad-client와 data-ad-slot을 본인의 AdSense 값으로 교체해야 합니다.
 */
export default function AdBanner({ adClient = '', adSlot = '', format = 'auto' }) {
  const adRef = useRef(null);

  useEffect(() => {
    // AdSense가 로드된 경우에만 광고 push
    if (adClient && window.adsbygoogle) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        // AdSense 에러 무시
      }
    }
  }, [adClient]);

  // adClient가 없으면 플레이스홀더 표시
  if (!adClient) {
    return (
      <div className="ad-banner placeholder">
        <span>광고 영역</span>
        <p className="ad-setup-hint">
          Google AdSense 설정 후 이 영역에 광고가 표시됩니다.
        </p>
      </div>
    );
  }

  return (
    <div className="ad-banner" ref={adRef}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={adClient}
        data-ad-slot={adSlot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
