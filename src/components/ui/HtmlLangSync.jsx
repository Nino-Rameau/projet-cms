'use client';

import { useEffect } from 'react';

export default function HtmlLangSync({ lang = 'fr' }) {
  useEffect(() => {
    const html = document.documentElement;
    const previousLang = html.getAttribute('lang') || 'fr';
    html.setAttribute('lang', lang || 'fr');

    return () => {
      html.setAttribute('lang', previousLang);
    };
  }, [lang]);

  return null;
}
