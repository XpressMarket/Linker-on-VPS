// frontend/src/components/ReCaptchaV3.tsx
'use client';
import { useEffect, useRef, useCallback } from 'react';

declare global {
  interface Window {
    grecaptcha: any;
  }
}

export function useReCaptchaV3(siteKey: string) {
  const loaded = useRef(false);

  useEffect(() => {
    if (!siteKey || loaded.current) return;

    // Don't load if already on page
    if (document.querySelector(`script[src*="${siteKey}"]`)) {
      loaded.current = true;
      return;
    }

    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
    loaded.current = true;

    // No cleanup - grecaptcha should persist across navigations
  }, [siteKey]);

  const executeRecaptcha = useCallback(async (action: string): Promise<string> => {
    // Fallback if no site key configured
    if (!siteKey) {
      console.warn('reCAPTCHA site key not set, using bypass token');
      return 'bypass-no-sitekey';
    }

    // Dev bypass
    if (process.env.NODE_ENV === 'development') {
      console.log('🤖 reCAPTCHA dev bypass');
      return 'dev-bypass-token';
    }

    return new Promise((resolve, reject) => {
      const execute = () => {
        window.grecaptcha
          .execute(siteKey, { action })
          .then(resolve)
          .catch(reject);
      };

      if (window.grecaptcha?.ready) {
        window.grecaptcha.ready(execute);
      } else {
        // Wait for script to load
        const interval = setInterval(() => {
          if (window.grecaptcha?.ready) {
            clearInterval(interval);
            window.grecaptcha.ready(execute);
          }
        }, 100);
        // Timeout after 10s
        setTimeout(() => {
          clearInterval(interval);
          reject(new Error('reCAPTCHA failed to load'));
        }, 10000);
      }
    });
  }, [siteKey]);

  return { executeRecaptcha };
}



// // frontend/src/components/ReCaptchaV3.tsx
// /**
//  * reCAPTCHA v3 Integration Component
//  * Invisible CAPTCHA that scores user interactions
//  */

// 'use client';

// import { useEffect, useRef } from 'react';

// declare global {
//   interface Window {
//     grecaptcha: any;
//   }
// }

// interface ReCaptchaV3Props {
//   siteKey: string;
//   onToken: (token: string) => void;
//   action: string;
// }

// export function useReCaptchaV3(siteKey: string) {
//   const loaded = useRef(false);

//   useEffect(() => {
//     if (loaded.current) return;

//     // Load reCAPTCHA v3 script
//     const script = document.createElement('script');
//     script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
//     script.async = true;
//     script.defer = true;
//     document.head.appendChild(script);

//     loaded.current = true;

//     return () => {
//       // Cleanup on unmount
//       const script = document.querySelector(`script[src*="recaptcha"]`);
//       if (script) {
//         document.head.removeChild(script);
//       }
//     };
//   }, [siteKey]);

//   const executeRecaptcha = async (action: string): Promise<string> => {
//     return new Promise((resolve, reject) => {
//       if (!window.grecaptcha || !window.grecaptcha.ready) {
//         // Fallback for development
//         if (process.env.NODE_ENV === 'development') {
//           console.log('🤖 reCAPTCHA not loaded, using dev token');
//           resolve('dev-bypass-token');
//           return;
//         }
//         reject(new Error('reCAPTCHA not loaded'));
//         return;
//       }

//       window.grecaptcha.ready(() => {
//         window.grecaptcha
//           .execute(siteKey, { action })
//           .then((token: string) => {
//             resolve(token);
//           })
//           .catch((error: any) => {
//             reject(error);
//           });
//       });
//     });
//   };

//   return { executeRecaptcha };
// }