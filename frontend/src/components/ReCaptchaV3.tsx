// frontend/src/components/ReCaptchaV3.tsx
/**
 * reCAPTCHA v3 Integration Component
 * Invisible CAPTCHA that scores user interactions
 */

'use client';

import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    grecaptcha: any;
  }
}

interface ReCaptchaV3Props {
  siteKey: string;
  onToken: (token: string) => void;
  action: string;
}

export function useReCaptchaV3(siteKey: string) {
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;

    // Load reCAPTCHA v3 script
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    loaded.current = true;

    return () => {
      // Cleanup on unmount
      const script = document.querySelector(`script[src*="recaptcha"]`);
      if (script) {
        document.head.removeChild(script);
      }
    };
  }, [siteKey]);

  const executeRecaptcha = async (action: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!window.grecaptcha || !window.grecaptcha.ready) {
        // Fallback for development
        if (process.env.NODE_ENV === 'development') {
          console.log('🤖 reCAPTCHA not loaded, using dev token');
          resolve('dev-bypass-token');
          return;
        }
        reject(new Error('reCAPTCHA not loaded'));
        return;
      }

      window.grecaptcha.ready(() => {
        window.grecaptcha
          .execute(siteKey, { action })
          .then((token: string) => {
            resolve(token);
          })
          .catch((error: any) => {
            reject(error);
          });
      });
    });
  };

  return { executeRecaptcha };
}