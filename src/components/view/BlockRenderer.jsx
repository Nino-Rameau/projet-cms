import DOMPurify from 'isomorphic-dompurify';
import Image from 'next/image';

// P7 — Placeholder local (pas de requête vers placehold.co)
const PLACEHOLDER_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'%3E%3Crect fill='%23e2e8f0' width='600' height='400'/%3E%3Ctext fill='%2394a3b8' font-family='sans-serif' font-size='24' x='300' y='210' dominant-baseline='middle' text-anchor='middle'%3EImage%3C/text%3E%3C/svg%3E";

// S3 — Schémas d'URL autorisés pour les liens
const SAFE_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:']);

function safeHref(url) {
  if (!url || url === '#') return '#';
  try {
    const parsed = new URL(url, 'https://example.com');
    if (!SAFE_PROTOCOLS.has(parsed.protocol)) return '#';
  } catch {
    return '#';
  }
  return url;
}

const normalizeSocialIconName = (iconName) => String(iconName || '').trim().toLowerCase();

const getSocialLabelForIcon = (iconName) => {
  const normalized = normalizeSocialIconName(iconName);
  const labels = {
    facebook: 'Facebook',
    instagram: 'Instagram',
    linkedin: 'LinkedIn',
    youtube: 'YouTube',
    twitter: 'Twitter/X',
    github: 'GitHub',
    website: 'Site web',
  };
  return labels[normalized] || 'Site web';
};

const getSocialIconComponent = (iconName) => {
  const normalized = normalizeSocialIconName(iconName);
  const allowed = ['facebook', 'instagram', 'linkedin', 'youtube', 'twitter', 'github', 'website'];
  return allowed.includes(normalized) ? normalized : 'website';
};

function SocialIconSvg({ name, size = 16, className = '' }) {
  const props = {
    viewBox: '0 0 16 16',
    width: size,
    height: size,
    fill: 'currentColor',
    'aria-hidden': 'true',
    className,
  };

  if (name === 'facebook') {
    return (
      <svg {...props}>
        <path d="M16 8.049C16 3.603 12.418 0 8 0S0 3.603 0 8.049C0 12.067 2.926 15.398 6.75 16v-5.625H4.719V8.049H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.994 0-1.303.621-1.303 1.258v1.51h2.219l-.354 2.326H9.25V16C13.074 15.398 16 12.067 16 8.049" />
      </svg>
    );
  }
  if (name === 'instagram') {
    return (
      <svg {...props}>
        <path d="M8 0C5.829 0 5.556.01 4.703.048 3.85.087 3.269.222 2.76.42a3.9 3.9 0 0 0-1.417.923A3.9 3.9 0 0 0 .42 2.76C.222 3.268.087 3.85.048 4.7.01 5.555 0 5.827 0 8c0 2.172.01 2.444.048 3.297.04.852.174 1.433.372 1.942.205.526.478.972.923 1.417.444.445.89.718 1.416.923.51.198 1.09.333 1.942.372C5.555 15.99 5.827 16 8 16c2.172 0 2.444-.01 3.297-.048.851-.04 1.434-.174 1.943-.372a3.9 3.9 0 0 0 1.416-.923c.445-.445.718-.891.923-1.417.198-.51.333-1.09.372-1.942C15.99 10.445 16 10.173 16 8c0-2.172-.01-2.444-.048-3.297-.04-.851-.174-1.433-.372-1.942a3.9 3.9 0 0 0-.923-1.417A3.9 3.9 0 0 0 13.24.42c-.51-.198-1.092-.333-1.943-.372C10.445.01 10.173 0 8 0" />
        <path d="M8 3.892A4.108 4.108 0 1 0 8 12.108 4.108 4.108 0 0 0 8 3.892m0 6.774A2.666 2.666 0 1 1 8 5.334a2.666 2.666 0 0 1 0 5.332m4.271-6.935a.96.96 0 1 1-1.92 0 .96.96 0 0 1 1.92 0" />
      </svg>
    );
  }
  if (name === 'linkedin') {
    return (
      <svg {...props}>
        <path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854z" />
        <path fill="#fff" d="M4.943 13.5V6.169H2.542V13.5zm-1.2-8.332c.837 0 1.358-.554 1.358-1.248-.015-.709-.521-1.248-1.343-1.248S2.4 3.21 2.4 3.92c0 .694.52 1.248 1.327 1.248m2.53 8.332h2.401V9.406c0-.219.016-.438.08-.594.175-.437.574-.89 1.245-.89.878 0 1.23.672 1.23 1.657V13.5h2.401V9.302c0-2.248-1.2-3.293-2.8-3.293-1.291 0-1.866.71-2.187 1.21h.016v-1.04H6.273c.03.67 0 7.321 0 7.321" />
      </svg>
    );
  }
  if (name === 'youtube') {
    return (
      <svg {...props}>
        <path d="M8.051 1.999h-.102C3.925 2 2.108 2.186 1.06 3.234.011 4.283 0 6.053 0 8.001c0 1.948.011 3.718 1.06 4.767C2.108 13.816 3.925 14 7.949 14h.102c4.024 0 5.841-.184 6.889-1.232C15.989 11.719 16 9.949 16 8c0-1.947-.011-3.717-1.06-4.766C13.892 2.185 12.075 2 8.051 2" />
        <path fill="#fff" d="m6.493 5.5 4.03 2.5-4.03 2.5z" />
      </svg>
    );
  }
  if (name === 'twitter') {
    return (
      <svg {...props}>
        <path d="M12.6 1H15l-5.4 6.17L16 15h-5l-3.92-4.56L3 15H1l5.76-6.59L0 1h5l3.54 4.12zM11.9 13.8h1.1L4.1 2.14H3z" />
      </svg>
    );
  }
  if (name === 'github') {
    return (
      <svg {...props}>
        <path d="M8 0a8 8 0 0 0-2.53 15.59c.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.5-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.01.08-2.11 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.91.08 2.11.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8 8 0 0 0 8 0" />
      </svg>
    );
  }
  return (
    <svg {...props}>
      <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0m0 2a6 6 0 0 1 5.18 3H2.82A6 6 0 0 1 8 2m0 12a6 6 0 0 1-5.18-3h10.36A6 6 0 0 1 8 14m5.82-5H2.18a6 6 0 0 1 0-2h11.64a6 6 0 0 1 0 2" />
    </svg>
  );
}

export default function BlockRenderer({ block, siteSlug = '', isCustomDomain = false }) {
  if (!block) return null;


  const processHtmlLinks = (html) => {
    if (!html) return '';
    return html.replace(/href=["']([^"']+)["']/gi, (match, url) => {
      let finalUrl = url;
      // Normaliser le lien s'il commence par / ou par le l'URL courante pointant en interne
      if (finalUrl.startsWith('http://localhost') || (typeof process !== 'undefined' && process.env.CMS_DOMAIN && finalUrl.startsWith('https://' + process.env.CMS_DOMAIN))) {
        try {
          const urlObj = new URL(finalUrl);
          finalUrl = urlObj.pathname;
        } catch(e) {}
      }

      if (finalUrl.startsWith('/')) {
        let normalizedPath = finalUrl.replace(new RegExp('^/view/' + siteSlug + '/?'), '/');
        if (normalizedPath === '' || normalizedPath === '/') normalizedPath = '/home';
        
        if (normalizedPath === '/home') normalizedPath = '/';

        if (isCustomDomain) {
           return 'href="' + normalizedPath + '"';
        } else {
           const suffix = normalizedPath === '/' ? 'home' : (normalizedPath.startsWith('/') ? normalizedPath.substring(1) : normalizedPath);
           return 'href="/view/' + siteSlug + '/' + suffix + '"';
        }
      }
      return match;
    });
  };

  // S2 — Sanitisation robuste avec DOMPurify (bloque XSS, iframes, javascript:, etc.)
  const sanitizeRichText = (html = '') => {
    const clean = DOMPurify.sanitize(String(html), {
      ALLOWED_TAGS: ['b', 'i', 'u', 'strong', 'em', 's', 'a', 'br', 'p', 'span', 'ul', 'ol', 'li'],
      ALLOWED_ATTR: ['href', 'target', 'rel'],
      ALLOW_DATA_ATTR: false,
      FORCE_BODY: false,
    });
    return processHtmlLinks(clean);
  };

  const normalizeSiteRelativePath = (rawPath = '') => {
    const trimmed = String(rawPath || '').trim();
    if (!trimmed) return '';

    const noProtocol = trimmed.replace(/^https?:\/\/[^/]+/i, '');
    const withoutViewPrefix = noProtocol
      .replace(/^\/view\/[^/]+\/?/i, '')
      .replace(/^view\/[^/]+\/?/i, '')
      .replace(/^\/+/, '')
      .replace(/\/+$/, '');

    return withoutViewPrefix;
  };

  const getButtonHref = () => {
    switch (props.actionType) {
      case 'link':
        return safeHref(props.href);
      case 'page': {
        const normalized = normalizeSiteRelativePath(props.pagePath);
        if (!normalized) return isCustomDomain ? '/' : (`/view/${siteSlug}/home`);
        const finalPath = normalized === 'home' && isCustomDomain ? '' : normalized;
        return isCustomDomain ? `/${finalPath}` : `/view/${siteSlug}/${normalized}`;
      }
      case 'file':
        return safeHref(props.fileUrl);
      case 'email':
        return props.email ? `mailto:${props.email}` : '#';
      case 'phone':
        return props.phone ? `tel:${props.phone}` : '#';
      default:
        return '#';
    }
  };

  const renderRich = (html, fallback, className) => (
    <div className={`${className} [&_a]:underline [&_a]:underline-offset-2`} dangerouslySetInnerHTML={{ __html: sanitizeRichText(html || fallback) }} />
  );

  const { type, props = {}, style = {}, children = [] } = block;
  const className = props.className || "";
  const content = props.content || block.content || "";

  switch (type.toLowerCase()) {
    case 'text':
      return <div style={{...style, ...props.style}}>{renderRich(content, 'Texte', `text-slate-800 leading-relaxed ${className}`)}</div>;
    case 'paragraph':
      return <div style={{...style, ...props.style}}>{renderRich(content, 'Paragraphe', `text-slate-700 leading-relaxed mb-4 ${className}`)}</div>;
    case 'h1':
      return <div style={{...style, ...props.style}}>{renderRich(content, 'Titre H1', `text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-6 ${className}`)}</div>;
    case 'h2':
      return <div style={{...style, ...props.style}}>{renderRich(content, 'Titre H2', `text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-5 ${className}`)}</div>;
    case 'h3':
      return <div style={{...style, ...props.style}}>{renderRich(content, 'Titre H3', `text-2xl md:text-3xl font-semibold tracking-tight text-slate-900 mb-4 ${className}`)}</div>;
    case 'h4':
      return <div style={{...style, ...props.style}}>{renderRich(content, 'Titre H4', `text-xl md:text-2xl font-semibold tracking-tight text-slate-900 mb-3 ${className}`)}</div>;
    case 'title':
    case 'heading':
      return <h2 className={`font-bold text-2xl mb-4 ${className}`} style={{...style, ...props.style}}>{content || 'Titre'}</h2>;
    case 'image':
      return (
        <Image
          src={props.src || PLACEHOLDER_IMAGE}
          alt={props.alt || "Image"}
          width={800}
          height={600}
          className={`max-w-full h-auto ${className}`}
          style={{ width: '100%', height: 'auto', ...style, ...props.style }}
          unoptimized
        />
      );
    case 'button':
      return (
        <a
          href={getButtonHref()}
          className={`inline-flex px-4 py-2 bg-blue-600 text-white font-bold rounded-md ${className}`}
          style={{...style, ...props.style}}
          target={props.openInNewTab ? '_blank' : '_self'}
          rel={props.openInNewTab ? 'noreferrer' : undefined}
        >
          {content || 'Bouton'}
        </a>
      );
    case 'quote':
      return (
        <blockquote className={`mb-5 rounded-r-lg border-l-4 border-blue-400 bg-blue-50/50 px-4 py-3 italic text-slate-700 ${className}`} style={{...style, ...props.style}}>
          {content || 'Citation'}
          {props.author ? <div className="mt-2 text-xs not-italic text-slate-500">- {props.author}</div> : null}
        </blockquote>
      );
    case 'divider':
      return <hr className={`my-6 border-slate-300 ${className}`} style={{...style, ...props.style}} />;
    case 'spacer':
      return <div className={className} style={{ height: props?.style?.height || style?.height || '32px' }} />;
    case 'table':
      return (
        <div className={`overflow-x-auto mb-6 ${className}`} style={{...style, ...props.style}}>
          <table className="w-full border-collapse border border-slate-300 bg-white">
            <thead className="bg-slate-100">
              <tr>
                {(props.headers || []).map((header, i) => (
                  <th key={`h-${i}`} className="border border-slate-300 p-3 text-left font-semibold text-slate-800">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(props.rows || []).map((row, rIndex) => (
                <tr key={`r-${rIndex}`}>
                  {row.map((cell, cIndex) => (
                    <td key={`c-${rIndex}-${cIndex}`} className="border border-slate-300 p-3 text-slate-700">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case 'ul':
      return (
        <ul className={`list-disc pl-6 text-slate-800 space-y-2 mb-4 [&_a]:underline [&_a]:underline-offset-2 ${className}`} style={{...style, ...props.style}}>
          {Array.isArray(props.items) && props.items.length > 0 ? (
            props.items.map((item, i) => <li key={`ul-item-${i}`} dangerouslySetInnerHTML={{ __html: sanitizeRichText(item) }} />)
          ) : children && children.length > 0 ? (
            children.map(child => <BlockRenderer key={child.id} block={child} />)
          ) : (
            <li>{content || 'Element de liste'}</li>
          )}
        </ul>
      );
    case 'li':
      return <li className={`${className}`} style={{...style, ...props.style}}>{content || 'Element de liste'}</li>;
    case 'section':
      return (
        <section className={`p-8 w-full rounded-xl border border-transparent mb-6 ${className}`} style={{...style, ...props.style}}>
          {children && children.length > 0 ? (
            children.map(child => <BlockRenderer key={child.id} block={child} siteSlug={siteSlug} isCustomDomain={isCustomDomain} />)
          ) : (
            <div className="text-slate-400">Section vide</div>
          )}
        </section>
      );
    case 'container':
      return (
        <div className={`w-full rounded-lg border border-transparent p-4 ${className}`} style={{...style, ...props.style}}>
          {children && children.length > 0 ? (
            children.map(child => <BlockRenderer key={child.id} block={child} siteSlug={siteSlug} isCustomDomain={isCustomDomain} />)
          ) : (
            <div className="text-slate-400 text-sm">Colonne vide</div>
          )}
        </div>
      );
    case 'card':
      return (
        <div className={`w-full rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${className}`} style={{...style, ...props.style}}>
          {children && children.length > 0 ? (
            children.map(child => <BlockRenderer key={child.id} block={child} siteSlug={siteSlug} isCustomDomain={isCustomDomain} />)
          ) : (
            <div className="text-slate-400 text-sm">Carte vide</div>
          )}
        </div>
      );
    case 'accordion':
      return (
        <div className={`space-y-2 mb-6 ${className}`} style={{ ...style, ...props.style }}>
          {(props.items || []).map((item, index) => (
            <details key={`acc-${index}`} className="group rounded-lg border border-slate-200 bg-white">
              <summary className="flex cursor-pointer items-center justify-between p-4 font-medium text-slate-900 group-open:border-b group-open:border-slate-200 group-open:bg-slate-50">
                {item.title}
                <span className="transition duration-300 group-open:-rotate-180">
                  <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <div className="p-4 text-slate-700 leading-relaxed">
                {item.content}
              </div>
            </details>
          ))}
        </div>
      );
    case 'sociallinks':
      return (
        <div className={`flex flex-wrap gap-3 mb-4 ${className}`} style={{...style, ...props.style}}>
          {(Array.isArray(props.items) ? props.items : []).map((item, i) => {
            const iconName = getSocialIconComponent(item?.icon);
            return (
              <a
                key={`social-link-${i}`}
                href={safeHref(item?.href)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 hover:border-slate-500 hover:text-slate-900 transition"
                aria-label={getSocialLabelForIcon(item?.icon)}
                title={getSocialLabelForIcon(item?.icon)}
                target="_blank"
                rel="noreferrer"
              >
                <SocialIconSvg name={iconName} size={16} />
              </a>
            );
          })}
        </div>
      );
    default:
      return (
        <div className={`border p-4 bg-gray-50 ${className}`} style={{...style, ...props.style}}>
          <h4>Type inconnu: {type}</h4>
          {children && children.map(child => <BlockRenderer key={child.id} block={child} siteSlug={siteSlug} isCustomDomain={isCustomDomain} />)}
        </div>
      );
  }
}
