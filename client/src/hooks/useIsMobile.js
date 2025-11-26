import { useEffect, useState } from 'react';

export default function useIsMobile(breakpoint = 700) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < breakpoint);

  useEffect(() => {
    let mounted = true;
    function onResize() {
      if (!mounted) return;
      setIsMobile(window.innerWidth < breakpoint);
    }
    window.addEventListener('resize', onResize);
    return () => { mounted = false; window.removeEventListener('resize', onResize); };
  }, [breakpoint]);

  return isMobile;
}