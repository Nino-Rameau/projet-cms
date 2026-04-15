'use client';
import { useEditorStore } from '@/store/useEditorStore';
import { Monitor, Smartphone, Tablet, Save, Eye, Layers, Type, Image as ImageIcon, Box, AlignLeft, Heading1, Heading2, Heading3, Heading4, List, Table2, Info, Globe, ListCollapse } from 'lucide-react';
import { useEffect, useState, useTransition, useRef } from 'react';
import { DndContext, DragOverlay, pointerWithin, rectIntersection, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { savePageContent } from '@/app/actions/site';
import ThemeToggle from '@/components/ui/ThemeToggle';

const DND_DEBUG = false;
const dndLog = (...args) => {
  if (DND_DEBUG) console.log(...args);
};
const dndWarn = (...args) => {
  if (DND_DEBUG) console.warn(...args);
};
const dndError = (...args) => {
  if (DND_DEBUG) console.error(...args);
};

const PAGE_SETTINGS_DEFAULTS = {
  metaTitle: '',
  metaDescription: '',
  noIndex: false,
  contentWidth: '100%',
  customClassName: '',
  backgroundColor: '',
  backgroundImage: '',
};

const parseColorAndOpacity = (colorStr) => {
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

const compileColor = (hex, opacity) => {
  if (opacity >= 1) return hex.slice(0, 7);
  const alphaHex = Math.round(opacity * 255).toString(16).padStart(2, '0');
  return `${hex.slice(0, 7)}${alphaHex}`;
};

const ColorPicker = ({ label, value, onChange }) => {
  const parsed = parseColorAndOpacity(value);
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="flex justify-between items-center">
        <label className="text-xs text-pb-foreground/70">{label}</label>
        <span className="font-mono text-[10px] text-pb-foreground/50">{Math.round(parsed.opacity * 100)}%</span>
      </div>
      <div className="flex bg-pb-background border border-pb-border rounded-lg overflow-hidden focus-within:ring-1 focus-within:ring-pb-accent focus-within:border-pb-accent transition-all h-8">
        <input 
          type="color" 
          value={parsed.hex} 
          onChange={(e) => onChange(compileColor(e.target.value, parsed.opacity))}
          className="w-10 h-full p-0 border-0 bg-transparent cursor-pointer shrink-0" 
        />
        <input 
          type="range" 
          min="0" max="1" step="0.01" 
          value={parsed.opacity} 
          onChange={(e) => onChange(compileColor(parsed.hex, parseFloat(e.target.value)))}
          className="flex-1 min-w-0 bg-transparent appearance-none cursor-pointer px-2 w-16" 
          style={{ backgroundImage: `linear-gradient(to right, transparent, ${parsed.hex})`, height: '100%' }}
        />
        <input 
          type="text" 
          value={value || ''} 
          onChange={(e) => onChange(e.target.value)}
          placeholder="#ffffff"
          className="w-20 bg-transparent border-l border-pb-border text-center text-[10px] font-mono lowercase focus:outline-none"
        />
      </div>
    </div>
  );
};


const getBlockDisplayName = (type = '') => {
  const labels = {
    H1: 'Titre 1',
    H2: 'Titre 2',
    H3: 'Titre 3',
    H4: 'Titre 4',
    Paragraph: 'Paragraphe',
    Text: 'Texte court',
    UL: 'Liste',
    LI: 'Element liste',
    Quote: 'Citation',
    Divider: 'Separateur',
    Spacer: 'Espace',
    Button: 'Bouton',
    Image: 'Image',
    Section: 'Section',
    Container: 'Colonne',
    Card: 'Carte',
    Table: 'Tableau',
    SocialLinks: 'Reseaux sociaux',
    Accordion: 'Accordéon',
  };
  return labels[type] || type;
};

const DEFAULT_PROPS_BY_TYPE = {
  H1: { content: 'Titre H1' },
  H2: { content: 'Titre H2' },
  H3: { content: 'Titre H3' },
  H4: { content: 'Titre H4' },
  Paragraph: { content: 'Paragraphe avec <strong>texte en gras</strong>.' },
  Text: { content: 'Texte simple. Vous pouvez ajouter des <a href="#">liens</a>.' },
  Quote: { content: '"Une citation met en avant une phrase importante."', author: 'Auteur' },
  Divider: { style: { borderTop: '1px solid #cbd5e1', margin: '24px 0' } },
  Spacer: { style: { height: '32px' } },
  Card: {
    style: {
      padding: '20px',
      borderRadius: '14px',
      backgroundColor: '#ffffff',
      border: '1px solid #e2e8f0',
      boxShadow: '0 6px 20px rgba(15, 23, 42, 0.06)',
    },
  },
  Button: { content: 'Bouton', actionType: 'none', href: '', pagePath: '', fileUrl: '', email: '', phone: '', openInNewTab: false },
  LI: { content: 'Element de liste' },
  UL: { items: ['Premier point', 'Deuxieme point', 'Troisieme point'] },
  Image: { src: 'https://placehold.co/600x400/png', alt: 'Image' },
  Section: {},
  Table: {
    headers: ['Colonne 1', 'Colonne 2', 'Colonne 3'],
    rows: [
      ['Cellule 1', 'Cellule 2', 'Cellule 3'],
      ['Cellule 4', 'Cellule 5', 'Cellule 6'],
    ],
  },
  SocialLinks: {
    items: [
      { icon: 'facebook', href: 'https://facebook.com', label: 'Facebook' },
      { icon: 'instagram', href: 'https://instagram.com', label: 'Instagram' },
      { icon: 'linkedin', href: 'https://linkedin.com', label: 'LinkedIn' },
    ],
  },
  Accordion: {
    items: [
      { title: 'Question 1', content: 'Ceci est la réponse à la première question.' },
      { title: 'Question 2', content: 'Ceci est la réponse à la deuxième question.' },
    ],
  },
};

const SOCIAL_ICON_OPTIONS = [
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'twitter', label: 'Twitter/X' },
  { value: 'github', label: 'GitHub' },
  { value: 'website', label: 'Site web' },
];

const normalizeSocialIconName = (iconName) => String(iconName || '').trim().toLowerCase();

const getSocialLabelForIcon = (iconName) => {
  const normalized = normalizeSocialIconName(iconName);
  const option = SOCIAL_ICON_OPTIONS.find((item) => item.value === normalized);
  return option?.label || 'Site web';
};

const getSocialIconComponent = (iconName) => {
  const normalized = normalizeSocialIconName(iconName);
  return SOCIAL_ICON_OPTIONS.some((item) => item.value === normalized) ? normalized : 'website';
};

function SocialIconSvg({ name, size = 16, className = '' }) {
  const iconName = getSocialIconComponent(name);
  const props = {
    viewBox: '0 0 16 16',
    width: size,
    height: size,
    fill: 'currentColor',
    'aria-hidden': 'true',
    className,
  };

  if (iconName === 'facebook') {
    return (
      <svg {...props}>
        <path d="M16 8.049C16 3.603 12.418 0 8 0S0 3.603 0 8.049C0 12.067 2.926 15.398 6.75 16v-5.625H4.719V8.049H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.994 0-1.303.621-1.303 1.258v1.51h2.219l-.354 2.326H9.25V16C13.074 15.398 16 12.067 16 8.049" />
      </svg>
    );
  }

  if (iconName === 'instagram') {
    return (
      <svg {...props}>
        <path d="M8 0C5.829 0 5.556.01 4.703.048 3.85.087 3.269.222 2.76.42a3.9 3.9 0 0 0-1.417.923A3.9 3.9 0 0 0 .42 2.76C.222 3.268.087 3.85.048 4.7.01 5.555 0 5.827 0 8c0 2.172.01 2.444.048 3.297.04.852.174 1.433.372 1.942.205.526.478.972.923 1.417.444.445.89.718 1.416.923.51.198 1.09.333 1.942.372C5.555 15.99 5.827 16 8 16c2.172 0 2.444-.01 3.297-.048.851-.04 1.434-.174 1.943-.372a3.9 3.9 0 0 0 1.416-.923c.445-.445.718-.891.923-1.417.198-.51.333-1.09.372-1.942C15.99 10.445 16 10.173 16 8c0-2.172-.01-2.444-.048-3.297-.04-.851-.174-1.433-.372-1.942a3.9 3.9 0 0 0-.923-1.417A3.9 3.9 0 0 0 13.24.42c-.51-.198-1.092-.333-1.943-.372C10.445.01 10.173 0 8 0m0 1.441c2.136 0 2.389.008 3.232.047.78.036 1.204.166 1.486.275.373.145.64.318.92.597.28.28.452.547.597.92.109.282.24.705.275 1.486.038.843.047 1.096.047 3.232s-.009 2.389-.047 3.232c-.036.78-.166 1.204-.275 1.486a2.5 2.5 0 0 1-.597.92c-.28.28-.547.452-.92.597-.282.109-.706.24-1.486.275-.843.038-1.096.047-3.232.047s-2.389-.009-3.232-.047c-.78-.036-1.204-.166-1.486-.275a2.5 2.5 0 0 1-.92-.597 2.5 2.5 0 0 1-.597-.92c-.109-.282-.24-.706-.275-1.486C1.45 10.39 1.44 10.136 1.44 8s.009-2.389.047-3.232c.036-.78.166-1.204.275-1.486.145-.373.318-.64.597-.92.28-.28.547-.452.92-.597.282-.109.706-.24 1.486-.275.843-.038 1.096-.047 3.232-.047" />
        <path d="M8 3.892A4.108 4.108 0 1 0 8 12.108 4.108 4.108 0 0 0 8 3.892m0 6.774A2.666 2.666 0 1 1 8 5.334a2.666 2.666 0 0 1 0 5.332m4.271-6.935a.96.96 0 1 1-1.92 0 .96.96 0 0 1 1.92 0" />
      </svg>
    );
  }

  if (iconName === 'linkedin') {
    return (
      <svg {...props}>
        <path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854z" />
        <path fill="#fff" d="M4.943 13.5V6.169H2.542V13.5zm-1.2-8.332c.837 0 1.358-.554 1.358-1.248-.015-.709-.521-1.248-1.343-1.248S2.4 3.21 2.4 3.92c0 .694.52 1.248 1.327 1.248m2.53 8.332h2.401V9.406c0-.219.016-.438.08-.594.175-.437.574-.89 1.245-.89.878 0 1.23.672 1.23 1.657V13.5h2.401V9.302c0-2.248-1.2-3.293-2.8-3.293-1.291 0-1.866.71-2.187 1.21h.016v-1.04H6.273c.03.67 0 7.321 0 7.321" />
      </svg>
    );
  }

  if (iconName === 'youtube') {
    return (
      <svg {...props}>
        <path d="M8.051 1.999h-.102C3.925 2 2.108 2.186 1.06 3.234.011 4.283 0 6.053 0 8.001c0 1.948.011 3.718 1.06 4.767C2.108 13.816 3.925 14 7.949 14h.102c4.024 0 5.841-.184 6.889-1.232C15.989 11.719 16 9.949 16 8c0-1.947-.011-3.717-1.06-4.766C13.892 2.185 12.075 2 8.051 2" />
        <path fill="#fff" d="m6.493 5.5 4.03 2.5-4.03 2.5z" />
      </svg>
    );
  }

  if (iconName === 'twitter') {
    return (
      <svg {...props}>
        <path d="M12.6 1H15l-5.4 6.17L16 15h-5l-3.92-4.56L3 15H1l5.76-6.59L0 1h5l3.54 4.12zM11.9 13.8h1.1L4.1 2.14H3z" />
      </svg>
    );
  }

  if (iconName === 'github') {
    return (
      <svg {...props}>
        <path d="M8 0a8 8 0 0 0-2.53 15.59c.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.5-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.01.08-2.11 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.91.08 2.11.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8 8 0 0 0 8 0" />
      </svg>
    );
  }

  return (
    <svg {...props}>
      <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0m3.6 7.4h-2.4V5.8c0-.5.3-.8.8-.8h1.6v2.4zM8.7 14.1v-3h1.9l.3-2.4H8.7V7.1c0-.7.2-1.1 1.1-1.1h1.2V3.9c-.2 0-.9-.1-1.8-.1-1.7 0-2.9 1-2.9 3v1.7H4.4v2.4h1.9v3.2A6.8 6.8 0 1 1 8 14.8c.2 0 .5 0 .7-.1z" />
    </svg>
  );
}

const createDefaultSocialItem = (index = 0) => {
  const option = SOCIAL_ICON_OPTIONS[index % SOCIAL_ICON_OPTIONS.length];
  return {
    icon: option.value,
    href: 'https://',
    label: option.label,
  };
};

const createBlock = (type) => ({
  id: `block-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  type,
  props: { ...(DEFAULT_PROPS_BY_TYPE[type] || { content: `Nouveau ${type}` }) },
  children: [],
});

const createUniqueBlockId = () => `block-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
const BLOCK_CLIPBOARD_STORAGE_KEY = 'pb-editor-block-clipboard';

const cloneBlockWithFreshIds = (block) => ({
  ...block,
  id: createUniqueBlockId(),
  props: { ...(block.props || {}) },
  children: Array.isArray(block.children) ? block.children.map(cloneBlockWithFreshIds) : [],
});

const findParentInfoInTree = (blocks, targetId, parentId = null) => {
  for (let index = 0; index < blocks.length; index += 1) {
    const block = blocks[index];
    if (block.id === targetId) {
      return { parentId, index };
    }
    if (Array.isArray(block.children) && block.children.length) {
      const found = findParentInfoInTree(block.children, targetId, block.id);
      if (found) return found;
    }
  }
  return null;
};

const getSectionChildrenLayoutStyle = (block) => {
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

const toHexColorOrFallback = (value, fallback = '#d1d5db') => {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  if (/^#([0-9a-f]{3,8})$/i.test(trimmed)) return trimmed;
  if (/^rgba?\(/i.test(trimmed)) return trimmed;
  if (trimmed === 'transparent') return 'transparent';
  return fallback;
};

const getBorderPresetValues = (style = {}) => {
  const fallback = {
    width: '0px',
    lineStyle: 'solid',
    color: '#d1d5db',
  };

  if (style.borderWidth || style.borderStyle || style.borderColor) {
    return {
      width: style.borderWidth || fallback.width,
      lineStyle: style.borderStyle || fallback.lineStyle,
      color: toHexColorOrFallback(style.borderColor, fallback.color),
    };
  }

  if (typeof style.border === 'string' && style.border.trim()) {
    const parts = style.border.trim().split(/\s+/);
    // Simple basic parsing: [width, style, color]
    const width = parts[0] || fallback.width;
    const lineStyle = parts[1] || fallback.lineStyle;
    const color = toHexColorOrFallback(parts.slice(2).join(' '), fallback.color);
    return { width, lineStyle, color };
  }

  return fallback;
};

const sanitizeRichText = (html = '') => {
  return String(html)
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/\son\w+=("[^"]*"|'[^']*')/gi, '');
};

const renderRichText = (html, fallback, className) => (
  <div
    className={`${className} [&_a]:underline [&_a]:underline-offset-2`}
    dangerouslySetInnerHTML={{ __html: sanitizeRichText(html || fallback) }}
  />
);

const getListItems = (block) => {
  if (Array.isArray(block?.props?.items) && block.props.items.length) return block.props.items;
  if (Array.isArray(block?.children) && block.children.length) {
    return block.children.filter((c) => c.type === 'LI').map((c) => c.props?.content || 'Element');
  }
  if (block?.props?.content) return [block.props.content];
  return ['Element de liste'];
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

const getButtonHref = (props = {}, siteSlug = '') => {
  switch (props.actionType) {
    case 'link':
      return props.href || '#';
    case 'page': {
      const normalized = normalizeSiteRelativePath(props.pagePath);
      if (!siteSlug) return '#';
      if (!normalized) return `/view/${siteSlug}/home`;
      return `/view/${siteSlug}/${normalized}`;
    }
    case 'file':
      return props.fileUrl || '#';
    case 'email':
      return props.email ? `mailto:${props.email}` : '#';
    case 'phone':
      return props.phone ? `tel:${props.phone}` : '#';
    default:
      return '#';
  }
};

// --- COMPOSANTS DE GESTION DU DRAG & DROP ---

// 1. Bouton "Palette" pour la colonne de gauche
function PaletteItem({ type, icon: Icon, label }) {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: `palette-${type}`,
    data: { type, isPaletteItem: true },
  });

  return (
    <div 
      ref={setNodeRef} 
      {...listeners} 
      {...attributes}
      className="flex flex-col items-center justify-center p-4 border border-pb-border rounded-md hover:border-pb-accent hover:bg-pb-accent/10 cursor-grab text-pb-foreground/80 hover:text-pb-accent transition group bg-pb-background relative z-50 shadow-sm"
    >
      <Icon size={20} className="mb-2" />
      <span className="text-xs font-medium">{label}</span>
    </div>
  );
}

function InfoTip({ text }) {
  const triggerRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0, above: false });

  const showTooltip = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.min(Math.max(rect.left + rect.width / 2, 150), window.innerWidth - 150);
    const wouldOverflowBottom = rect.bottom + 70 > window.innerHeight;
    const y = wouldOverflowBottom ? Math.max(12, rect.top - 8) : Math.min(window.innerHeight - 12, rect.bottom + 8);
    setTooltipPos({ x, y, above: wouldOverflowBottom });
    setIsOpen(true);
  };

  const hideTooltip = () => {
    setIsOpen(false);
  };

  return (
    <span className="inline-flex items-center">
      <button
        ref={triggerRef}
        type="button"
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        aria-label={text}
        className="inline-flex items-center justify-center text-pb-foreground/50 hover:text-pb-foreground/80 transition"
      >
        <Info size={14} />
      </button>
      {isOpen && (
        <span
          role="tooltip"
          className="fixed z-[9999] max-w-[280px] rounded-md bg-slate-900 text-white text-[11px] leading-relaxed px-2 py-1.5 shadow-xl"
          style={{ left: `${tooltipPos.x}px`, top: `${tooltipPos.y}px`, transform: tooltipPos.above ? 'translate(-50%, -100%)' : 'translateX(-50%)' }}
        >
          {text}
        </span>
      )}
    </span>
  );
}

// 2. Un Block "Sortable" déjà sur le canvas
function NestedBlockPreview({ block, siteSlug }) {
  const { selectBlock, selectedBlockId } = useEditorStore();
  const canReceiveChildren = block.type === 'Section' || block.type === 'Container' || block.type === 'Card';
  const previewDropId = canReceiveChildren ? `section-${block.id}` : `preview-${block.id}`;
  const { setNodeRef: setPreviewSectionDropRef, isOver: isPreviewSectionOver } = useDroppable({
    id: previewDropId,
    data: { isSectionDrop: canReceiveChildren, sectionId: canReceiveChildren ? block.id : null },
  });
  const isSelected = selectedBlockId === block.id;
  const previewStyle = block.props?.style || {};

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        selectBlock(block.id);
      }}
      className={`p-3 rounded border ${isSelected ? 'border-pb-accent' : 'border-slate-300'} bg-white ${block.props?.className || ''}`}
      style={previewStyle}
    >
      {block.type === 'Text' && renderRichText(block.props?.content, 'Texte', 'text-slate-800')}
      {block.type === 'Paragraph' && renderRichText(block.props?.content, 'Paragraphe', 'text-slate-700 leading-relaxed')}
      {block.type === 'H1' && renderRichText(block.props?.content, 'Titre H1', 'text-3xl font-bold')}
      {block.type === 'H2' && renderRichText(block.props?.content, 'Titre H2', 'text-2xl font-bold')}
      {block.type === 'H3' && renderRichText(block.props?.content, 'Titre H3', 'text-xl font-bold')}
      {block.type === 'H4' && renderRichText(block.props?.content, 'Titre H4', 'text-lg font-semibold')}
      {block.type === 'Quote' && (
        <blockquote className="border-l-4 border-pb-accent pl-3 italic text-slate-700">
          {block.props?.content || 'Citation'}
        </blockquote>
      )}
      {block.type === 'Divider' && <hr className="my-4 border-slate-300" />}
      {block.type === 'Spacer' && <div style={{ height: block.props?.style?.height || '32px' }} />}
      {block.type === 'Button' && (
        <a
          href={getButtonHref(block.props, siteSlug)}
          onClick={(e) => e.preventDefault()}
          className="inline-flex px-4 py-2 bg-blue-600 text-white rounded-md"
        >
          {block.props?.content || 'Bouton'}
        </a>
      )}
      {block.type === 'Image' && <img src={block.props?.src || 'https://placehold.co/600x400/png'} alt={block.props?.alt || 'Image'} className="max-w-full h-auto" />}
      {(block.type === 'Section' || block.type === 'Container' || block.type === 'Card') && (
        <div
          ref={setPreviewSectionDropRef}
          className={`p-3 border border-dashed rounded-md ${isPreviewSectionOver ? 'border-pb-accent bg-blue-50/10' : 'border-blue-300/50 hover:border-blue-300'}`}
        >
          <div className="text-blue-600 font-semibold mb-2 uppercase text-xs">{block.type === 'Section' ? 'Section' : block.type === 'Container' ? 'Colonne' : 'Carte'}</div>
          <div style={getSectionChildrenLayoutStyle(block)}>
            {(block.children || []).map((child) => (
              <NestedBlockPreview key={child.id} block={child} siteSlug={siteSlug} />
            ))}
          </div>
        </div>
      )}
      {block.type === 'Table' && <div className="text-sm text-slate-700">Tableau ({(block.props?.headers || []).length} colonnes)</div>}
      {block.type === 'UL' && (
        <ul className="list-disc pl-5 space-y-1 [&_a]:underline [&_a]:underline-offset-2">
          {getListItems(block).map((item, i) => (
            <li key={`preview-li-${i}`} dangerouslySetInnerHTML={{ __html: sanitizeRichText(item) }} />
          ))}
        </ul>
      )}
      {block.type === 'SocialLinks' && (
        <div className="flex flex-wrap gap-2">
          {(Array.isArray(block.props?.items) ? block.props.items : []).map((item, i) => {
            const iconName = getSocialIconComponent(item?.icon);
            return (
              <a
                key={`social-preview-${i}`}
                href={item?.href || '#'}
                onClick={(e) => e.preventDefault()}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700"
                aria-label={getSocialLabelForIcon(item?.icon)}
              >
                <SocialIconSvg name={iconName} size={16} />
              </a>
            );
          })}
        </div>
      )}
      {block.type === 'Accordion' && (
        <div className="space-y-2">
          {(Array.isArray(block.props?.items) ? block.props.items : []).map((item, i) => (
            <details key={`accordion-preview-${i}`} className="group rounded-lg border border-slate-200 bg-white" onClick={(e) => e.preventDefault()}>
              <summary className="flex cursor-pointer items-center justify-between p-4 font-medium text-slate-900">
                {item.title}
                <svg fill="none" height="24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
              </summary>
            </details>
          ))}
        </div>
      )}
      {block.type === 'LI' && <li>{block.props?.content || 'Element de liste'}</li>}
    </div>
  );
}

function SortableBlock({ block, siteSlug }) {
  const { selectBlock, selectedBlockId } = useEditorStore();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
    data: { block, isCanvasItem: true },
  });
  const canReceiveChildren = block.type === 'Section' || block.type === 'Container' || block.type === 'Card';
  const sectionDropId = canReceiveChildren ? `section-${block.id}` : `block-drop-${block.id}`;
  const { setNodeRef: setSectionDropRef, isOver: isSectionOver } = useDroppable({
    id: sectionDropId,
    data: { isSectionDrop: canReceiveChildren, sectionId: canReceiveChildren ? block.id : null },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1, // Effet de translucidité quand on soulève le bloc
    ...(block.props?.style || {}),
  };

  const isSelected = selectedBlockId === block.id;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        e.stopPropagation();
        selectBlock(block.id);
      }}
      className={`relative p-4 rounded-md mb-2 cursor-grab active:cursor-grabbing transition-all duration-200 bg-transparent ${
        isDragging ? 'bg-blue-50/50 scale-105 shadow-2xl z-50 outline outline-4 outline-blue-200 border-blue-400' : ''
      } ${
        isSelected && !isDragging ? 'outline outline-2 outline-pb-accent outline-offset-2 shadow-md' : (!isDragging ? 'outline outline-1 outline-dashed outline-gray-300 outline-offset-2 hover:outline-gray-400' : '')
      }`}
    >
      {/* Rendu basique du contenu selon son type */}
      {block.type === 'Text' && renderRichText(block.props?.content, 'Texte...', `text-black h-full w-full ${block.props?.className || ''}`)}
      {block.type === 'Paragraph' && renderRichText(block.props?.content, 'Paragraphe...', `text-black h-full w-full ${block.props?.className || ''}`)}
      {block.type === 'H1' && renderRichText(block.props?.content, 'Titre H1...', `text-4xl font-bold text-black h-full w-full ${block.props?.className || ''}`)}
      {block.type === 'H2' && renderRichText(block.props?.content, 'Titre H2...', `text-3xl font-bold text-black h-full w-full ${block.props?.className || ''}`)}
      {block.type === 'H3' && renderRichText(block.props?.content, 'Titre H3...', `text-2xl font-bold text-black h-full w-full ${block.props?.className || ''}`)}
      {block.type === 'H4' && renderRichText(block.props?.content, 'Titre H4...', `text-xl font-semibold text-black h-full w-full ${block.props?.className || ''}`)}
      {block.type === 'Quote' && (
        <blockquote className={`border-l-4 border-blue-400 pl-4 italic text-slate-700 ${block.props?.className || ''}`}>
          {block.props?.content || 'Citation...'}
        </blockquote>
      )}
      {block.type === 'Divider' && <hr className={`my-4 border-slate-300 ${block.props?.className || ''}`} />}
      {block.type === 'Spacer' && <div className={`${block.props?.className || ''}`} style={{ height: block.props?.style?.height || '32px' }} />}
      {block.type === 'UL' && (
        <ul className={`list-disc pl-5 text-black h-full w-full [&_a]:underline [&_a]:underline-offset-2 ${block.props?.className || ''}`}>
          {getListItems(block).map((item, i) => (
            <li key={`editor-ul-${block.id}-${i}`} dangerouslySetInnerHTML={{ __html: sanitizeRichText(item) }} />
          ))}
        </ul>
      )}
      {block.type === 'LI' && <li className={`text-black h-full w-full ${block.props?.className || ''}`}>{block.props?.content || 'Elément de liste...'}</li>}
      {block.type === 'Image' && <img src={block.props?.src || "https://placehold.co/600x400/png"} alt={block.props?.alt || "Image"} className={`max-w-full h-auto ${block.props?.className || ''}`} />}
      {(block.type === 'Section' || block.type === 'Container' || block.type === 'Card') && (
        <div
          ref={setSectionDropRef}
          className={`p-4 border border-dashed rounded-md transition ${isSectionOver ? 'border-pb-accent bg-blue-50/10' : 'border-blue-300/50 hover:border-blue-300/80'} ${block.props?.className || ''}`}
          onClick={(e) => {
            e.stopPropagation();
            selectBlock(block.id);
          }}
        >
          <div className="text-blue-600 font-semibold mb-2 uppercase text-xs tracking-wide">{block.type === 'Section' ? 'Section' : block.type === 'Container' ? 'Colonne' : 'Carte'}</div>
          {!block.children?.length ? (
            <div className="text-blue-400 text-sm">Glissez des blocs ici</div>
          ) : (
            <div style={getSectionChildrenLayoutStyle(block)}>
              {block.children.map((child) => (
                <NestedBlockPreview key={child.id} block={child} siteSlug={siteSlug} />
              ))}
            </div>
          )}
        </div>
      )}
      {block.type === 'Button' && (
        <a
          href={getButtonHref(block.props, siteSlug)}
          onClick={(e) => e.preventDefault()}
          className={`inline-flex px-4 py-2 bg-blue-600 text-white font-bold rounded-md ${block.props?.className || ''}`}
          target={block.props?.openInNewTab ? '_blank' : '_self'}
          rel={block.props?.openInNewTab ? 'noreferrer' : undefined}
        >
          {block.props?.content || 'Bouton'}
        </a>
      )}
      {block.type === 'Table' && (
        <div className="overflow-x-auto border rounded-md border-slate-300">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-slate-100">
              <tr>
                {(block.props?.headers || []).map((h, i) => (
                  <th key={`h-${i}`} className="border border-slate-300 p-2 text-left font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(block.props?.rows || []).map((row, rIndex) => (
                <tr key={`r-${rIndex}`}>
                  {row.map((cell, cIndex) => (
                    <td key={`c-${rIndex}-${cIndex}`} className="border border-slate-300 p-2">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {block.type === 'SocialLinks' && (
        <div className={`flex flex-wrap gap-2 ${block.props?.className || ''}`}>
          {(Array.isArray(block.props?.items) ? block.props.items : []).map((item, i) => {
            const iconName = getSocialIconComponent(item?.icon);
            return (
              <a
                key={`social-editor-${block.id}-${i}`}
                href={item?.href || '#'}
                onClick={(e) => e.preventDefault()}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700"
                aria-label={getSocialLabelForIcon(item?.icon)}
              >
                <SocialIconSvg name={iconName} size={16} />
              </a>
            );
          })}
        </div>
      )}
      {block.type === 'Accordion' && (
        <div className={`space-y-2 ${block.props?.className || ''}`}>
          {(Array.isArray(block.props?.items) ? block.props.items : []).map((item, i) => (
            <details key={`accordion-${block.id}-${i}`} className="group rounded-lg border border-slate-200 bg-white" onClick={(e) => e.preventDefault()}>
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
      )}

      {isSelected && (
        <div className="absolute -top-3 -right-3 bg-pb-accent text-white text-xs px-2 py-1 rounded shadow-sm">
          {getBlockDisplayName(block.type)}
        </div>
      )}
    </div>
  );
}

// --- LAYOUT PRINCIPAL ---

export default function EditorClient({ siteSlug, pagePath, pageId, initialBlocks, initialPageSettings }) {
  const [isMounted, setIsMounted] = useState(false);
  const [activeId, setActiveId] = useState(null); // Pour le DragOverlay
  const [isPending, startTransition] = useTransition();
  const [copiedBlock, setCopiedBlock] = useState(null);
  const richEditorRef = useRef(null);
  const listEditorRef = useRef(null);
  const [pageSettings, setPageSettings] = useState(PAGE_SETTINGS_DEFAULTS);

  const { 
    blocks,
    initBlocks,
    getBlockById,
    selectedBlockId, 
    previewMode, 
    setPreviewMode, 
    addBlock,
    selectBlock,
    updateBlock,
    reorderBlocks,
    deleteBlock
  } = useEditorStore();

  const hydratedPageRef = useRef(null);
  const lastOverIdRef = useRef(null);

  useEffect(() => {
    setIsMounted(true);
    // Re-hydrate only when opening a different page, not on editor re-renders.
    if (hydratedPageRef.current !== pageId) {
      initBlocks(initialBlocks || []);
      selectBlock(null);
      setPageSettings({ ...PAGE_SETTINGS_DEFAULTS, ...(initialPageSettings || {}) });
      hydratedPageRef.current = pageId;
    }
  }, [pageId, initialBlocks, initialPageSettings, initBlocks, selectBlock]);

  const updatePageSetting = (key, value) => {
    setPageSettings((prev) => ({ ...prev, [key]: value }));
  };

  const readClipboardFromStorage = () => {
    try {
      const raw = localStorage.getItem(BLOCK_CLIPBOARD_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || !parsed.type) return null;
      return parsed;
    } catch {
      return null;
    }
  };

  const selectedBlock = selectedBlockId ? getBlockById(selectedBlockId) : null;
  const isRichTextBlock = ['Text', 'Paragraph', 'H1', 'H2', 'H3', 'H4', 'Quote'].includes(selectedBlock?.type || '');
  const isListBlock = selectedBlock?.type === 'UL';
  const isHeadingBlock = ['H1', 'H2', 'H3', 'H4'].includes(selectedBlock?.type || '');
  const editorMinHeightClass = selectedBlock?.type === 'Paragraph'
    ? 'min-h-[176px]'
    : (isHeadingBlock ? 'min-h-[52px]' : 'min-h-[132px]');
  const editorMaxHeightClass = selectedBlock?.type === 'Paragraph' ? 'max-h-[520px]' : 'max-h-[320px]';

  const insertBlockAfterTarget = (targetId, blockToInsert) => {
    const targetInfo = findParentInfoInTree(blocks, targetId);
    if (!targetInfo) return;

    if (!targetInfo.parentId) {
      const nextBlocks = [...blocks];
      nextBlocks.splice(targetInfo.index + 1, 0, blockToInsert);
      reorderBlocks(nextBlocks);
      return;
    }

    const parentBlock = getBlockById(targetInfo.parentId);
    if (!parentBlock) return;

    const children = Array.isArray(parentBlock.children) ? [...parentBlock.children] : [];
    children.splice(targetInfo.index + 1, 0, blockToInsert);
    updateBlock(parentBlock.id, { children });
  };

  const copySelectedBlock = () => {
    if (!selectedBlock) return;
    const copied = cloneBlockWithFreshIds(selectedBlock);
    setCopiedBlock(copied);
    try {
      localStorage.setItem(BLOCK_CLIPBOARD_STORAGE_KEY, JSON.stringify(copied));
    } catch (_) {
      // no-op
    }
  };

  const duplicateSelectedBlock = () => {
    if (!selectedBlock) return;
    const duplicated = cloneBlockWithFreshIds(selectedBlock);
    insertBlockAfterTarget(selectedBlock.id, duplicated);
    selectBlock(duplicated.id);
  };

  const pasteCopiedBlock = () => {
    if (!selectedBlock) return;
    const clipboard = copiedBlock || readClipboardFromStorage();
    if (!clipboard) return;
    const pasted = cloneBlockWithFreshIds(clipboard);
    insertBlockAfterTarget(selectedBlock.id, pasted);
    selectBlock(pasted.id);
  };

  const normalizeButtonPagePath = (value) => normalizeSiteRelativePath(value);

  useEffect(() => {
    const initialClipboard = readClipboardFromStorage();
    if (initialClipboard) {
      setCopiedBlock(initialClipboard);
    }

    const onStorage = (event) => {
      if (event.key !== BLOCK_CLIPBOARD_STORAGE_KEY) return;
      const nextClipboard = readClipboardFromStorage();
      setCopiedBlock(nextClipboard);
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    const onKeyDown = (e) => {
      const target = e.target;
      const targetTag = target?.tagName?.toLowerCase();
      const isTypingTarget = target?.isContentEditable || ['input', 'textarea', 'select'].includes(targetTag);
      if (isTypingTarget) return;

      const isAccel = e.metaKey || e.ctrlKey;
      if (!isAccel) return;

      if (e.key.toLowerCase() === 'c' && selectedBlock) {
        e.preventDefault();
        copySelectedBlock();
      }

      if (e.key.toLowerCase() === 'd' && selectedBlock) {
        e.preventDefault();
        duplicateSelectedBlock();
      }

      if (e.key.toLowerCase() === 'v' && selectedBlock && copiedBlock) {
        e.preventDefault();
        pasteCopiedBlock();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedBlock, copiedBlock, blocks]);

  const handleSave = () => {
    startTransition(async () => {
      try {
        await savePageContent(pageId, {
          blocks,
          settings: pageSettings,
        });
        // On pourrait utiliser un toast ici au lieu de alert
      } catch(e) {
        console.error(e);
        alert('Erreur lors de la sauvegarde');
      }
    });
  };

  useEffect(() => {
    if (!selectedBlock || !isRichTextBlock || !richEditorRef.current) return;
    const html = selectedBlock.props?.content || '';
    if (richEditorRef.current.innerHTML !== html) {
      richEditorRef.current.innerHTML = html;
    }
  }, [selectedBlock?.id, selectedBlock?.props?.content, isRichTextBlock]);

  useEffect(() => {
    if (!selectedBlock || !isListBlock || !listEditorRef.current) return;
    const items = getListItems(selectedBlock);
    const listHtml = `<ul>${items.map((item) => `<li>${sanitizeRichText(item)}</li>`).join('')}</ul>`;
    if (listEditorRef.current.innerHTML !== listHtml) {
      listEditorRef.current.innerHTML = listHtml;
    }
  }, [selectedBlock?.id, selectedBlock?.props?.items, selectedBlock?.children, selectedBlock?.props?.content, isListBlock]);

  const updateStyle = (key, value) => {
    if (!selectedBlock) return;
    updateBlock(selectedBlock.id, {
      props: {
        ...selectedBlock.props,
        style: {
          ...selectedBlock.props?.style,
          [key]: value,
        },
      },
    });
  };

  const updateBorderStyle = (partialStyle) => {
    if (!selectedBlock) return;
    const current = getBorderPresetValues(selectedBlock.props?.style || {});
    const newBorder = {
      borderWidth: partialStyle.borderWidth !== undefined ? partialStyle.borderWidth : current.width,
      borderStyle: partialStyle.borderStyle !== undefined ? partialStyle.borderStyle : current.lineStyle,
      borderColor: partialStyle.borderColor !== undefined ? partialStyle.borderColor : current.color,
    };
    
    updateBlock(selectedBlock.id, {
      props: {
        ...selectedBlock.props,
        style: {
          ...selectedBlock.props?.style,
          border: undefined, // Clear the shorthand if it exists
          ...newBorder,
        },
      },
    });
  };
  const borderValues = getBorderPresetValues(selectedBlock?.props?.style || {});

  const ensureSectionColumns = (columnCount) => {
    if (!selectedBlock || selectedBlock.type !== 'Section') return;
    const baseChildren = Array.isArray(selectedBlock.children) ? [...selectedBlock.children] : [];
    const existingContainers = baseChildren
      .filter((c) => c.type === 'Container' || c.type === 'Section')
      .map((c) => ({ ...c, type: 'Container' }));
    const orphanBlocks = baseChildren.filter((c) => c.type !== 'Container' && c.type !== 'Section');
    const columns = existingContainers.length ? existingContainers : [];

    if (!columns.length && orphanBlocks.length) {
      columns.push({
        id: `block-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        type: 'Container',
        props: {
          style: {
            minHeight: '120px',
            padding: '16px',
            borderRadius: '10px',
            backgroundColor: '#f8fafc',
          },
        },
        children: orphanBlocks,
      });
    }

    const missing = Math.max(0, columnCount - columns.length);

    for (let i = 0; i < missing; i += 1) {
      columns.push({
        id: `block-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        type: 'Container',
        props: {
          style: {
            minHeight: '120px',
            padding: '16px',
            borderRadius: '10px',
            backgroundColor: '#f8fafc',
          },
        },
        children: [],
      });
    }

    const normalizedColumns = columns.slice(0, columnCount);
    const minColumnWidth = columnCount >= 3 ? 220 : 280;

    updateBlock(selectedBlock.id, {
      props: {
        ...selectedBlock.props,
        style: {
          ...selectedBlock.props?.style,
          display: 'grid',
          gridTemplateColumns: `repeat(auto-fit, minmax(${minColumnWidth}px, 1fr))`,
          gap: selectedBlock.props?.style?.gap || '24px',
        },
      },
      children: normalizedColumns,
    });
  };

  const resizeTable = (columnCount, rowCount) => {
    if (!selectedBlock || selectedBlock.type !== 'Table') return;
    const safeColumns = Math.max(1, columnCount);
    const safeRows = Math.max(1, rowCount);
    const currentHeaders = selectedBlock.props?.headers || [];
    const currentRows = selectedBlock.props?.rows || [];

    const headers = Array.from({ length: safeColumns }, (_, i) => currentHeaders[i] || `Colonne ${i + 1}`);
    const rows = Array.from({ length: safeRows }, (_, r) => {
      const existingRow = currentRows[r] || [];
      return Array.from({ length: safeColumns }, (_, c) => existingRow[c] || '');
    });

    updateBlock(selectedBlock.id, {
      props: {
        ...selectedBlock.props,
        headers,
        rows,
      },
    });
  };

  const updateTableHeader = (index, value) => {
    if (!selectedBlock || selectedBlock.type !== 'Table') return;
    const headers = [...(selectedBlock.props?.headers || [])];
    headers[index] = value;
    updateBlock(selectedBlock.id, { props: { ...selectedBlock.props, headers } });
  };

  const updateTableCell = (rowIndex, colIndex, value) => {
    if (!selectedBlock || selectedBlock.type !== 'Table') return;
    const rows = (selectedBlock.props?.rows || []).map((row) => [...row]);
    if (!rows[rowIndex]) rows[rowIndex] = [];
    rows[rowIndex][colIndex] = value;
    updateBlock(selectedBlock.id, { props: { ...selectedBlock.props, rows } });
  };

  const applyContentTag = (tagName) => {
    if (!selectedBlock || !richEditorRef.current) return;
    richEditorRef.current.focus();

    if (tagName === 'strong') {
      document.execCommand('bold');
    } else if (tagName === 'em') {
      document.execCommand('italic');
    } else if (tagName === 'a') {
      const url = window.prompt('URL du lien', 'https://');
      if (!url) return;
      document.execCommand('createLink', false, url);
    }

    updateBlock(selectedBlock.id, {
      props: {
        ...selectedBlock.props,
        content: richEditorRef.current.innerHTML,
      },
    });
  };

  const syncListItemsFromEditor = () => {
    if (!selectedBlock || selectedBlock.type !== 'UL' || !listEditorRef.current) return;
    const listItems = Array.from(listEditorRef.current.querySelectorAll('li'));
    const items = listItems.map((li) => sanitizeRichText(li.innerHTML || '')).filter((item) => item.trim().length > 0);
    updateBlock(selectedBlock.id, { props: { ...selectedBlock.props, items } });
  };

  const applyListTag = (tagName) => {
    if (!selectedBlock || selectedBlock.type !== 'UL' || !listEditorRef.current) return;
    listEditorRef.current.focus();
    if (tagName === 'strong') {
      document.execCommand('bold');
    } else if (tagName === 'em') {
      document.execCommand('italic');
    } else if (tagName === 'a') {
      const url = window.prompt('URL du lien', 'https://');
      if (!url) return;
      document.execCommand('createLink', false, url);
    }
    syncListItemsFromEditor();
  };

  const addListItem = () => {
    if (!selectedBlock || selectedBlock.type !== 'UL') return;
    const currentItems = getListItems(selectedBlock);
    updateBlock(selectedBlock.id, {
      props: {
        ...selectedBlock.props,
        items: [...currentItems, 'Nouvel element'],
      },
    });
  };

  const resizeSocialItems = (count) => {
    if (!selectedBlock || selectedBlock.type !== 'SocialLinks') return;
    const safeCount = Math.max(1, Math.min(12, Number(count) || 1));
    const currentItems = Array.isArray(selectedBlock.props?.items) ? selectedBlock.props.items : [];
    const nextItems = Array.from({ length: safeCount }, (_, index) => (
      currentItems[index] || createDefaultSocialItem(index)
    ));
    updateBlock(selectedBlock.id, { props: { ...selectedBlock.props, items: nextItems } });
  };

  const updateSocialItem = (index, partial) => {
    if (!selectedBlock || selectedBlock.type !== 'SocialLinks') return;
    const currentItems = Array.isArray(selectedBlock.props?.items) ? [...selectedBlock.props.items] : [];
    const current = currentItems[index] || createDefaultSocialItem(index);
    const nextItem = { ...current, ...partial };
    if (Object.prototype.hasOwnProperty.call(partial, 'icon')) {
      const normalized = normalizeSocialIconName(partial.icon);
      nextItem.icon = normalized;
      nextItem.label = getSocialLabelForIcon(normalized);
    }
    currentItems[index] = nextItem;
    updateBlock(selectedBlock.id, { props: { ...selectedBlock.props, items: currentItems } });
  };

  const resizeAccordionItems = (count) => {
    if (!selectedBlock || selectedBlock.type !== 'Accordion') return;
    const safeCount = Math.max(1, Math.min(20, Number(count) || 1));
    const currentItems = Array.isArray(selectedBlock.props?.items) ? selectedBlock.props.items : [];
    const nextItems = Array.from({ length: safeCount }, (_, index) => (
      currentItems[index] || { title: `Nouvelle question ${index + 1}`, content: 'Réponse...' }
    ));
    updateBlock(selectedBlock.id, { props: { ...selectedBlock.props, items: nextItems } });
  };

  const updateAccordionItem = (index, field, value) => {
    if (!selectedBlock || selectedBlock.type !== 'Accordion') return;
    const currentItems = Array.isArray(selectedBlock.props?.items) ? [...selectedBlock.props.items] : [];
    const current = currentItems[index] || { title: `Question ${index + 1}`, content: 'Réponse' };
    currentItems[index] = { ...current, [field]: value };
    updateBlock(selectedBlock.id, { props: { ...selectedBlock.props, items: currentItems } });
  };

  // Configuration dnd-kit
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // Fonction de collision custom: d'abord pointerWithin, sinon rectIntersection
  const customCollisionDetection = (args) => {
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) {
      return pointerCollisions;
    }
    return rectIntersection(args);
  };

  // Hook pour rendre le canvas capable de recevoir un Drop
  const { setNodeRef: setDroppableCanvasRef, isOver: isCanvasOver } = useDroppable({
    id: 'canvas-droppable',
    data: { isCanvas: true }
  });
  const { setNodeRef: setCanvasEndDropRef, isOver: isCanvasEndOver } = useDroppable({
    id: 'canvas-end-drop',
    data: { isCanvas: true },
  });

  // Événements du Drag & Drop
  const handleDragStart = (event) => {
    dndLog('🟡 [DND-START] Prise de', event.active.id, event.active.data.current);
    setActiveId(event.active.id);
    lastOverIdRef.current = null;
  };

  const handleDragOver = (event) => {
    if (event.over?.id) {
      if (lastOverIdRef.current !== event.over.id) {
        dndLog('🔵 [DND-OVER] Survol au dessus de:', event.over.id);
      }
      lastOverIdRef.current = event.over.id;
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);
    const currentBlocks = useEditorStore.getState().blocks;
    let resolvedOverId = over?.id || lastOverIdRef.current;
    
    dndLog('🟠 [DND-END] Lâché. Analyse:', { 
      active: active?.id, 
      over_brut: over?.id, 
      over_resolved: resolvedOverId,
      taille_canvas_avant: currentBlocks.length
    });

    let resolvedOverData = over?.data?.current || ((resolvedOverId === 'canvas-droppable' || resolvedOverId === 'canvas-end-drop') ? { isCanvas: true } : undefined);
    const activeIdValue = String(active?.id || '');
    const fallbackPaletteType = activeIdValue.startsWith('palette-') ? activeIdValue.replace('palette-', '') : null;
    const isPaletteDrag = Boolean(active?.data?.current?.isPaletteItem || fallbackPaletteType);
    const activePaletteType = active?.data?.current?.type || fallbackPaletteType;
    const isCanvasItemDrag = Boolean(active?.data?.current?.isCanvasItem || activeIdValue.startsWith('block-'));
    lastOverIdRef.current = null;

    if (!resolvedOverId) {
      if (isPaletteDrag && activePaletteType) {
        dndWarn('⚠️ [DND-FALLBACK] over=null depuis la palette, fallback forcé vers canvas-droppable.');
        resolvedOverId = 'canvas-droppable';
        resolvedOverData = { isCanvas: true };
      } else {
        dndError('❌ [DND-FAIL] Drop refusé: Aucune cible (over est null, t\'as lâché hors de la zone de drop). Le bloc ne sera pas ajouté.');
        return;
      }
    }

    // 1. Gérer l'ajout d'un nouveau composant depuis la palette
    if (isPaletteDrag && activePaletteType) {
      dndLog(`✨ [DND-ADD] Début ajout d'une Palette (${activePaletteType})...`);
      const newBlock = createBlock(activePaletteType);
      const uniqueId = newBlock.id;
      
      const isOverCanvas = resolvedOverId === 'canvas-droppable' || resolvedOverId === 'canvas-end-drop' || resolvedOverData?.isCanvas;
      const sectionId = resolvedOverData?.isSectionDrop ? resolvedOverData.sectionId : null;

      if (sectionId) {
        dndLog(`➡️ [DND-ADD-TARGET] Insertion dans la section ID: ${sectionId}`);
        addBlock(newBlock, sectionId);
      } else if (resolvedOverId && resolvedOverId !== 'canvas-droppable' && resolvedOverId !== 'canvas-end-drop' && !isOverCanvas) {
        // Si on drop sur un composant existant, on l'ajoute juste après lui
        const overIndex = currentBlocks.findIndex((b) => b.id === resolvedOverId);
        if (overIndex !== -1) {
            dndLog(`➡️ [DND-ADD-TARGET] Insertion APRES le bloc ID: ${resolvedOverId}`);
            const newBlocks = [...currentBlocks];
            newBlocks.splice(overIndex + 1, 0, newBlock);
            reorderBlocks(newBlocks);
        } else {
            dndLog('➡️ [DND-ADD-TARGET] Drop sur un objet pas en liste, on fallback à addBlock(fin de liste)');
            addBlock(newBlock);
        }
      } else {
        // Sinon à la fin du canvas
        dndLog('➡️ [DND-ADD-TARGET] Drop direct sur le fond de page, on fallback à addBlock(fin de liste)');
        addBlock(newBlock);
      }

      // On force la sélection juste après l'ajout pour que l'inspecteur reste ouvert, avec vérification logs.
      setTimeout(() => {
        const afterBlocks = useEditorStore.getState().blocks;
        if (afterBlocks.some((b) => b.id === uniqueId)) {
          selectBlock(uniqueId);
          dndLog(`✅ [DND-SUCCESS] Bloc ${uniqueId} trouvé dans le store! Total des blocs: ${afterBlocks.length}`);
        } else {
          dndError(`💥 [DND-BUG-ZUSTAND] Bloc disparu! L'appel addBlock n'a pas persisté l'état.`);
        }
      }, 50);
      return;
    }

    // 2. Gérer le réarrangement des composants existants sur le canvas
    if (isCanvasItemDrag && resolvedOverId !== active.id) {
      dndLog(`🔄 [DND-REORDER] Drag sur un bloc existant du canvas...`);
      if (resolvedOverId === 'canvas-droppable' || resolvedOverId === 'canvas-end-drop' || resolvedOverData?.isCanvas) {
        const oldIndex = currentBlocks.findIndex((b) => b.id === active.id);
        if (oldIndex !== -1 && oldIndex !== currentBlocks.length - 1) {
          reorderBlocks(arrayMove(currentBlocks, oldIndex, currentBlocks.length - 1));
        }
        return;
      }
      const oldIndex = currentBlocks.findIndex((b) => b.id === active.id);
      const newIndex = currentBlocks.findIndex((b) => b.id === resolvedOverId);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        dndLog(`➡️ [DND-REORDER] De index ${oldIndex} vers ${newIndex}`);
         reorderBlocks(arrayMove(currentBlocks, oldIndex, newIndex));
      } else {
        dndError('❌ [DND-REORDER-FAIL] Indexes introuvables');
      }
    }
  };

  // Composant: Barre d'outils
  const TopBar = () => (
    <header className="h-14 bg-pb-background border-b border-pb-border flex items-center px-4 justify-between">
      <div className="font-bold flex items-center gap-3">
        <a href={`/dashboard/${siteSlug}`} className="text-xs font-semibold px-2 py-1 rounded border border-pb-border hover:bg-pb-border/30 transition">← Dashboard</a>
        <span className="text-pb-accent">Pb</span>
        <span className="text-xs text-pb-foreground/60">{siteSlug} / {pagePath.join('/')}</span>
      </div>

      <div className="flex bg-pb-border/30 rounded-md p-1 border border-pb-border">
        <button 
          onClick={() => setPreviewMode('desktop')}
          className={`p-2 rounded-sm transition ${previewMode === 'desktop' ? 'bg-pb-background shadow text-pb-foreground' : 'text-pb-foreground/50 hover:bg-white/10'}`}
        >
          <Monitor size={16} />
        </button>
        <button 
          onClick={() => setPreviewMode('tablet')}
          className={`p-2 rounded-sm transition ${previewMode === 'tablet' ? 'bg-pb-background shadow text-pb-foreground' : 'text-pb-foreground/50 hover:bg-white/10'}`}
        >
          <Tablet size={16} />
        </button>
        <button 
          onClick={() => setPreviewMode('mobile')}
          className={`p-2 rounded-sm transition ${previewMode === 'mobile' ? 'bg-pb-background shadow text-pb-foreground' : 'text-pb-foreground/50 hover:bg-white/10'}`}
        >
          <Smartphone size={16} />
        </button>
      </div>

      <div className="flex gap-2">
        <ThemeToggle compact />
        <a href={`/view/${siteSlug}/${pagePath.join('/')}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-1.5 text-sm bg-pb-border/30 hover:bg-pb-border rounded-md transition border border-pb-border">
          <Eye size={16} /> Aperçu
        </a>
        <button onClick={handleSave} disabled={isPending} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-pb-accent text-white font-medium hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition shadow-md">
          <Save size={16} /> {isPending ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
    </header>
  );

  if (!isMounted) return null;

  return (
    <div className="h-screen w-full flex flex-col bg-pb-background text-pb-foreground overflow-hidden font-sans">
      <TopBar />

      <DndContext
        sensors={sensors}
        collisionDetection={customCollisionDetection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <main className="flex-1 flex overflow-hidden relative">
          {/* Colonne Gauche : Bibliothèque */}
          <aside className="w-72 flex-shrink-0 border-r border-pb-border bg-pb-background/50 p-4 overflow-y-auto relative z-50">
            <h2 className="text-xs font-bold text-pb-foreground/60 uppercase tracking-wider mb-4 flex items-center gap-2">
              Structure
              <InfoTip text="Commencez avec une section pour construire une zone. Les blocs peuvent ensuite etre glisses a l'interieur." />
            </h2>
            <div className="grid grid-cols-2 gap-2 mb-6">
              <PaletteItem type="Section" icon={Layers} label="Section" />
              <PaletteItem type="Divider" icon={AlignLeft} label="Separateur" />
              <PaletteItem type="Spacer" icon={AlignLeft} label="Espace" />
              <PaletteItem type="UL" icon={List} label="Liste" />
            </div>

            <h2 className="text-xs font-bold text-pb-foreground/60 uppercase tracking-wider mb-4 flex items-center gap-2">
              Titres et textes
              <InfoTip text="Hierarchie conseillee: H1 (titre principal), H2 (grande section), H3 (sous-section), H4 (detail)." />
            </h2>
            <div className="grid grid-cols-2 gap-2 mb-6">
              <PaletteItem type="H1" icon={Heading1} label="Titre 1" />
              <PaletteItem type="H2" icon={Heading2} label="Titre 2" />
              <PaletteItem type="H3" icon={Heading3} label="Titre 3" />
              <PaletteItem type="H4" icon={Heading4} label="Titre 4" />
              <PaletteItem type="Paragraph" icon={AlignLeft} label="Paragraphe" />
              <PaletteItem type="Text" icon={Type} label="Texte court" />
              <PaletteItem type="Quote" icon={AlignLeft} label="Citation" />
            </div>

            <h2 className="text-xs font-bold text-pb-foreground/60 uppercase tracking-wider mb-4">Media et actions</h2>
            <div className="grid grid-cols-2 gap-2">
              <PaletteItem type="Image" icon={ImageIcon} label="Image" />
              <PaletteItem type="Button" icon={Box} label="Bouton" />
              <PaletteItem type="SocialLinks" icon={Globe} label="Reseaux" />
              <PaletteItem type="Table" icon={Table2} label="Tableau" />
              <PaletteItem type="Accordion" icon={ListCollapse} label="FAQ" />
            </div>
          </aside>

          {/* Cœur Central : Le Canvas @dnd-kit */}
          <section className="flex-1 min-w-0 bg-pb-border/10 p-8 flex items-start justify-center overflow-y-auto overflow-x-auto relative">
            <div 
              ref={setDroppableCanvasRef}
              className={`self-start transition-all duration-300 ease-in-out text-black shadow-2xl rounded-sm ring-2 relative ${
                isCanvasOver ? 'ring-pb-accent ring-opacity-100 bg-blue-50/20' : 'ring-pb-border ring-opacity-50'
              } ${
                previewMode === 'desktop' ? 'w-full max-w-6xl' : 
                previewMode === 'tablet' ? 'w-[768px]' : 'w-[375px]'
              }`}
              style={{
                minHeight: 'calc(100vh - 8rem)',
                backgroundColor: '#ffffff',
                backgroundImage: [
                  pageSettings.backgroundImage || '',
                  pageSettings.backgroundColor && pageSettings.backgroundColor !== 'transparent' ? `linear-gradient(${pageSettings.backgroundColor}, ${pageSettings.backgroundColor})` : ''
                ].filter(Boolean).join(', ') || undefined
              }}
            >
              {!blocks.length && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-300 pointer-events-none select-none">
                  Glissez-déposez le premier composant ici
                </div>
              )}

              <div className="relative z-10 w-full p-8 min-h-[120vh] pb-36">
                <SortableContext 
                  items={blocks.map(b => b.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {blocks.map((block) => (
                    <SortableBlock key={block.id} block={block} siteSlug={siteSlug} />
                  ))}
                </SortableContext>

                <div
                  ref={setCanvasEndDropRef}
                  className={`mt-6 h-40 rounded-xl border-2 border-dashed flex items-center justify-center text-sm transition ${
                    isCanvasEndOver ? 'border-pb-accent bg-blue-50 text-blue-700' : 'border-pb-border text-pb-foreground/50 bg-pb-background/40'
                  }`}
                >
                  Deposez ici pour ajouter un bloc en bas de page
                </div>
              </div>
            </div>
          </section>

          {/* Colonne Droite : Inspecteur */}
          <aside className="w-80 flex-shrink-0 border-l border-pb-border bg-pb-background/95 overflow-y-auto relative z-50">
            <div className="p-4 border-b border-pb-border">
              <details className="group rounded-xl border border-pb-border bg-pb-background/70 shadow-sm overflow-hidden" open={!selectedBlock}>
                <summary className="text-sm font-semibold text-pb-foreground flex items-center gap-2 p-4 cursor-pointer outline-none group-open:border-b group-open:border-pb-border hover:bg-pb-border/10 transition-colors">
                  Paramètres de la page
                  <InfoTip text="Reglages globaux de la page: SEO, largeur de contenu et indexation." />
                  <svg className="ml-auto w-4 h-4 text-pb-foreground/50 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </summary>
                <div className="p-4 space-y-3 bg-pb-background">
                  <div>
                    <label className="block text-xs font-medium text-pb-foreground/70 mb-1">Meta titre (SEO)</label>
                    <input
                      type="text"
                      value={pageSettings.metaTitle || ''}
                      onChange={(e) => updatePageSetting('metaTitle', e.target.value)}
                      placeholder="Titre affiché dans Google"
                      className="w-full bg-pb-background border border-pb-border rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-pb-foreground/70 mb-1">Meta description</label>
                    <textarea
                      rows="3"
                      value={pageSettings.metaDescription || ''}
                      onChange={(e) => updatePageSetting('metaDescription', e.target.value)}
                      placeholder="Résumé court de la page"
                      className="w-full min-h-[96px] resize-y bg-pb-background border border-pb-border rounded-lg px-3 py-2 text-sm leading-relaxed"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-pb-foreground/70 mb-1">Largeur du contenu</label>
                    <select
                      value={pageSettings.contentWidth || '100%'}
                      onChange={(e) => updatePageSetting('contentWidth', e.target.value)}
                      className="w-full bg-pb-background border border-pb-border rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="100%">100% (plein écran)</option>
                      <option value="90%">90%</option>
                      <option value="80%">80%</option>
                      <option value="70%">70%</option>
                      <option value="60%">60%</option>
                    </select>
                  </div>
                  <ColorPicker
                    label="Couleur de fond"
                    value={pageSettings.backgroundColor}
                    onChange={(val) => updatePageSetting('backgroundColor', val)}
                  />
                  <div>
                    <label className="block text-xs font-medium text-pb-foreground/70 mb-1 gap-1">
                      Image / Dégradé de fond
                    </label>
                    <input
                      type="text"
                      value={pageSettings.backgroundImage || ''}
                      onChange={(e) => updatePageSetting('backgroundImage', e.target.value)}
                      placeholder="url('...') ou linear-gradient(...)"
                      className="w-full bg-pb-background border border-pb-border rounded-lg px-3 py-2 text-sm"
                    />
                    <p className="text-[10px] text-pb-foreground/50 mt-1">Ex: linear-gradient(to right, #ff7e5f, #feb47b) ou url('https://...')</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-pb-foreground/70 mb-1">Classe CSS de la page (conteneur global)</label>
                    <input
                      type="text"
                      value={pageSettings.customClassName || ''}
                      onChange={(e) => updatePageSetting('customClassName', e.target.value)}
                      placeholder="ex: pb-page-landing max-w-screen-xl"
                      className="w-full bg-pb-background border border-pb-border rounded-lg px-3 py-2 text-sm"
                    />
                    <p className="text-[11px] text-pb-foreground/60 mt-1">Pour un bloc precis, utilisez le champ "Classe CSS du bloc (avance)" plus bas.</p>
                  </div>
                  <label className="inline-flex items-center gap-2 text-xs text-pb-foreground/70 pt-2 block">
                    <input
                      type="checkbox"
                      checked={Boolean(pageSettings.noIndex)}
                      onChange={(e) => updatePageSetting('noIndex', e.target.checked)}
                      className="rounded border-pb-border text-pb-accent focus:ring-pb-accent"
                    />
                    Ne pas indexer cette page (noindex)
                  </label>
                </div>
              </details>
            </div>
            {!selectedBlock ? (
               <div className="h-full flex flex-col items-center justify-start text-pb-foreground/50 p-6 text-center text-sm">
                  <span className="w-12 h-12 bg-pb-border/20 rounded-full flex items-center justify-center mb-3">
                    <Box size={24} />
                  </span>
                  Sélectionnez un bloc sur le canvas pour modifier ses propriétés.
               </div>
            ) : (
              <div className="p-4">
                <h2 className="text-sm font-bold border-b border-pb-border pb-2 mb-4 flex justify-between">
                  Reglages du bloc <span className="text-pb-foreground/60 font-mono">{getBlockDisplayName(selectedBlock.type)}</span>
                </h2>
                <button
                  onClick={() => {
                    deleteBlock(selectedBlock.id);
                  }}
                  className="w-full mb-4 bg-red-500/10 border border-red-400/30 text-red-500 font-bold py-2 rounded text-sm hover:bg-red-500/20 transition"
                >
                  Supprimer ce composant
                </button>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <button
                    type="button"
                    onClick={copySelectedBlock}
                    className="px-2 py-2 rounded border border-pb-border text-xs font-semibold hover:bg-pb-border/20 transition"
                  >
                    Copier
                  </button>
                  <button
                    type="button"
                    onClick={pasteCopiedBlock}
                    disabled={!copiedBlock}
                    className="px-2 py-2 rounded border border-pb-border text-xs font-semibold hover:bg-pb-border/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Coller
                  </button>
                  <button
                    type="button"
                    onClick={duplicateSelectedBlock}
                    className="px-2 py-2 rounded border border-pb-border text-xs font-semibold hover:bg-pb-border/20 transition"
                  >
                    Dupliquer
                  </button>
                </div>
                <details className="group rounded-xl border border-pb-border bg-pb-background/70 shadow-sm overflow-hidden" open>
                  <summary className="text-sm font-semibold text-pb-foreground flex items-center gap-2 p-4 cursor-pointer outline-none group-open:border-b group-open:border-pb-border hover:bg-pb-border/10 transition-colors">
                    Paramètres du composant
                    <InfoTip text="Modifiez le contenu, la typographie, les couleurs et les styles de votre composant." />
                    <svg className="ml-auto w-4 h-4 text-pb-foreground/50 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                  </summary>
                  <div className="p-4 space-y-4 bg-pb-background">
                    <div className="rounded-xl border border-pb-border bg-pb-background/70 p-4 space-y-3 shadow-sm">
                      <h3 className="text-sm font-semibold text-pb-foreground flex items-center gap-2">
                        Contenu
                        <InfoTip text="Modifiez le texte principal du composant. Pour les paragraphes, vous pouvez utiliser les boutons gras/italique/lien." />
                      </h3>
                      {['Text', 'Paragraph', 'H1', 'H2', 'H3', 'H4', 'Quote', 'Button', 'LI'].includes(selectedBlock.type) && (
                      <div>
                        <label className="block text-xs font-medium text-pb-foreground/70 mb-1">Texte</label>
                        {['Text', 'Paragraph', 'H1', 'H2', 'H3', 'H4', 'Quote'].includes(selectedBlock.type) && (
                          <div className="flex flex-wrap gap-2 mb-2">
                            <button type="button" onClick={() => applyContentTag('strong')} className="px-2 py-1 rounded border border-pb-border text-xs">Gras</button>
                            <button type="button" onClick={() => applyContentTag('em')} className="px-2 py-1 rounded border border-pb-border text-xs">Italique</button>
                            <button type="button" onClick={() => applyContentTag('a')} className="px-2 py-1 rounded border border-pb-border text-xs">Lien</button>
                          </div>
                        )}
                        {isRichTextBlock ? (
                          <div
                            ref={richEditorRef}
                            contentEditable
                            suppressContentEditableWarning
                            onInput={(e) => updateBlock(selectedBlock.id, { props: { ...selectedBlock.props, content: e.currentTarget.innerHTML } })}
                            className={`w-full ${editorMinHeightClass} ${editorMaxHeightClass} overflow-y-auto bg-pb-background border border-pb-border rounded-lg px-3 py-2 text-sm leading-relaxed outline-none [&>h1]:text-3xl [&>h1]:font-bold [&>h1]:leading-tight [&>h1]:mb-2 [&>h2]:text-2xl [&>h2]:font-bold [&>h2]:leading-tight [&>h2]:mb-2 [&>h3]:text-xl [&>h3]:font-semibold [&>h3]:leading-tight [&>h3]:mb-2 [&>h4]:text-lg [&>h4]:font-semibold [&>h4]:leading-tight [&>h4]:mb-2 [&>p]:leading-relaxed [&>p]:mb-3 [&>p:last-child]:mb-0 [&_a]:underline [&_a]:underline-offset-2`}
                          />
                        ) : (
                          <textarea
                            rows={selectedBlock.type === 'Paragraph' ? 8 : (isHeadingBlock ? 2 : 6)}
                            value={selectedBlock.props?.content || ''}
                            onChange={(e) => updateBlock(selectedBlock.id, { props: { ...selectedBlock.props, content: e.target.value } })}
                            className="w-full min-h-[140px] resize-y bg-pb-background border border-pb-border rounded-lg px-3 py-2 text-sm leading-relaxed"
                          />
                        )}
                      </div>
                    )}

                    {selectedBlock.type === 'UL' && (
                      <div className="space-y-2">
                        <label className="block text-xs font-medium text-pb-foreground/70">Elements de la liste</label>
                        <div className="flex flex-wrap gap-2 mb-2">
                          <button type="button" onClick={() => applyListTag('strong')} className="px-2 py-1 rounded border border-pb-border text-xs">Gras</button>
                          <button type="button" onClick={() => applyListTag('em')} className="px-2 py-1 rounded border border-pb-border text-xs">Italique</button>
                          <button type="button" onClick={() => applyListTag('a')} className="px-2 py-1 rounded border border-pb-border text-xs">Lien</button>
                          <button type="button" onClick={addListItem} className="px-2 py-1 rounded border border-pb-border text-xs">+ Element</button>
                        </div>
                        <div
                          ref={listEditorRef}
                          contentEditable
                          suppressContentEditableWarning
                          onInput={syncListItemsFromEditor}
                          className="w-full min-h-[180px] max-h-[420px] overflow-y-auto bg-pb-background border border-pb-border rounded-lg px-3 py-2 text-sm leading-relaxed outline-none [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2 [&_a]:underline [&_a]:underline-offset-2"
                        />
                        <p className="text-[11px] text-pb-foreground/60">Ajoutez autant d'elements que vous voulez avec le bouton + Element.</p>
                      </div>
                    )}

                    {selectedBlock.type === 'Image' && (
                      <div className="space-y-2">
                        <label className="block text-xs font-medium text-pb-foreground/70">Adresse de l'image</label>
                        <input type="text" value={selectedBlock.props?.src || ''} onChange={(e) => updateBlock(selectedBlock.id, { props: { ...selectedBlock.props, src: e.target.value } })} className="w-full bg-pb-background border border-pb-border rounded-lg px-3 py-2 text-sm" />
                        <label className="block text-xs font-medium text-pb-foreground/70">Description image (accessibilite)</label>
                        <input type="text" value={selectedBlock.props?.alt || ''} onChange={(e) => updateBlock(selectedBlock.id, { props: { ...selectedBlock.props, alt: e.target.value } })} className="w-full bg-pb-background border border-pb-border rounded-lg px-3 py-2 text-sm" />
                      </div>
                    )}

                    {selectedBlock.type === 'Button' && (
                      <div className="space-y-2">
                        <label className="block text-xs font-medium text-pb-foreground/70">Action du bouton</label>
                        <select
                          value={selectedBlock.props?.actionType || 'none'}
                          onChange={(e) => updateBlock(selectedBlock.id, { props: { ...selectedBlock.props, actionType: e.target.value } })}
                          className="w-full bg-pb-background border border-pb-border rounded-lg px-3 py-2 text-sm"
                        >
                          <option value="none">Aucune action</option>
                          <option value="link">Lien externe</option>
                          <option value="page">Vers une page du site</option>
                          <option value="file">Telecharger un fichier</option>
                          <option value="email">Envoyer un email</option>
                          <option value="phone">Appeler un numero</option>
                        </select>

                        {selectedBlock.props?.actionType === 'link' && (
                          <div>
                            <label className="block text-xs font-medium text-pb-foreground/70 mb-1">URL du lien</label>
                            <input type="text" value={selectedBlock.props?.href || ''} onChange={(e) => updateBlock(selectedBlock.id, { props: { ...selectedBlock.props, href: e.target.value } })} placeholder="https://exemple.com" className="w-full bg-pb-background border border-pb-border rounded-lg px-3 py-2 text-sm" />
                          </div>
                        )}
                        {selectedBlock.props?.actionType === 'page' && (
                          <div>
                            <label className="block text-xs font-medium text-pb-foreground/70 mb-1">Chemin de page</label>
                            <input
                              type="text"
                              value={selectedBlock.props?.pagePath || ''}
                              onChange={(e) => updateBlock(selectedBlock.id, { props: { ...selectedBlock.props, pagePath: normalizeButtonPagePath(e.target.value) } })}
                              placeholder="contact ou /contact"
                              className="w-full bg-pb-background border border-pb-border rounded-lg px-3 py-2 text-sm"
                            />
                            <p className="text-[11px] text-pb-foreground/60 mt-1">Chemin interne au site seulement (sans domaine, sans /view/...).</p>
                          </div>
                        )}
                        {selectedBlock.props?.actionType === 'file' && (
                          <div>
                            <label className="block text-xs font-medium text-pb-foreground/70 mb-1">URL du fichier</label>
                            <input type="text" value={selectedBlock.props?.fileUrl || ''} onChange={(e) => updateBlock(selectedBlock.id, { props: { ...selectedBlock.props, fileUrl: e.target.value } })} placeholder="https://monsite.com/guide.pdf" className="w-full bg-pb-background border border-pb-border rounded-lg px-3 py-2 text-sm" />
                          </div>
                        )}
                        {selectedBlock.props?.actionType === 'email' && (
                          <div>
                            <label className="block text-xs font-medium text-pb-foreground/70 mb-1">Adresse email</label>
                            <input type="text" value={selectedBlock.props?.email || ''} onChange={(e) => updateBlock(selectedBlock.id, { props: { ...selectedBlock.props, email: e.target.value } })} placeholder="contact@monsite.com" className="w-full bg-pb-background border border-pb-border rounded-lg px-3 py-2 text-sm" />
                          </div>
                        )}
                        {selectedBlock.props?.actionType === 'phone' && (
                          <div>
                            <label className="block text-xs font-medium text-pb-foreground/70 mb-1">Numéro de téléphone</label>
                            <input type="text" value={selectedBlock.props?.phone || ''} onChange={(e) => updateBlock(selectedBlock.id, { props: { ...selectedBlock.props, phone: e.target.value } })} placeholder="+33 6 12 34 56 78" className="w-full bg-pb-background border border-pb-border rounded-lg px-3 py-2 text-sm" />
                          </div>
                        )}

                        <label className="inline-flex items-center gap-2 text-xs text-pb-foreground/70">
                          <input
                            type="checkbox"
                            checked={Boolean(selectedBlock.props?.openInNewTab)}
                            onChange={(e) => updateBlock(selectedBlock.id, { props: { ...selectedBlock.props, openInNewTab: e.target.checked } })}
                          />
                          Ouvrir dans un nouvel onglet
                        </label>
                      </div>
                    )}

                    {selectedBlock.type === 'SocialLinks' && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-pb-foreground/70 mb-1">Nombre d'icones</label>
                          <input
                            type="number"
                            min="1"
                            max="12"
                            value={(selectedBlock.props?.items || []).length || 1}
                            onChange={(e) => resizeSocialItems(e.target.value)}
                            className="w-full bg-pb-background border border-pb-border rounded-lg px-3 py-2 text-sm"
                          />
                        </div>

                        <div className="space-y-3">
                          {(Array.isArray(selectedBlock.props?.items) ? selectedBlock.props.items : []).map((item, index) => (
                            <div key={`social-item-${index}`} className="rounded-lg border border-pb-border p-3 bg-pb-background/50 space-y-2">
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-[11px] text-pb-foreground/70 mb-1">Icone</label>
                                  <select
                                    value={normalizeSocialIconName(item?.icon) || 'website'}
                                    onChange={(e) => updateSocialItem(index, { icon: e.target.value })}
                                    className="w-full bg-pb-background border border-pb-border rounded-lg px-2 py-2 text-xs"
                                  >
                                    {SOCIAL_ICON_OPTIONS.map((option) => (
                                      <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-[11px] text-pb-foreground/70 mb-1">Libelle (auto)</label>
                                  <div className="w-full bg-pb-background border border-pb-border rounded-lg px-2 py-2 text-xs text-pb-foreground/80">
                                    {getSocialLabelForIcon(item?.icon)}
                                  </div>
                                </div>
                              </div>
                              <div>
                                <label className="block text-[11px] text-pb-foreground/70 mb-1">Lien</label>
                                <input
                                  type="text"
                                  value={item?.href || ''}
                                  onChange={(e) => updateSocialItem(index, { href: e.target.value })}
                                  placeholder="https://"
                                  className="w-full bg-pb-background border border-pb-border rounded-lg px-2 py-2 text-xs"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedBlock.type === 'Accordion' && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-pb-foreground/70 mb-1">Nombre de questions</label>
                          <input
                            type="number"
                            min="1"
                            max="20"
                            value={(selectedBlock.props?.items || []).length || 1}
                            onChange={(e) => resizeAccordionItems(e.target.value)}
                            className="w-full bg-pb-background border border-pb-border rounded-lg px-3 py-2 text-sm"
                          />
                        </div>
                        <div className="space-y-3">
                          {(Array.isArray(selectedBlock.props?.items) ? selectedBlock.props.items : []).map((item, index) => (
                            <div key={`accordion-item-${index}`} className="rounded-lg border border-pb-border p-3 bg-pb-background/50 space-y-2">
                              <div>
                                <label className="block text-[11px] text-pb-foreground/70 mb-1">Question</label>
                                <input
                                  type="text"
                                  value={item?.title || ''}
                                  onChange={(e) => updateAccordionItem(index, 'title', e.target.value)}
                                  className="w-full bg-pb-background border border-pb-border rounded-lg px-2 py-2 text-xs font-semibold"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] text-pb-foreground/70 mb-1">Réponse</label>
                                <textarea
                                  value={item?.content || ''}
                                  onChange={(e) => updateAccordionItem(index, 'content', e.target.value)}
                                  rows={3}
                                  className="w-full bg-pb-background border border-pb-border rounded-lg px-2 py-2 text-xs"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {selectedBlock.type === 'Section' && (
                    <div className="rounded-xl border border-pb-border bg-pb-background/70 p-4 space-y-3 shadow-sm">
                      <h3 className="text-sm font-semibold text-pb-foreground">Disposition de section</h3>
                      <p className="text-xs text-pb-foreground/60">Cliquez sur un preset pour creer automatiquement des colonnes de contenu.</p>
                      <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => updateStyle('display', 'block')} className="px-2 py-2 rounded-lg text-xs">1 colonne</button>
                        <button onClick={() => ensureSectionColumns(2)} className="px-2 py-2 rounded-lg text-xs">2 colonnes</button>
                        <button onClick={() => ensureSectionColumns(3)} className="px-2 py-2 rounded-lg text-xs">3 colonnes</button>
                        <button onClick={() => updateBlock(selectedBlock.id, { children: [] })} className="px-2 py-2 rounded-lg border border-pb-border text-xs">Vider colonnes</button>
                      </div>
                    </div>
                  )}

                  {selectedBlock.type === 'Table' && (
                    <div className="rounded-xl border border-pb-border bg-pb-background/70 p-4 space-y-3 shadow-sm">
                      <h3 className="text-sm font-semibold text-pb-foreground">Tableau</h3>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-pb-foreground/70 mb-1">Colonnes</label>
                          <input
                            type="number"
                            min="1"
                            value={(selectedBlock.props?.headers || []).length}
                            onChange={(e) => resizeTable(Number(e.target.value || 1), (selectedBlock.props?.rows || []).length || 1)}
                            className="w-full bg-pb-background border border-pb-border rounded-lg px-2 py-1 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-pb-foreground/70 mb-1">Lignes</label>
                          <input
                            type="number"
                            min="1"
                            value={(selectedBlock.props?.rows || []).length}
                            onChange={(e) => resizeTable((selectedBlock.props?.headers || []).length || 1, Number(e.target.value || 1))}
                            className="w-full bg-pb-background border border-pb-border rounded-lg px-2 py-1 text-xs"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-xs font-semibold text-pb-foreground/70">Entetes</h4>
                        <div className="grid gap-2">
                          {(selectedBlock.props?.headers || []).map((header, colIndex) => (
                            <input
                              key={`header-${colIndex}`}
                              type="text"
                              value={header}
                              onChange={(e) => updateTableHeader(colIndex, e.target.value)}
                              className="w-full bg-pb-background border border-pb-border rounded-lg px-2 py-1 text-xs"
                              placeholder={`Colonne ${colIndex + 1}`}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-xs font-semibold text-pb-foreground/70">Cellules</h4>
                        <div className="overflow-auto max-h-52 border border-pb-border rounded-lg p-2 bg-pb-background/40 space-y-2">
                          {(selectedBlock.props?.rows || []).map((row, rIndex) => (
                            <div key={`row-${rIndex}`} className="grid gap-2" style={{ gridTemplateColumns: `repeat(${(selectedBlock.props?.headers || []).length || 1}, minmax(0, 1fr))` }}>
                              {row.map((cell, cIndex) => (
                                <input
                                  key={`cell-${rIndex}-${cIndex}`}
                                  type="text"
                                  value={cell}
                                  onChange={(e) => updateTableCell(rIndex, cIndex, e.target.value)}
                                  className="w-full bg-white border border-pb-border rounded px-2 py-1 text-xs"
                                />
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedBlock.type === 'Spacer' && (
                    <div className="rounded-xl border border-pb-border bg-pb-background/70 p-4 space-y-3 shadow-sm">
                      <h3 className="text-sm font-semibold text-pb-foreground">Espace vide</h3>
                      <label className="block text-xs text-pb-foreground/70 mb-1">Hauteur (ex: 24px, 3rem)</label>
                      <input
                        type="text"
                        value={selectedBlock.props?.style?.height || ''}
                        onChange={(e) => updateStyle('height', e.target.value)}
                        className="w-full bg-pb-background border border-pb-border rounded-lg px-2 py-1 text-xs"
                      />
                    </div>
                  )}

                  <div className="rounded-xl border border-pb-border bg-pb-background/70 p-4 space-y-3 shadow-sm">
                    <h3 className="text-sm font-semibold text-pb-foreground flex items-center gap-2">
                      Mise en page
                      <InfoTip text="Organisation du bloc: affichage, alignements, espacements et tailles." />
                    </h3>
                    <p className="text-xs text-pb-foreground/60">Utilisez ces réglages pour organiser le composant (positionnement, espacements et dimensions).</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] text-pb-foreground/70 mb-1">Type d'affichage</label>
                        <select value={selectedBlock.props?.style?.display || 'block'} onChange={(e) => updateStyle('display', e.target.value)} className="w-full bg-pb-background border border-pb-border rounded-lg px-2 py-2 text-xs">
                          <option value="block">Standard</option>
                          <option value="flex">Ligne/colonne (flex)</option>
                          <option value="grid">Grille</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] text-pb-foreground/70 mb-1">Sens (pour flex)</label>
                        <select value={selectedBlock.props?.style?.flexDirection || 'row'} onChange={(e) => updateStyle('flexDirection', e.target.value)} className="w-full bg-pb-background border border-pb-border rounded-lg px-2 py-2 text-xs">
                          <option value="row">Horizontal</option>
                          <option value="column">Vertical</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] text-pb-foreground/70 mb-1">Alignement horizontal</label>
                        <select
                          value={selectedBlock.props?.style?.justifyContent || ''}
                          onChange={(e) => updateStyle('justifyContent', e.target.value)}
                          className="w-full bg-pb-background border border-pb-border rounded-lg px-2 py-2 text-xs"
                        >
                          <option value="">Automatique</option>
                          <option value="flex-start">Debut</option>
                          <option value="center">Centre</option>
                          <option value="flex-end">Fin</option>
                          <option value="space-between">Espace entre</option>
                          <option value="space-around">Espace autour</option>
                          <option value="space-evenly">Espace uniforme</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] text-pb-foreground/70 mb-1">Alignement vertical</label>
                        <select
                          value={selectedBlock.props?.style?.alignItems || ''}
                          onChange={(e) => updateStyle('alignItems', e.target.value)}
                          className="w-full bg-pb-background border border-pb-border rounded-lg px-2 py-2 text-xs"
                        >
                          <option value="">Automatique</option>
                          <option value="flex-start">Haut</option>
                          <option value="center">Centre</option>
                          <option value="flex-end">Bas</option>
                          <option value="stretch">Etirer</option>
                          <option value="baseline">Ligne de base</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] text-pb-foreground/70 mb-1">Espacement entre éléments</label>
                        <select
                          value={selectedBlock.props?.style?.gap || ''}
                          onChange={(e) => updateStyle('gap', e.target.value)}
                          className="w-full bg-pb-background border border-pb-border rounded-lg px-2 py-2 text-xs"
                        >
                          <option value="">Aucun</option>
                          <option value="4px">Tres petit</option>
                          <option value="8px">Petit</option>
                          <option value="12px">Moyen</option>
                          <option value="16px">Confort</option>
                          <option value="24px">Large</option>
                          <option value="32px">Tres large</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] text-pb-foreground/70 mb-1">Colonnes (si grille)</label>
                        <select
                          value={selectedBlock.props?.style?.gridTemplateColumns || ''}
                          onChange={(e) => updateStyle('gridTemplateColumns', e.target.value)}
                          className="w-full bg-pb-background border border-pb-border rounded-lg px-2 py-2 text-xs"
                        >
                          <option value="">Auto</option>
                          <option value="repeat(2, minmax(0, 1fr))">2 colonnes</option>
                          <option value="repeat(3, minmax(0, 1fr))">3 colonnes</option>
                          <option value="repeat(4, minmax(0, 1fr))">4 colonnes</option>
                          <option value="repeat(auto-fit, minmax(220px, 1fr))">Auto responsive</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] text-pb-foreground/70 mb-1">Marge interne (padding)</label>
                        <select
                          value={selectedBlock.props?.style?.padding || ''}
                          onChange={(e) => updateStyle('padding', e.target.value)}
                          className="w-full bg-pb-background border border-pb-border rounded-lg px-2 py-2 text-xs"
                        >
                          <option value="">Aucun</option>
                          <option value="8px">Petit</option>
                          <option value="16px">Moyen</option>
                          <option value="24px">Large</option>
                          <option value="32px">Tres large</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] text-pb-foreground/70 mb-1">Marge externe (margin)</label>
                        <select
                          value={selectedBlock.props?.style?.margin || ''}
                          onChange={(e) => updateStyle('margin', e.target.value)}
                          className="w-full bg-pb-background border border-pb-border rounded-lg px-2 py-2 text-xs"
                        >
                          <option value="">Aucune</option>
                          <option value="8px 0">Petit espacement vertical</option>
                          <option value="16px 0">Espacement vertical</option>
                          <option value="24px 0">Grand espacement vertical</option>
                          <option value="0 auto">Centrer horizontalement</option>
                          <option value="24px auto">Centrer + espacement</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] text-pb-foreground/70 mb-1">Largeur</label>
                        <select
                          value={selectedBlock.props?.style?.width || ''}
                          onChange={(e) => updateStyle('width', e.target.value)}
                          className="w-full bg-pb-background border border-pb-border rounded-lg px-2 py-2 text-xs"
                        >
                          <option value="">Automatique</option>
                          <option value="100%">100% (plein largeur)</option>
                          <option value="90%">90%</option>
                          <option value="80%">80%</option>
                          <option value="70%">70%</option>
                          <option value="60%">60%</option>
                          <option value="max-content">Taille du contenu</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] text-pb-foreground/70 mb-1">Hauteur</label>
                        <select
                          value={selectedBlock.props?.style?.height || ''}
                          onChange={(e) => updateStyle('height', e.target.value)}
                          className="w-full bg-pb-background border border-pb-border rounded-lg px-2 py-2 text-xs"
                        >
                          <option value="">Automatique</option>
                          <option value="200px">Petite</option>
                          <option value="320px">Moyenne</option>
                          <option value="480px">Grande</option>
                          <option value="100vh">Hauteur ecran</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-pb-border bg-pb-background/70 p-4 space-y-4 shadow-sm">
                    <h3 className="text-sm font-semibold text-pb-foreground flex items-center gap-2">
                      Typographie & couleurs
                      <InfoTip text="Couleurs, texte, bordure, ombre et arrondis du composant selectionne." />
                    </h3>
                    
                    <div className="space-y-3">
                      <ColorPicker
                        label="Couleur du texte"
                        value={selectedBlock.props?.style?.color || '#111827'}
                        onChange={(val) => updateStyle('color', val)}
                      />
                      <ColorPicker
                        label="Couleur de fond"
                        value={selectedBlock.props?.style?.backgroundColor || ''}
                        onChange={(val) => updateStyle('backgroundColor', val)}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 items-center">
                      <label className="text-xs text-pb-foreground/70">Taille</label>
                      <input type="text" value={selectedBlock.props?.style?.fontSize || ''} onChange={(e) => updateStyle('fontSize', e.target.value)} placeholder="18px" className="bg-pb-background border border-pb-border rounded-lg px-2 py-1 text-xs" />
                      <label className="text-xs text-pb-foreground/70">Graisse</label>
                      <select value={selectedBlock.props?.style?.fontWeight || '400'} onChange={(e) => updateStyle('fontWeight', e.target.value)} className="bg-pb-background border border-pb-border rounded-lg px-2 py-1 text-xs">
                        <option value="300">Light</option>
                        <option value="400">Normal</option>
                        <option value="500">Medium</option>
                        <option value="700">Bold</option>
                        <option value="900">Black</option>
                      </select>
                      <label className="text-xs text-pb-foreground/70">Alignement</label>
                      <select value={selectedBlock.props?.style?.textAlign || 'left'} onChange={(e) => updateStyle('textAlign', e.target.value)} className="bg-pb-background border border-pb-border rounded-lg px-2 py-1 text-xs">
                        <option value="left">Gauche</option>
                        <option value="center">Centre</option>
                        <option value="right">Droite</option>
                      </select>
                      <label className="text-xs text-pb-foreground/70">Interligne</label>
                      <input type="text" value={selectedBlock.props?.style?.lineHeight || ''} onChange={(e) => updateStyle('lineHeight', e.target.value)} placeholder="1.5" className="bg-pb-background border border-pb-border rounded-lg px-2 py-1 text-xs" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] text-pb-foreground/70 mb-1">Bordure - epaisseur</label>
                        <select
                          value={borderValues.width}
                          onChange={(e) => updateBorderStyle({ borderWidth: e.target.value })}
                          className="w-full bg-pb-background border border-pb-border rounded-lg px-2 py-1 text-xs"
                        >
                          <option value="0px">Aucune</option>
                          <option value="1px">1 px</option>
                          <option value="2px">2 px</option>
                          <option value="3px">3 px</option>
                          <option value="4px">4 px</option>
                          <option value="6px">6 px</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] text-pb-foreground/70 mb-1">Bordure - style</label>
                        <select
                          value={borderValues.lineStyle}
                          onChange={(e) => updateBorderStyle({ borderStyle: e.target.value })}
                          className="w-full bg-pb-background border border-pb-border rounded-lg px-2 py-1 text-xs"
                        >
                          <option value="solid">Continue</option>
                          <option value="dashed">Tirets</option>
                          <option value="dotted">Points</option>
                          <option value="double">Double</option>
                          <option value="none">Aucune</option>
                        </select>
                      </div>
                      <div className="col-span-2">
                        <ColorPicker
                          label="Bordure - couleur"
                          value={borderValues.color}
                          onChange={(val) => updateBorderStyle({ borderColor: val })}
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[11px] text-pb-foreground/70 mb-1">Coins arrondis (px)</label>
                        <select
                          value={selectedBlock.props?.style?.borderRadius || '0px'}
                          onChange={(e) => updateStyle('borderRadius', e.target.value)}
                          className="w-full bg-pb-background border border-pb-border rounded-lg px-2 py-1 text-xs"
                        >
                          <option value="0px">0 px</option>
                          <option value="4px">4 px</option>
                          <option value="8px">8 px</option>
                          <option value="12px">12 px</option>
                          <option value="16px">16 px</option>
                          <option value="20px">20 px</option>
                          <option value="24px">24 px</option>
                          <option value="32px">32 px</option>
                          <option value="9999px">Full</option>
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[11px] text-pb-foreground/70 mb-1">Ombre</label>
                        <select
                          value={selectedBlock.props?.style?.boxShadow || 'none'}
                          onChange={(e) => updateStyle('boxShadow', e.target.value)}
                          className="w-full bg-pb-background border border-pb-border rounded-lg px-2 py-1 text-xs"
                        >
                          <option value="none">Aucune</option>
                          <option value="0 1px 2px rgba(15, 23, 42, 0.08)">Legere</option>
                          <option value="0 4px 10px rgba(15, 23, 42, 0.12)">Douce</option>
                          <option value="0 10px 24px rgba(15, 23, 42, 0.16)">Moyenne</option>
                          <option value="0 16px 36px rgba(15, 23, 42, 0.22)">Forte</option>
                          <option value="inset 0 2px 8px rgba(15, 23, 42, 0.12)">Interieure</option>
                        </select>
                      </div>
                    </div>
                  </div>

                    <div className="rounded-xl border border-sky-400/40 bg-sky-500/10 p-4">
                      <label className="block text-xs font-bold text-sky-900 dark:text-sky-200 mb-1">Classe CSS du bloc (avance)</label>
                      <p className="text-[11px] text-sky-900/80 dark:text-sky-200/90 mb-2">S'applique uniquement a ce composant et passe avant les reglages visuels.</p>
                      <input type="text" value={selectedBlock.props?.className || ''} onChange={(e) => updateBlock(selectedBlock.id, { props: { ...selectedBlock.props, className: e.target.value } })} className="w-full bg-pb-background border border-sky-300/60 rounded-lg px-3 py-2 text-sm font-mono" placeholder="p-6 rounded-xl shadow-md" />
                    </div>
                  </div>
                </details>
              </div>
            )}
          </aside>

          {/* Calque de drag pour feedback visuel */}
          <DragOverlay dropAnimation={null}>
            {activeId ? (
              <div className="w-48 bg-pb-accent text-white font-bold px-4 py-2 rounded text-center shadow-2xl z-[9999] pointer-events-none">
                {activeId.startsWith('palette-') ? `Ajouter ${getBlockDisplayName(activeId.replace('palette-', ''))}` : 'Déplacement...'}
              </div>
            ) : null}
          </DragOverlay>
        </main>
      </DndContext>
    </div>
  );
}