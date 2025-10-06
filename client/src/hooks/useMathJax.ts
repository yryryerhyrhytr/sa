import { useEffect } from 'react';

declare global {
  interface Window {
    renderMathJax: () => void;
  }
}

export function useMathJax(dependencies: any[] = []) {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (window.renderMathJax) {
        window.renderMathJax();
      }
    }, 100);

    return () => clearTimeout(timer);
  }, dependencies);
}
