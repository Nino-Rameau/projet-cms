import { randomUUID } from 'crypto';
import { DEFAULT_PROPS_BY_TYPE, SOCIAL_ICON_OPTIONS } from './editorConstants';

// --- Couleurs ---

export const parseColorAndOpacity = (colorStr) => {
  if (!colorStr) return { hex: '#ffffff', opacity: 1, isTransparent: false };
  if (colorStr === 'transparent') return { hex: '#ffffff', opacity: 0, isTransparent: true };
  if (colorStr.startsWith('#')) {
    let hex = colorStr.slice(0, 7);
    let opacity = 1;
    if (colorStr.length === 9) {
      opacity = parseInt(colorStr.slice(7, 9), 16) / 255;
    } else if (colorStr.length === 5) {
      opacity = parseInt(colorStr[4] + colorStr[4], 16) / 255;
      hex = `#${colorStr[1]}${colorStr[1]}${colorStr[2]}${colorStr[2]}${colorStr[3]}${colorStr[3]}`;
    } else if (colorStr.length === 4) {
      hex = `#${colorStr[1]}${colorStr[1]}${colorStr[2]}${colorStr[2]}${colorStr[3]}${colorStr[3]}`;
    }
    return { hex, opacity, isTransparent: false };
  }
  const rgbaMatch = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (rgbaMatch) {
    const r = parseInt(rgbaMatch[1], 10).toString(16).padStart(2, '0');
    const g = parseInt(rgbaMatch[2], 10).toString(16).padStart(2, '0');
    const b = parseInt(rgbaMatch[3], 10).toString(16).padStart(2, '0');
    const opacity = rgbaMatch[4] !== undefined ? parseFloat(rgbaMatch[4]) : 1;
    return { hex: `#${r}${g}${b}`, opacity, isTransparent: false };
  }
  return { hex: '#ffffff', opacity: 1, isTransparent: false };
};

export const compileColor = (hex, opacity) => {
  if (opacity >= 1) return hex.slice(0, 7);
  const alphaHex = Math.round(opacity * 255).toString(16).padStart(2, '0');
  return `${hex.slice(0, 7)}${alphaHex}`;
};

// --- Blocs ---

export const getBlockDisplayName = (type = '') => {
  const labels = {
    H1: 'Titre 1', H2: 'Titre 2', H3: 'Titre 3', H4: 'Titre 4',
    Paragraph: 'Paragraphe', Text: 'Texte court', UL: 'Liste', LI: 'Element liste',
    Quote: 'Citation', Divider: 'Separateur', Spacer: 'Espace', Button: 'Bouton',
    Image: 'Image', Section: 'Section', Container: 'Colonne', Card: 'Carte',
    Table: 'Tableau', SocialLinks: 'Reseaux sociaux', Accordion: 'Accordéon',
  };
  return labels[type] || type;
};

// PERF-4 — randomUUID pour des IDs garantis uniques
export const createUniqueBlockId = () => `block-${randomUUID()}`;

export const createBlock = (type) => ({
  id: createUniqueBlockId(),
  type,
  props: { ...(DEFAULT_PROPS_BY_TYPE[type] || { content: `Nouveau ${type}` }) },
  children: [],
});

export const cloneBlockWithFreshIds = (block) => ({
  ...block,
  id: createUniqueBlockId(),
  props: { ...(block.props || {}) },
  children: Array.isArray(block.children) ? block.children.map(cloneBlockWithFreshIds) : [],
});

export const findParentInfoInTree = (blocks, targetId, parentId = null) => {
  for (let index = 0; index < blocks.length; index += 1) {
    const block = blocks[index];
    if (block.id === targetId) return { parentId, index };
    if (Array.isArray(block.children) && block.children.length) {
      const found = findParentInfoInTree(block.children, targetId, block.id);
      if (found) return found;
    }
  }
  return null;
};

export const getSectionChildrenLayoutStyle = (block) => {
  const style = block?.props?.style || {};
  return {
    display: style.display === 'grid' || style.display === 'flex' ? style.display : 'block',
    gridTemplateColumns: style.gridTemplateColumns,
    flexDirection: style.flexDirection,
    flexWrap: style.flexWrap,
    justifyContent: style.justifyContent,
    alignItems: style.alignItems,
    gap: style.gap || '12px',
  };
};

export const toHexColorOrFallback = (value, fallback = '#d1d5db') => {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  if (/^#([0-9a-f]{3,8})$/i.test(trimmed)) return trimmed;
  if (/^rgba?\(/i.test(trimmed)) return trimmed;
  if (trimmed === 'transparent') return 'transparent';
  return fallback;
};

export const getBorderPresetValues = (style = {}) => {
  const fallback = { width: '0px', lineStyle: 'solid', color: '#d1d5db' };
  if (style.borderWidth || style.borderStyle || style.borderColor) {
    return {
      width: style.borderWidth || fallback.width,
      lineStyle: style.borderStyle || fallback.lineStyle,
      color: toHexColorOrFallback(style.borderColor, fallback.color),
    };
  }
  if (typeof style.border === 'string' && style.border.trim()) {
    const parts = style.border.trim().split(/\s+/);
    return {
      width: parts[0] || fallback.width,
      lineStyle: parts[1] || fallback.lineStyle,
      color: toHexColorOrFallback(parts.slice(2).join(' '), fallback.color),
    };
  }
  return fallback;
};

// --- Texte riche ---

export const sanitizeRichText = (html = '') =>
  String(html)
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/\son\w+=("[^"]*"|'[^']*')/gi, '');

export const renderRichText = (html, fallback, className) => (
  <div
    className={`${className} [&_a]:underline [&_a]:underline-offset-2`}
    dangerouslySetInnerHTML={{ __html: sanitizeRichText(html || fallback) }}
  />
);

export const getListItems = (block) => {
  if (Array.isArray(block?.props?.items) && block.props.items.length) return block.props.items;
  if (Array.isArray(block?.children) && block.children.length) {
    return block.children.filter((c) => c.type === 'LI').map((c) => c.props?.content || 'Element');
  }
  if (block?.props?.content) return [block.props.content];
  return ['Element de liste'];
};

// --- Navigation ---

export const normalizeSiteRelativePath = (rawPath = '') => {
  const trimmed = String(rawPath || '').trim();
  if (!trimmed) return '';
  const noProtocol = trimmed.replace(/^https?:\/\/[^/]+/i, '');
  return noProtocol
    .replace(/^\/view\/[^/]+\/?/i, '')
    .replace(/^view\/[^/]+\/?/i, '')
    .replace(/^\/+/, '')
    .replace(/\/+$/, '');
};

export const getButtonHref = (props = {}, siteSlug = '') => {
  switch (props.actionType) {
    case 'link':   return props.href || '#';
    case 'page': {
      const normalized = normalizeSiteRelativePath(props.pagePath);
      if (!siteSlug) return '#';
      return normalized ? `/view/${siteSlug}/${normalized}` : `/view/${siteSlug}/home`;
    }
    case 'file':   return props.fileUrl || '#';
    case 'email':  return props.email ? `mailto:${props.email}` : '#';
    case 'phone':  return props.phone ? `tel:${props.phone}` : '#';
    default:       return '#';
  }
};

// --- Icônes sociales ---

export const normalizeSocialIconName = (iconName) => String(iconName || '').trim().toLowerCase();

export const getSocialLabelForIcon = (iconName) => {
  const normalized = normalizeSocialIconName(iconName);
  const option = SOCIAL_ICON_OPTIONS.find((item) => item.value === normalized);
  return option?.label || 'Site web';
};

export const getSocialIconComponent = (iconName) => {
  const normalized = normalizeSocialIconName(iconName);
  return SOCIAL_ICON_OPTIONS.some((item) => item.value === normalized) ? normalized : 'website';
};

export const createDefaultSocialItem = (index = 0) => {
  const option = SOCIAL_ICON_OPTIONS[index % SOCIAL_ICON_OPTIONS.length];
  return { icon: option.value, href: 'https://', label: option.label };
};
