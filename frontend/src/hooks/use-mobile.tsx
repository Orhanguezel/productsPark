import * as React from 'react';

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

    const update = () => setIsMobile(mql.matches);

    update();

    // Safari fallback
    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', update);
      return () => mql.removeEventListener('change', update);
    }
    mql.addListener(update);
    return () => mql.removeListener(update);
  }, []);

  return isMobile;
}
