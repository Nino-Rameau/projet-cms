'use client';
import { useEffect, useRef, useState } from 'react';
import { Box } from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';
import ColorPicker from './ColorPicker';
import SocialIconSvg from './SocialIconSvg';
import { InfoTip } from './BlockPreview';
import {
  getBorderPresetValues, getBlockDisplayName, getListItems,
  sanitizeRichText, normalizeSiteRelativePath, normalizeSocialIconName,
  getSocialLabelForIcon, createDefaultSocialItem,
} from './editorUtils.jsx';
import { SOCIAL_ICON_OPTIONS, PAGE_SETTINGS_DEFAULTS } from './editorConstants';
const randomUUID = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
  const r = Math.random() * 16 | 0;
  return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
});

export default function BlockInspector({
  selectedBlock,
  copiedBlock,
  pageSettings,
  updatePageSetting,
  copySelectedBlock,
  duplicateSelectedBlock,
  pasteCopiedBlock,
  sitePages = [],
}) {
  const { updateBlock, deleteBlock, selectBlock, getBlockById, reorderBlocks } = useEditorStore();

  // --- Link picker (texte riche / liste) ---
  const [linkPicker, setLinkPicker] = useState(null); // null | 'content' | 'list'
  const [linkType, setLinkType] = useState('external'); // 'external' | 'internal'
  const [linkValue, setLinkValue] = useState('');
  const savedRangeRef = useRef(null);

  const richEditorRef = useRef(null);
  const listEditorRef = useRef(null);

  const isRichTextBlock = ['Text', 'Paragraph', 'H1', 'H2', 'H3', 'H4', 'Quote'].includes(selectedBlock?.type || '');
  const isListBlock = selectedBlock?.type === 'UL';
  const isHeadingBlock = ['H1', 'H2', 'H3', 'H4'].includes(selectedBlock?.type || '');

  const editorMinHeightClass = selectedBlock?.type === 'Paragraph'
    ? 'min-h-[176px]'
    : (isHeadingBlock ? 'min-h-[52px]' : 'min-h-[132px]');
  const editorMaxHeightClass = selectedBlock?.type === 'Paragraph' ? 'max-h-[520px]' : 'max-h-[320px]';
  const borderValues = getBorderPresetValues(selectedBlock?.props?.style || {});

  // Sync rich text editor content
  useEffect(() => {
    if (!selectedBlock || !isRichTextBlock || !richEditorRef.current) return;
    const html = selectedBlock.props?.content || '';
    if (richEditorRef.current.innerHTML !== html) richEditorRef.current.innerHTML = html;
  }, [selectedBlock?.id, selectedBlock?.props?.content, isRichTextBlock]);

  // Sync list editor content
  useEffect(() => {
    if (!selectedBlock || !isListBlock || !listEditorRef.current) return;
    const items = getListItems(selectedBlock);
    const listHtml = `<ul>${items.map((item) => `<li>${sanitizeRichText(item)}</li>`).join('')}</ul>`;
    if (listEditorRef.current.innerHTML !== listHtml) listEditorRef.current.innerHTML = listHtml;
  }, [selectedBlock?.id, selectedBlock?.props?.items, selectedBlock?.children, selectedBlock?.props?.content, isListBlock]);

  // --- Helpers de style ---

  const updateStyle = (key, value) => {
    if (!selectedBlock) return;
    updateBlock(selectedBlock.id, {
      props: { ...selectedBlock.props, style: { ...selectedBlock.props?.style, [key]: value } },
    });
  };

  const updateBorderStyle = (partialStyle) => {
    if (!selectedBlock) return;
    const current = getBorderPresetValues(selectedBlock.props?.style || {});
    updateBlock(selectedBlock.id, {
      props: {
        ...selectedBlock.props,
        style: {
          ...selectedBlock.props?.style,
          border: undefined,
          borderWidth: partialStyle.borderWidth !== undefined ? partialStyle.borderWidth : current.width,
          borderStyle: partialStyle.borderStyle !== undefined ? partialStyle.borderStyle : current.lineStyle,
          borderColor: partialStyle.borderColor !== undefined ? partialStyle.borderColor : current.color,
        },
      },
    });
  };

  // --- Sections ---

  const ensureSectionColumns = (columnCount) => {
    if (!selectedBlock || selectedBlock.type !== 'Section') return;
    const baseChildren = Array.isArray(selectedBlock.children) ? [...selectedBlock.children] : [];
    const existingContainers = baseChildren.filter((c) => c.type === 'Container' || c.type === 'Section').map((c) => ({ ...c, type: 'Container' }));
    const orphanBlocks = baseChildren.filter((c) => c.type !== 'Container' && c.type !== 'Section');
    const columns = existingContainers.length ? existingContainers : [];

    if (!columns.length && orphanBlocks.length) {
      columns.push({ id: `block-${randomUUID()}`, type: 'Container', props: { style: { minHeight: '120px', padding: '16px', borderRadius: '10px', backgroundColor: '#f8fafc' } }, children: orphanBlocks });
    }

    const missing = Math.max(0, columnCount - columns.length);
    for (let i = 0; i < missing; i += 1) {
      columns.push({ id: `block-${randomUUID()}`, type: 'Container', props: { style: { minHeight: '120px', padding: '16px', borderRadius: '10px', backgroundColor: '#f8fafc' } }, children: [] });
    }

    const minColumnWidth = columnCount >= 3 ? 220 : 280;
    updateBlock(selectedBlock.id, {
      props: { ...selectedBlock.props, style: { ...selectedBlock.props?.style, display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${minColumnWidth}px, 1fr))`, gap: selectedBlock.props?.style?.gap || '24px' } },
      children: columns.slice(0, columnCount),
    });
  };

  // --- Tableau ---

  const resizeTable = (columnCount, rowCount) => {
    if (!selectedBlock || selectedBlock.type !== 'Table') return;
    const safeColumns = Math.max(1, columnCount);
    const safeRows = Math.max(1, rowCount);
    const currentHeaders = selectedBlock.props?.headers || [];
    const currentRows = selectedBlock.props?.rows || [];
    updateBlock(selectedBlock.id, {
      props: {
        ...selectedBlock.props,
        headers: Array.from({ length: safeColumns }, (_, i) => currentHeaders[i] || `Colonne ${i + 1}`),
        rows: Array.from({ length: safeRows }, (_, r) => Array.from({ length: safeColumns }, (_, c) => (currentRows[r] || [])[c] || '')),
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

  // --- Texte riche ---

  const applyContentTag = (tagName) => {
    if (!selectedBlock || !richEditorRef.current) return;
    if (tagName === 'strong') {
      richEditorRef.current.focus();
      document.execCommand('bold');
      updateBlock(selectedBlock.id, { props: { ...selectedBlock.props, content: richEditorRef.current.innerHTML } });
    } else if (tagName === 'em') {
      richEditorRef.current.focus();
      document.execCommand('italic');
      updateBlock(selectedBlock.id, { props: { ...selectedBlock.props, content: richEditorRef.current.innerHTML } });
    } else if (tagName === 'a') {
      const sel = window.getSelection();
      savedRangeRef.current = sel?.rangeCount > 0 ? sel.getRangeAt(0).cloneRange() : null;
      setLinkType('external');
      setLinkValue('');
      setLinkPicker('content');
    }
  };

  const applyLinkFromPicker = () => {
    const href = linkType === 'internal' ? `/${linkValue}` : linkValue;
    if (!href) { setLinkPicker(null); return; }
    const target = linkPicker === 'content' ? richEditorRef.current : listEditorRef.current;
    if (!target) { setLinkPicker(null); return; }
    target.focus();
    if (savedRangeRef.current) {
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(savedRangeRef.current);
    }
    document.execCommand('createLink', false, href);
    if (linkPicker === 'content') {
      updateBlock(selectedBlock.id, { props: { ...selectedBlock.props, content: target.innerHTML } });
    } else {
      syncListItemsFromEditor();
    }
    setLinkPicker(null);
  };

  const syncListItemsFromEditor = () => {
    if (!selectedBlock || selectedBlock.type !== 'UL' || !listEditorRef.current) return;
    const items = Array.from(listEditorRef.current.querySelectorAll('li')).map((li) => sanitizeRichText(li.innerHTML || '')).filter((item) => item.trim().length > 0);
    updateBlock(selectedBlock.id, { props: { ...selectedBlock.props, items } });
  };

  const applyListTag = (tagName) => {
    if (!selectedBlock || selectedBlock.type !== 'UL' || !listEditorRef.current) return;
    if (tagName === 'strong') {
      listEditorRef.current.focus();
      document.execCommand('bold');
      syncListItemsFromEditor();
    } else if (tagName === 'em') {
      listEditorRef.current.focus();
      document.execCommand('italic');
      syncListItemsFromEditor();
    } else if (tagName === 'a') {
      const sel = window.getSelection();
      savedRangeRef.current = sel?.rangeCount > 0 ? sel.getRangeAt(0).cloneRange() : null;
      setLinkType('external');
      setLinkValue('');
      setLinkPicker('list');
    }
  };

  const addListItem = () => {
    if (!selectedBlock || selectedBlock.type !== 'UL') return;
    updateBlock(selectedBlock.id, { props: { ...selectedBlock.props, items: [...getListItems(selectedBlock), 'Nouvel element'] } });
  };

  // --- Réseaux sociaux ---

  const resizeSocialItems = (count) => {
    if (!selectedBlock || selectedBlock.type !== 'SocialLinks') return;
    const safeCount = Math.max(1, Math.min(12, Number(count) || 1));
    const currentItems = Array.isArray(selectedBlock.props?.items) ? selectedBlock.props.items : [];
    updateBlock(selectedBlock.id, { props: { ...selectedBlock.props, items: Array.from({ length: safeCount }, (_, i) => currentItems[i] || createDefaultSocialItem(i)) } });
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

  // --- Accordéon ---

  const resizeAccordionItems = (count) => {
    if (!selectedBlock || selectedBlock.type !== 'Accordion') return;
    const safeCount = Math.max(1, Math.min(20, Number(count) || 1));
    const currentItems = Array.isArray(selectedBlock.props?.items) ? selectedBlock.props.items : [];
    updateBlock(selectedBlock.id, { props: { ...selectedBlock.props, items: Array.from({ length: safeCount }, (_, i) => currentItems[i] || { title: `Nouvelle question ${i + 1}`, content: 'Réponse...' }) } });
  };

  const updateAccordionItem = (index, field, value) => {
    if (!selectedBlock || selectedBlock.type !== 'Accordion') return;
    const currentItems = Array.isArray(selectedBlock.props?.items) ? [...selectedBlock.props.items] : [];
    currentItems[index] = { ...(currentItems[index] || { title: `Question ${index + 1}`, content: 'Réponse' }), [field]: value };
    updateBlock(selectedBlock.id, { props: { ...selectedBlock.props, items: currentItems } });
  };

  // --- Render ---

  return (
    <aside className="w-80 flex-shrink-0 border-l border-pb-border bg-pb-background/95 overflow-y-auto relative z-50">
      {/* Paramètres de la page */}
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
              <input type="text" value={pageSettings.metaTitle || ''} onChange={(e) => updatePageSetting('metaTitle', e.target.value)} placeholder="Titre affiché dans Google" className="w-full bg-pb-background border border-pb-border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-pb-foreground/70 mb-1">Meta description</label>
              <textarea rows="3" value={pageSettings.metaDescription || ''} onChange={(e) => updatePageSetting('metaDescription', e.target.value)} placeholder="Résumé court de la page" className="w-full min-h-[96px] resize-y bg-pb-background border border-pb-border rounded-lg px-3 py-2 text-sm leading-relaxed" />
            </div>
            <div>
              <label className="block text-xs font-medium text-pb-foreground/70 mb-1">Largeur du contenu</label>
              <select value={pageSettings.contentWidth || '100%'} onChange={(e) => updatePageSetting('contentWidth', e.target.value)} className="w-full bg-pb-background border border-pb-border rounded-lg px-3 py-2 text-sm">
                <option value="100%">100% (plein écran)</option>
                <option value="90%">90%</option>
                <option value="80%">80%</option>
                <option value="70%">70%</option>
                <option value="60%">60%</option>
              </select>
            </div>
            <ColorPicker label="Couleur de fond" value={pageSettings.backgroundColor} onChange={(val) => updatePageSetting('backgroundColor', val)} />
            <div>
              <label className="block text-xs font-medium text-pb-foreground/70 mb-1">Image / Dégradé de fond</label>
              <input type="text" value={pageSettings.backgroundImage || ''} onChange={(e) => updatePageSetting('backgroundImage', e.target.value)} placeholder="url('...') ou linear-gradient(...)" className="w-full bg-pb-background border border-pb-border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-pb-foreground/70 mb-1">Classe CSS de la page</label>
              <input type="text" value={pageSettings.customClassName || ''} onChange={(e) => updatePageSetting('customClassName', e.target.value)} placeholder="ex: pb-page-landing max-w-screen-xl" className="w-full bg-pb-background border border-pb-border rounded-lg px-3 py-2 text-sm" />
            </div>
            <label className="inline-flex items-center gap-2 text-xs text-pb-foreground/70 pt-2">
              <input type="checkbox" checked={Boolean(pageSettings.noIndex)} onChange={(e) => updatePageSetting('noIndex', e.target.checked)} className="rounded border-pb-border text-pb-accent focus:ring-pb-accent" />
              Ne pas indexer cette page (noindex)
            </label>
          </div>
        </details>
      </div>

      {/* Inspecteur de bloc */}
      {!selectedBlock ? (
        <div className="h-full flex flex-col items-center justify-start text-pb-foreground/50 p-6 text-center text-sm">
          <span className="w-12 h-12 bg-pb-border/20 rounded-full flex items-center justify-center mb-3"><Box size={24} /></span>
          Sélectionnez un bloc sur le canvas pour modifier ses propriétés.
        </div>
      ) : (
        <div className="p-4">
          <h2 className="text-sm font-bold border-b border-pb-border pb-2 mb-4 flex justify-between">
            Reglages du bloc <span className="text-pb-foreground/60 font-mono">{getBlockDisplayName(selectedBlock.type)}</span>
          </h2>

          <button onClick={() => deleteBlock(selectedBlock.id)} className="w-full mb-4 bg-red-500/10 border border-red-400/30 text-red-500 font-bold py-2 rounded text-sm hover:bg-red-500/20 transition">
            Supprimer ce composant
          </button>

          <div className="grid grid-cols-3 gap-2 mb-4">
            <button type="button" onClick={copySelectedBlock} className="px-2 py-2 rounded border border-pb-border text-xs font-semibold hover:bg-pb-border/20 transition">Copier</button>
            <button type="button" onClick={pasteCopiedBlock} disabled={!copiedBlock} className="px-2 py-2 rounded border border-pb-border text-xs font-semibold hover:bg-pb-border/20 transition disabled:opacity-50 disabled:cursor-not-allowed">Coller</button>
            <button type="button" onClick={duplicateSelectedBlock} className="px-2 py-2 rounded border border-pb-border text-xs font-semibold hover:bg-pb-border/20 transition">Dupliquer</button>
          </div>

          <details className="group rounded-xl border border-pb-border bg-pb-background/70 shadow-sm overflow-hidden" open>
            <summary className="text-sm font-semibold text-pb-foreground flex items-center gap-2 p-4 cursor-pointer outline-none group-open:border-b group-open:border-pb-border hover:bg-pb-border/10 transition-colors">
              Paramètres du composant
              <InfoTip text="Modifiez le contenu, la typographie, les couleurs et les styles de votre composant." />
              <svg className="ml-auto w-4 h-4 text-pb-foreground/50 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            </summary>

            <div className="p-4 space-y-4 bg-pb-background">
              {/* Contenu textuel */}
              <div className="rounded-xl border border-pb-border bg-pb-background/70 p-4 space-y-3 shadow-sm">
                <h3 className="text-sm font-semibold text-pb-foreground flex items-center gap-2">
                  Contenu
                  <InfoTip text="Modifiez le texte principal du composant." />
                </h3>

                {['Text', 'Paragraph', 'H1', 'H2', 'H3', 'H4', 'Quote', 'Button', 'LI'].includes(selectedBlock.type) && (
                  <div>
                    <label className="block text-xs font-medium text-pb-foreground/70 mb-1">Texte</label>
                    {['Text', 'Paragraph', 'H1', 'H2', 'H3', 'H4', 'Quote'].includes(selectedBlock.type) && (
                      <div className="mb-2 space-y-2">
                        <div className="flex flex-wrap gap-2">
                          <button type="button" onClick={() => applyContentTag('strong')} className="px-2 py-1 rounded border border-pb-border text-xs">Gras</button>
                          <button type="button" onClick={() => applyContentTag('em')} className="px-2 py-1 rounded border border-pb-border text-xs">Italique</button>
                          <button type="button" onClick={() => applyContentTag('a')} className="px-2 py-1 rounded border border-pb-border text-xs">Lien</button>
                        </div>
                        {linkPicker === 'content' && (
                          <div className="rounded-lg border border-pb-accent/40 bg-pb-background p-3 space-y-2">
                            <div className="flex gap-2">
                              <button type="button" onClick={() => { setLinkType('external'); setLinkValue(''); }} className={`flex-1 px-2 py-1 rounded border text-xs font-semibold transition ${linkType === 'external' ? 'bg-pb-accent text-white border-pb-accent' : 'border-pb-border'}`}>Externe</button>
                              <button type="button" onClick={() => { setLinkType('internal'); setLinkValue(''); }} className={`flex-1 px-2 py-1 rounded border text-xs font-semibold transition ${linkType === 'internal' ? 'bg-pb-accent text-white border-pb-accent' : 'border-pb-border'}`}>Page du site</button>
                            </div>
                            {linkType === 'external' ? (
                              <input autoFocus type="url" value={linkValue} onChange={(e) => setLinkValue(e.target.value)} placeholder="https://exemple.com" className="w-full bg-pb-background border border-pb-border rounded px-2 py-1 text-xs" onKeyDown={(e) => { if (e.key === 'Enter') applyLinkFromPicker(); if (e.key === 'Escape') setLinkPicker(null); }} />
                            ) : (
                              <select value={linkValue} onChange={(e) => setLinkValue(e.target.value)} className="w-full bg-pb-background border border-pb-border rounded px-2 py-1 text-xs">
                                <option value="">— Choisir une page —</option>
                                {sitePages.map((p) => <option key={p.slug} value={p.slug}>{p.title} ({p.slug})</option>)}
                              </select>
                            )}
                            <div className="flex gap-2">
                              <button type="button" onClick={applyLinkFromPicker} className="flex-1 px-2 py-1 rounded bg-pb-accent text-white text-xs font-semibold">Appliquer</button>
                              <button type="button" onClick={() => setLinkPicker(null)} className="px-2 py-1 rounded border border-pb-border text-xs">Annuler</button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {isRichTextBlock ? (
                      <div
                        ref={richEditorRef}
                        contentEditable
                        suppressContentEditableWarning
                        onInput={(e) => updateBlock(selectedBlock.id, { props: { ...selectedBlock.props, content: e.currentTarget.innerHTML } })}
                        className={`w-full ${editorMinHeightClass} ${editorMaxHeightClass} overflow-y-auto bg-pb-background border border-pb-border rounded-lg px-3 py-2 text-sm leading-relaxed outline-none [&>h1]:text-3xl [&>h1]:font-bold [&>h2]:text-2xl [&>h2]:font-bold [&>h3]:text-xl [&>h3]:font-semibold [&>h4]:text-lg [&>h4]:font-semibold [&>p]:leading-relaxed [&>p]:mb-3 [&_a]:underline [&_a]:underline-offset-2`}
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
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => applyListTag('strong')} className="px-2 py-1 rounded border border-pb-border text-xs">Gras</button>
                        <button type="button" onClick={() => applyListTag('em')} className="px-2 py-1 rounded border border-pb-border text-xs">Italique</button>
                        <button type="button" onClick={() => applyListTag('a')} className="px-2 py-1 rounded border border-pb-border text-xs">Lien</button>
                        <button type="button" onClick={addListItem} className="px-2 py-1 rounded border border-pb-border text-xs">+ Element</button>
                      </div>
                      {linkPicker === 'list' && (
                        <div className="rounded-lg border border-pb-accent/40 bg-pb-background p-3 space-y-2">
                          <div className="flex gap-2">
                            <button type="button" onClick={() => { setLinkType('external'); setLinkValue(''); }} className={`flex-1 px-2 py-1 rounded border text-xs font-semibold transition ${linkType === 'external' ? 'bg-pb-accent text-white border-pb-accent' : 'border-pb-border'}`}>Externe</button>
                            <button type="button" onClick={() => { setLinkType('internal'); setLinkValue(''); }} className={`flex-1 px-2 py-1 rounded border text-xs font-semibold transition ${linkType === 'internal' ? 'bg-pb-accent text-white border-pb-accent' : 'border-pb-border'}`}>Page du site</button>
                          </div>
                          {linkType === 'external' ? (
                            <input autoFocus type="url" value={linkValue} onChange={(e) => setLinkValue(e.target.value)} placeholder="https://exemple.com" className="w-full bg-pb-background border border-pb-border rounded px-2 py-1 text-xs" onKeyDown={(e) => { if (e.key === 'Enter') applyLinkFromPicker(); if (e.key === 'Escape') setLinkPicker(null); }} />
                          ) : (
                            <select value={linkValue} onChange={(e) => setLinkValue(e.target.value)} className="w-full bg-pb-background border border-pb-border rounded px-2 py-1 text-xs">
                              <option value="">— Choisir une page —</option>
                              {sitePages.map((p) => <option key={p.slug} value={p.slug}>{p.title} ({p.slug})</option>)}
                            </select>
                          )}
                          <div className="flex gap-2">
                            <button type="button" onClick={applyLinkFromPicker} className="flex-1 px-2 py-1 rounded bg-pb-accent text-white text-xs font-semibold">Appliquer</button>
                            <button type="button" onClick={() => setLinkPicker(null)} className="px-2 py-1 rounded border border-pb-border text-xs">Annuler</button>
                          </div>
                        </div>
                      )}
                    </div>
                    <div ref={listEditorRef} contentEditable suppressContentEditableWarning onInput={syncListItemsFromEditor} className="w-full min-h-[180px] max-h-[420px] overflow-y-auto bg-pb-background border border-pb-border rounded-lg px-3 py-2 text-sm leading-relaxed outline-none [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2 [&_a]:underline [&_a]:underline-offset-2" />
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
                    <select value={selectedBlock.props?.actionType || 'none'} onChange={(e) => updateBlock(selectedBlock.id, { props: { ...selectedBlock.props, actionType: e.target.value } })} className="w-full bg-pb-background border border-pb-border rounded-lg px-3 py-2 text-sm">
                      <option value="none">Aucune action</option>
                      <option value="link">Lien externe</option>
                      <option value="page">Vers une page du site</option>
                      <option value="file">Telecharger un fichier</option>
                      <option value="email">Envoyer un email</option>
                      <option value="phone">Appeler un numero</option>
                    </select>
                    {selectedBlock.props?.actionType === 'link' && <input type="text" value={selectedBlock.props?.href || ''} onChange={(e) => updateBlock(selectedBlock.id, { props: { ...selectedBlock.props, href: e.target.value } })} placeholder="https://exemple.com" className="w-full bg-pb-background border border-pb-border rounded-lg px-3 py-2 text-sm" />}
                    {selectedBlock.props?.actionType === 'page' && (
                      <div>
                        {sitePages.length > 0 ? (
                          <select
                            value={selectedBlock.props?.pagePath || ''}
                            onChange={(e) => updateBlock(selectedBlock.id, { props: { ...selectedBlock.props, pagePath: e.target.value } })}
                            className="w-full bg-pb-background border border-pb-border rounded-lg px-3 py-2 text-sm"
                          >
                            <option value="">— Choisir une page —</option>
                            {sitePages.map((p) => (
                              <option key={p.slug} value={p.slug}>{p.title} ({p.slug})</option>
                            ))}
                          </select>
                        ) : (
                          <input type="text" value={selectedBlock.props?.pagePath || ''} onChange={(e) => updateBlock(selectedBlock.id, { props: { ...selectedBlock.props, pagePath: normalizeSiteRelativePath(e.target.value) } })} placeholder="contact ou /contact" className="w-full bg-pb-background border border-pb-border rounded-lg px-3 py-2 text-sm" />
                        )}
                      </div>
                    )}
                    {selectedBlock.props?.actionType === 'file' && <input type="text" value={selectedBlock.props?.fileUrl || ''} onChange={(e) => updateBlock(selectedBlock.id, { props: { ...selectedBlock.props, fileUrl: e.target.value } })} placeholder="https://monsite.com/guide.pdf" className="w-full bg-pb-background border border-pb-border rounded-lg px-3 py-2 text-sm" />}
                    {selectedBlock.props?.actionType === 'email' && <input type="text" value={selectedBlock.props?.email || ''} onChange={(e) => updateBlock(selectedBlock.id, { props: { ...selectedBlock.props, email: e.target.value } })} placeholder="contact@monsite.com" className="w-full bg-pb-background border border-pb-border rounded-lg px-3 py-2 text-sm" />}
                    {selectedBlock.props?.actionType === 'phone' && <input type="text" value={selectedBlock.props?.phone || ''} onChange={(e) => updateBlock(selectedBlock.id, { props: { ...selectedBlock.props, phone: e.target.value } })} placeholder="+33 6 12 34 56 78" className="w-full bg-pb-background border border-pb-border rounded-lg px-3 py-2 text-sm" />}
                    <label className="inline-flex items-center gap-2 text-xs text-pb-foreground/70">
                      <input type="checkbox" checked={Boolean(selectedBlock.props?.openInNewTab)} onChange={(e) => updateBlock(selectedBlock.id, { props: { ...selectedBlock.props, openInNewTab: e.target.checked } })} />
                      Ouvrir dans un nouvel onglet
                    </label>
                  </div>
                )}

                {selectedBlock.type === 'SocialLinks' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-pb-foreground/70 mb-1">Nombre d'icones</label>
                      <input type="number" min="1" max="12" value={(selectedBlock.props?.items || []).length || 1} onChange={(e) => resizeSocialItems(e.target.value)} className="w-full bg-pb-background border border-pb-border rounded-lg px-3 py-2 text-sm" />
                    </div>
                    <div className="space-y-3">
                      {(Array.isArray(selectedBlock.props?.items) ? selectedBlock.props.items : []).map((item, index) => (
                        <div key={`social-item-${index}`} className="rounded-lg border border-pb-border p-3 bg-pb-background/50 space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[11px] text-pb-foreground/70 mb-1">Icone</label>
                              <select value={item?.icon || 'website'} onChange={(e) => updateSocialItem(index, { icon: e.target.value })} className="w-full bg-pb-background border border-pb-border rounded-lg px-2 py-2 text-xs">
                                {SOCIAL_ICON_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="block text-[11px] text-pb-foreground/70 mb-1">Libelle</label>
                              <div className="w-full bg-pb-background border border-pb-border rounded-lg px-2 py-2 text-xs text-pb-foreground/80">{getSocialLabelForIcon(item?.icon)}</div>
                            </div>
                          </div>
                          <input type="text" value={item?.href || ''} onChange={(e) => updateSocialItem(index, { href: e.target.value })} placeholder="https://" className="w-full bg-pb-background border border-pb-border rounded-lg px-2 py-2 text-xs" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedBlock.type === 'Accordion' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-pb-foreground/70 mb-1">Nombre de questions</label>
                      <input type="number" min="1" max="20" value={(selectedBlock.props?.items || []).length || 1} onChange={(e) => resizeAccordionItems(e.target.value)} className="w-full bg-pb-background border border-pb-border rounded-lg px-3 py-2 text-sm" />
                    </div>
                    <div className="space-y-3">
                      {(Array.isArray(selectedBlock.props?.items) ? selectedBlock.props.items : []).map((item, index) => (
                        <div key={`accordion-item-${index}`} className="rounded-lg border border-pb-border p-3 bg-pb-background/50 space-y-2">
                          <input type="text" value={item?.title || ''} onChange={(e) => updateAccordionItem(index, 'title', e.target.value)} className="w-full bg-pb-background border border-pb-border rounded-lg px-2 py-2 text-xs font-semibold" placeholder="Question" />
                          <textarea value={item?.content || ''} onChange={(e) => updateAccordionItem(index, 'content', e.target.value)} rows={3} className="w-full bg-pb-background border border-pb-border rounded-lg px-2 py-2 text-xs" placeholder="Réponse" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Disposition de section */}
              {selectedBlock.type === 'Section' && (
                <div className="rounded-xl border border-pb-border bg-pb-background/70 p-4 space-y-3 shadow-sm">
                  <h3 className="text-sm font-semibold text-pb-foreground">Disposition de section</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => updateStyle('display', 'block')} className="px-2 py-2 rounded-lg text-xs border border-pb-border hover:bg-pb-border/20">1 colonne</button>
                    <button onClick={() => ensureSectionColumns(2)} className="px-2 py-2 rounded-lg text-xs border border-pb-border hover:bg-pb-border/20">2 colonnes</button>
                    <button onClick={() => ensureSectionColumns(3)} className="px-2 py-2 rounded-lg text-xs border border-pb-border hover:bg-pb-border/20">3 colonnes</button>
                    <button onClick={() => updateBlock(selectedBlock.id, { children: [] })} className="px-2 py-2 rounded-lg border border-pb-border text-xs hover:bg-pb-border/20">Vider colonnes</button>
                  </div>
                </div>
              )}

              {/* Tableau */}
              {selectedBlock.type === 'Table' && (
                <div className="rounded-xl border border-pb-border bg-pb-background/70 p-4 space-y-3 shadow-sm">
                  <h3 className="text-sm font-semibold text-pb-foreground">Tableau</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-pb-foreground/70 mb-1">Colonnes</label>
                      <input type="number" min="1" value={(selectedBlock.props?.headers || []).length} onChange={(e) => resizeTable(Number(e.target.value || 1), (selectedBlock.props?.rows || []).length || 1)} className="w-full bg-pb-background border border-pb-border rounded-lg px-2 py-1 text-xs" />
                    </div>
                    <div>
                      <label className="block text-xs text-pb-foreground/70 mb-1">Lignes</label>
                      <input type="number" min="1" value={(selectedBlock.props?.rows || []).length} onChange={(e) => resizeTable((selectedBlock.props?.headers || []).length || 1, Number(e.target.value || 1))} className="w-full bg-pb-background border border-pb-border rounded-lg px-2 py-1 text-xs" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-pb-foreground/70">Entetes</h4>
                    {(selectedBlock.props?.headers || []).map((header, colIndex) => (
                      <input key={`header-${colIndex}`} type="text" value={header} onChange={(e) => updateTableHeader(colIndex, e.target.value)} className="w-full bg-pb-background border border-pb-border rounded-lg px-2 py-1 text-xs" placeholder={`Colonne ${colIndex + 1}`} />
                    ))}
                  </div>
                  <div className="overflow-auto max-h-52 border border-pb-border rounded-lg p-2 bg-pb-background/40 space-y-2">
                    {(selectedBlock.props?.rows || []).map((row, rIndex) => (
                      <div key={`row-${rIndex}`} className="grid gap-2" style={{ gridTemplateColumns: `repeat(${(selectedBlock.props?.headers || []).length || 1}, minmax(0, 1fr))` }}>
                        {row.map((cell, cIndex) => (
                          <input key={`cell-${rIndex}-${cIndex}`} type="text" value={cell} onChange={(e) => updateTableCell(rIndex, cIndex, e.target.value)} className="w-full bg-white border border-pb-border rounded px-2 py-1 text-xs" />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Spacer */}
              {selectedBlock.type === 'Spacer' && (
                <div className="rounded-xl border border-pb-border bg-pb-background/70 p-4 space-y-3 shadow-sm">
                  <h3 className="text-sm font-semibold text-pb-foreground">Espace vide</h3>
                  <input type="text" value={selectedBlock.props?.style?.height || ''} onChange={(e) => updateStyle('height', e.target.value)} placeholder="24px" className="w-full bg-pb-background border border-pb-border rounded-lg px-2 py-1 text-xs" />
                </div>
              )}

              {/* Mise en page */}
              <div className="rounded-xl border border-pb-border bg-pb-background/70 p-4 space-y-3 shadow-sm">
                <h3 className="text-sm font-semibold text-pb-foreground flex items-center gap-2">
                  Mise en page
                  <InfoTip text="Organisation du bloc: affichage, alignements, espacements et tailles." />
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Type d'affichage", prop: 'display', options: [{ value: 'block', label: 'Standard' }, { value: 'flex', label: 'Ligne/colonne (flex)' }, { value: 'grid', label: 'Grille' }] },
                    { label: 'Sens (pour flex)', prop: 'flexDirection', options: [{ value: 'row', label: 'Horizontal' }, { value: 'column', label: 'Vertical' }] },
                    { label: 'Alignement horizontal', prop: 'justifyContent', options: [{ value: '', label: 'Automatique' }, { value: 'flex-start', label: 'Debut' }, { value: 'center', label: 'Centre' }, { value: 'flex-end', label: 'Fin' }, { value: 'space-between', label: 'Espace entre' }, { value: 'space-around', label: 'Espace autour' }] },
                    { label: 'Alignement vertical', prop: 'alignItems', options: [{ value: '', label: 'Automatique' }, { value: 'flex-start', label: 'Haut' }, { value: 'center', label: 'Centre' }, { value: 'flex-end', label: 'Bas' }, { value: 'stretch', label: 'Etirer' }] },
                    { label: 'Espacement entre éléments', prop: 'gap', options: [{ value: '', label: 'Aucun' }, { value: '4px', label: 'Tres petit' }, { value: '8px', label: 'Petit' }, { value: '12px', label: 'Moyen' }, { value: '16px', label: 'Confort' }, { value: '24px', label: 'Large' }, { value: '32px', label: 'Tres large' }] },
                    { label: 'Colonnes (si grille)', prop: 'gridTemplateColumns', options: [{ value: '', label: 'Auto' }, { value: 'repeat(2, minmax(0, 1fr))', label: '2 colonnes' }, { value: 'repeat(3, minmax(0, 1fr))', label: '3 colonnes' }, { value: 'repeat(4, minmax(0, 1fr))', label: '4 colonnes' }, { value: 'repeat(auto-fit, minmax(220px, 1fr))', label: 'Auto responsive' }] },
                    { label: 'Marge interne (padding)', prop: 'padding', options: [{ value: '', label: 'Aucun' }, { value: '8px', label: 'Petit' }, { value: '16px', label: 'Moyen' }, { value: '24px', label: 'Large' }, { value: '32px', label: 'Tres large' }] },
                    { label: 'Marge externe (margin)', prop: 'margin', options: [{ value: '', label: 'Aucune' }, { value: '8px 0', label: 'Petit espacement vertical' }, { value: '16px 0', label: 'Espacement vertical' }, { value: '0 auto', label: 'Centrer horizontalement' }] },
                    { label: 'Largeur', prop: 'width', options: [{ value: '', label: 'Automatique' }, { value: '100%', label: '100%' }, { value: '80%', label: '80%' }, { value: '60%', label: '60%' }, { value: 'max-content', label: 'Taille du contenu' }] },
                    { label: 'Hauteur', prop: 'height', options: [{ value: '', label: 'Automatique' }, { value: '200px', label: 'Petite' }, { value: '320px', label: 'Moyenne' }, { value: '480px', label: 'Grande' }, { value: '100vh', label: 'Hauteur ecran' }] },
                  ].map(({ label, prop, options }) => (
                    <div key={prop}>
                      <label className="block text-[11px] text-pb-foreground/70 mb-1">{label}</label>
                      <select value={selectedBlock.props?.style?.[prop] || ''} onChange={(e) => updateStyle(prop, e.target.value)} className="w-full bg-pb-background border border-pb-border rounded-lg px-2 py-2 text-xs">
                        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Typographie & couleurs */}
              <div className="rounded-xl border border-pb-border bg-pb-background/70 p-4 space-y-4 shadow-sm">
                <h3 className="text-sm font-semibold text-pb-foreground flex items-center gap-2">
                  Typographie & couleurs
                  <InfoTip text="Couleurs, texte, bordure, ombre et arrondis du composant selectionne." />
                </h3>
                <ColorPicker label="Couleur du texte" value={selectedBlock.props?.style?.color || '#111827'} onChange={(val) => updateStyle('color', val)} />
                <ColorPicker label="Couleur de fond" value={selectedBlock.props?.style?.backgroundColor || ''} onChange={(val) => updateStyle('backgroundColor', val)} />
                <div className="grid grid-cols-2 gap-2 items-center">
                  <label className="text-xs text-pb-foreground/70">Taille</label>
                  <input type="text" value={selectedBlock.props?.style?.fontSize || ''} onChange={(e) => updateStyle('fontSize', e.target.value)} placeholder="18px" className="bg-pb-background border border-pb-border rounded-lg px-2 py-1 text-xs" />
                  <label className="text-xs text-pb-foreground/70">Graisse</label>
                  <select value={selectedBlock.props?.style?.fontWeight || '400'} onChange={(e) => updateStyle('fontWeight', e.target.value)} className="bg-pb-background border border-pb-border rounded-lg px-2 py-1 text-xs">
                    {[['300', 'Light'], ['400', 'Normal'], ['500', 'Medium'], ['700', 'Bold'], ['900', 'Black']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                  <label className="text-xs text-pb-foreground/70">Alignement</label>
                  <select value={selectedBlock.props?.style?.textAlign || 'left'} onChange={(e) => updateStyle('textAlign', e.target.value)} className="bg-pb-background border border-pb-border rounded-lg px-2 py-1 text-xs">
                    {[['left', 'Gauche'], ['center', 'Centre'], ['right', 'Droite']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                  <label className="text-xs text-pb-foreground/70">Interligne</label>
                  <input type="text" value={selectedBlock.props?.style?.lineHeight || ''} onChange={(e) => updateStyle('lineHeight', e.target.value)} placeholder="1.5" className="bg-pb-background border border-pb-border rounded-lg px-2 py-1 text-xs" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-pb-foreground/70 mb-1">Bordure - epaisseur</label>
                    <select value={borderValues.width} onChange={(e) => updateBorderStyle({ borderWidth: e.target.value })} className="w-full bg-pb-background border border-pb-border rounded-lg px-2 py-1 text-xs">
                      {['0px', '1px', '2px', '3px', '4px', '6px'].map((v) => <option key={v} value={v}>{v === '0px' ? 'Aucune' : v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] text-pb-foreground/70 mb-1">Bordure - style</label>
                    <select value={borderValues.lineStyle} onChange={(e) => updateBorderStyle({ borderStyle: e.target.value })} className="w-full bg-pb-background border border-pb-border rounded-lg px-2 py-1 text-xs">
                      {[['solid', 'Continue'], ['dashed', 'Tirets'], ['dotted', 'Points'], ['double', 'Double'], ['none', 'Aucune']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <ColorPicker label="Bordure - couleur" value={borderValues.color} onChange={(val) => updateBorderStyle({ borderColor: val })} />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[11px] text-pb-foreground/70 mb-1">Coins arrondis</label>
                    <select value={selectedBlock.props?.style?.borderRadius || '0px'} onChange={(e) => updateStyle('borderRadius', e.target.value)} className="w-full bg-pb-background border border-pb-border rounded-lg px-2 py-1 text-xs">
                      {['0px', '4px', '8px', '12px', '16px', '20px', '24px', '32px', '9999px'].map((v) => <option key={v} value={v}>{v === '9999px' ? 'Full' : v}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[11px] text-pb-foreground/70 mb-1">Ombre</label>
                    <select value={selectedBlock.props?.style?.boxShadow || 'none'} onChange={(e) => updateStyle('boxShadow', e.target.value)} className="w-full bg-pb-background border border-pb-border rounded-lg px-2 py-1 text-xs">
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

              {/* CSS avancé */}
              <div className="rounded-xl border border-sky-400/40 bg-sky-500/10 p-4">
                <label className="block text-xs font-bold text-sky-900 dark:text-sky-200 mb-1">Classe CSS du bloc (avance)</label>
                <input type="text" value={selectedBlock.props?.className || ''} onChange={(e) => updateBlock(selectedBlock.id, { props: { ...selectedBlock.props, className: e.target.value } })} className="w-full bg-pb-background border border-sky-300/60 rounded-lg px-3 py-2 text-sm font-mono" placeholder="p-6 rounded-xl shadow-md" />
              </div>
            </div>
          </details>
        </div>
      )}
    </aside>
  );
}
