import { useRef, useCallback } from "react";

export default function useDebouncedCallback(callback, delay = 350) {
  const timer = useRef(null);

  return useCallback((...args) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => callback(...args), delay);
  }, [callback, delay]);
}
