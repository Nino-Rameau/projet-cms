'use client';
// P7 — Image de remplacement locale (évite la dépendance à placehold.co)
const PLACEHOLDER_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'%3E%3Crect fill='%23e2e8f0' width='600' height='400'/%3E%3Ctext fill='%2394a3b8' font-family='sans-serif' font-size='24' x='300' y='210' dominant-baseline='middle' text-anchor='middle'%3EImage%3C/text%3E%3C/svg%3E";

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { useEditorStore } from '@/store/useEditorStore';
import SocialIconSvg from './SocialIconSvg';
import {
  renderRichText, sanitizeRichText, getListItems, getButtonHref,
  getSectionChildrenLayoutStyle, getSocialIconComponent, getSocialLabelForIcon,
  getBlockDisplayName,
} from './editorUtils.jsx';

// --- Palette item (colonne gauche) ---

export function PaletteItem({ type, icon: Icon, label }) {
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

// --- Tooltip d'info ---

import { useRef, useState } from 'react';
import { Info } from 'lucide-react';

export function InfoTip({ text }) {
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

  return (
    <span className="inline-flex items-center">
      <button
        ref={triggerRef}
        type="button"
        onMouseEnter={showTooltip}
        onMouseLeave={() => setIsOpen(false)}
        onFocus={showTooltip}
        onBlur={() => setIsOpen(false)}
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

// --- Aperçu imbriqué (enfants de Section/Container/Card) ---

function NestedBlockPreview({ block, siteSlug }) {
  const { selectBlock, selectedBlockId } = useEditorStore();
  const canReceiveChildren = ['Section', 'Container', 'Card'].includes(block.type);
  const previewDropId = canReceiveChildren ? `section-${block.id}` : `preview-${block.id}`;
  const { setNodeRef: setPreviewSectionDropRef, isOver: isPreviewSectionOver } = useDroppable({
    id: previewDropId,
    data: { isSectionDrop: canReceiveChildren, sectionId: canReceiveChildren ? block.id : null },
  });
  const isSelected = selectedBlockId === block.id;

  return (
    <div
      onClick={(e) => { e.stopPropagation(); selectBlock(block.id); }}
      className={`p-3 rounded border ${isSelected ? 'border-pb-accent' : 'border-slate-300'} bg-white ${block.props?.className || ''}`}
      style={block.props?.style || {}}
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
        <a href={getButtonHref(block.props, siteSlug)} onClick={(e) => e.preventDefault()} className="inline-flex px-4 py-2 bg-blue-600 text-white rounded-md">
          {block.props?.content || 'Bouton'}
        </a>
      )}
      {block.type === 'Image' && <img src={block.props?.src || '{PLACEHOLDER_IMAGE}'} alt={block.props?.alt || 'Image'} className="max-w-full h-auto" />}
      {canReceiveChildren && (
        <div
          ref={setPreviewSectionDropRef}
          className={`p-3 border border-dashed rounded-md ${isPreviewSectionOver ? 'border-pb-accent bg-blue-50/10' : 'border-blue-300/50 hover:border-blue-300'}`}
        >
          <div className="text-blue-600 font-semibold mb-2 uppercase text-xs">{block.type}</div>
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
          {(Array.isArray(block.props?.items) ? block.props.items : []).map((item, i) => (
            <a key={`social-preview-${i}`} href={item?.href || '#'} onClick={(e) => e.preventDefault()} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700" aria-label={getSocialLabelForIcon(item?.icon)}>
              <SocialIconSvg name={getSocialIconComponent(item?.icon)} size={16} />
            </a>
          ))}
        </div>
      )}
      {block.type === 'Accordion' && (
        <div className="space-y-2">
          {(Array.isArray(block.props?.items) ? block.props.items : []).map((item, i) => (
            <details key={`accordion-preview-${i}`} className="group rounded-lg border border-slate-200 bg-white" onClick={(e) => e.preventDefault()}>
              <summary className="flex cursor-pointer items-center justify-between p-4 font-medium text-slate-900">{item.title}</summary>
            </details>
          ))}
        </div>
      )}
      {block.type === 'LI' && <li>{block.props?.content || 'Element de liste'}</li>}
    </div>
  );
}

// --- Bloc sortable sur le canvas ---

export function SortableBlock({ block, siteSlug }) {
  const { selectBlock, selectedBlockId } = useEditorStore();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
    data: { block, isCanvasItem: true },
  });
  const canReceiveChildren = ['Section', 'Container', 'Card'].includes(block.type);
  const sectionDropId = canReceiveChildren ? `section-${block.id}` : `block-drop-${block.id}`;
  const { setNodeRef: setSectionDropRef, isOver: isSectionOver } = useDroppable({
    id: sectionDropId,
    data: { isSectionDrop: canReceiveChildren, sectionId: canReceiveChildren ? block.id : null },
  });
  const isSelected = selectedBlockId === block.id;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    ...(block.props?.style || {}),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(e) => { e.stopPropagation(); selectBlock(block.id); }}
      className={`relative p-4 rounded-md mb-2 cursor-grab active:cursor-grabbing transition-all duration-200 bg-transparent ${
        isDragging ? 'bg-blue-50/50 scale-105 shadow-2xl z-50 outline outline-4 outline-blue-200 border-blue-400' : ''
      } ${
        isSelected && !isDragging ? 'outline outline-2 outline-pb-accent outline-offset-2 shadow-md' : (!isDragging ? 'outline outline-1 outline-dashed outline-gray-300 outline-offset-2 hover:outline-gray-400' : '')
      }`}
    >
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
      {block.type === 'Spacer' && <div className={block.props?.className || ''} style={{ height: block.props?.style?.height || '32px' }} />}
      {block.type === 'UL' && (
        <ul className={`list-disc pl-5 text-black h-full w-full [&_a]:underline [&_a]:underline-offset-2 ${block.props?.className || ''}`}>
          {getListItems(block).map((item, i) => (
            <li key={`editor-ul-${block.id}-${i}`} dangerouslySetInnerHTML={{ __html: sanitizeRichText(item) }} />
          ))}
        </ul>
      )}
      {block.type === 'LI' && <li className={`text-black h-full w-full ${block.props?.className || ''}`}>{block.props?.content || 'Élément de liste...'}</li>}
      {block.type === 'Image' && <img src={block.props?.src || '{PLACEHOLDER_IMAGE}'} alt={block.props?.alt || 'Image'} className={`max-w-full h-auto ${block.props?.className || ''}`} />}
      {canReceiveChildren && (
        <div
          ref={setSectionDropRef}
          className={`p-4 border border-dashed rounded-md transition ${isSectionOver ? 'border-pb-accent bg-blue-50/10' : 'border-blue-300/50 hover:border-blue-300/80'} ${block.props?.className || ''}`}
          onClick={(e) => { e.stopPropagation(); selectBlock(block.id); }}
        >
          <div className="text-blue-600 font-semibold mb-2 uppercase text-xs tracking-wide">{block.type}</div>
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
        <a href={getButtonHref(block.props, siteSlug)} onClick={(e) => e.preventDefault()} className={`inline-flex px-4 py-2 bg-blue-600 text-white font-bold rounded-md ${block.props?.className || ''}`} target={block.props?.openInNewTab ? '_blank' : '_self'} rel={block.props?.openInNewTab ? 'noreferrer' : undefined}>
          {block.props?.content || 'Bouton'}
        </a>
      )}
      {block.type === 'Table' && (
        <div className="overflow-x-auto border rounded-md border-slate-300">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-slate-100">
              <tr>{(block.props?.headers || []).map((h, i) => <th key={`h-${i}`} className="border border-slate-300 p-2 text-left font-semibold">{h}</th>)}</tr>
            </thead>
            <tbody>
              {(block.props?.rows || []).map((row, rIndex) => (
                <tr key={`r-${rIndex}`}>{row.map((cell, cIndex) => <td key={`c-${rIndex}-${cIndex}`} className="border border-slate-300 p-2">{cell}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {block.type === 'SocialLinks' && (
        <div className={`flex flex-wrap gap-2 ${block.props?.className || ''}`}>
          {(Array.isArray(block.props?.items) ? block.props.items : []).map((item, i) => (
            <a key={`social-editor-${block.id}-${i}`} href={item?.href || '#'} onClick={(e) => e.preventDefault()} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700" aria-label={getSocialLabelForIcon(item?.icon)}>
              <SocialIconSvg name={getSocialIconComponent(item?.icon)} size={16} />
            </a>
          ))}
        </div>
      )}
      {block.type === 'Accordion' && (
        <div className={`space-y-2 ${block.props?.className || ''}`}>
          {(Array.isArray(block.props?.items) ? block.props.items : []).map((item, i) => (
            <details key={`accordion-${block.id}-${i}`} className="group rounded-lg border border-slate-200 bg-white" onClick={(e) => e.preventDefault()}>
              <summary className="flex cursor-pointer items-center justify-between p-4 font-medium text-slate-900 group-open:border-b group-open:border-slate-200 group-open:bg-slate-50">
                {item.title}
                <span className="transition duration-300 group-open:-rotate-180">
                  <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6" /></svg>
                </span>
              </summary>
              <div className="p-4 text-slate-700 leading-relaxed">{item.content}</div>
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
