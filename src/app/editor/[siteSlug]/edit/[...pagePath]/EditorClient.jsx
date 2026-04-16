'use client';
import { useEditorStore } from '@/store/useEditorStore';
import { Layers, Type, Image as ImageIcon, Box, AlignLeft, Heading1, Heading2, Heading3, Heading4, List, Table2, Globe, ListCollapse } from 'lucide-react';
import { useEffect, useRef, useState, useTransition } from 'react';
import { DndContext, DragOverlay, pointerWithin, rectIntersection, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { savePageContent } from '@/app/actions/site';

import EditorTopBar from '@/components/editor/EditorTopBar';
import BlockInspector from '@/components/editor/BlockInspector';
import { PaletteItem, InfoTip, SortableBlock } from '@/components/editor/BlockPreview';
import {
  createBlock, cloneBlockWithFreshIds, findParentInfoInTree, getBlockDisplayName,
} from '@/components/editor/editorUtils.jsx';
import { PAGE_SETTINGS_DEFAULTS, BLOCK_CLIPBOARD_STORAGE_KEY } from '@/components/editor/editorConstants';

export default function EditorClient({ siteSlug, pagePath, pageId, initialBlocks, initialPageSettings, sitePages }) {
  const [isMounted, setIsMounted] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [isPending, startTransition] = useTransition();
  const [copiedBlock, setCopiedBlock] = useState(null);
  const [pageSettings, setPageSettings] = useState(PAGE_SETTINGS_DEFAULTS);

  const {
    blocks, initBlocks, getBlockById, selectedBlockId,
    previewMode, setPreviewMode, addBlock, selectBlock, updateBlock, reorderBlocks, deleteBlock,
  } = useEditorStore();

  const hydratedPageRef = { current: null };
  const lastOverIdRef = { current: null };

  useEffect(() => {
    setIsMounted(true);
    if (hydratedPageRef.current !== pageId) {
      initBlocks(initialBlocks || []);
      selectBlock(null);
      setPageSettings({ ...PAGE_SETTINGS_DEFAULTS, ...(initialPageSettings || {}) });
      hydratedPageRef.current = pageId;
    }
  }, [pageId, initialBlocks, initialPageSettings, initBlocks, selectBlock]);

  const updatePageSetting = (key, value) => setPageSettings((prev) => ({ ...prev, [key]: value }));

  const readClipboardFromStorage = () => {
    try {
      const raw = localStorage.getItem(BLOCK_CLIPBOARD_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed?.type ? parsed : null;
    } catch { return null; }
  };

  const selectedBlock = selectedBlockId ? getBlockById(selectedBlockId) : null;

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
    try { localStorage.setItem(BLOCK_CLIPBOARD_STORAGE_KEY, JSON.stringify(copied)); } catch (_) {}
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

  // Charger le presse-papier au démarrage
  useEffect(() => {
    const initial = readClipboardFromStorage();
    if (initial) setCopiedBlock(initial);
    const onStorage = (event) => {
      if (event.key !== BLOCK_CLIPBOARD_STORAGE_KEY) return;
      setCopiedBlock(readClipboardFromStorage());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // P5 — Ref partagée pour que le listener clavier lise toujours les valeurs à jour
  // sans se réenregistrer à chaque changement de bloc
  const kbRef = useRef({});
  useEffect(() => {
    kbRef.current = { selectedBlock, copiedBlock, copySelectedBlock, duplicateSelectedBlock, pasteCopiedBlock };
  });

  // Raccourcis clavier — enregistré une seule fois grâce au pattern ref
  useEffect(() => {
    const onKeyDown = (e) => {
      const { selectedBlock, copiedBlock, copySelectedBlock, duplicateSelectedBlock, pasteCopiedBlock } = kbRef.current;
      const target = e.target;
      const isTypingTarget = target?.isContentEditable || ['input', 'textarea', 'select'].includes(target?.tagName?.toLowerCase());
      if (isTypingTarget || !(e.metaKey || e.ctrlKey)) return;
      if (e.key.toLowerCase() === 'c' && selectedBlock) { e.preventDefault(); copySelectedBlock(); }
      if (e.key.toLowerCase() === 'd' && selectedBlock) { e.preventDefault(); duplicateSelectedBlock(); }
      if (e.key.toLowerCase() === 'v' && selectedBlock && copiedBlock) { e.preventDefault(); pasteCopiedBlock(); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = () => {
    startTransition(async () => {
      try {
        await savePageContent(pageId, { blocks, settings: pageSettings });
      } catch (e) {
        console.error(e);
        alert('Erreur lors de la sauvegarde');
      }
    });
  };

  // --- DnD ---

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const customCollisionDetection = (args) => {
    const pointerCollisions = pointerWithin(args);
    return pointerCollisions.length > 0 ? pointerCollisions : rectIntersection(args);
  };

  const { setNodeRef: setDroppableCanvasRef, isOver: isCanvasOver } = useDroppable({ id: 'canvas-droppable', data: { isCanvas: true } });
  const { setNodeRef: setCanvasEndDropRef, isOver: isCanvasEndOver } = useDroppable({ id: 'canvas-end-drop', data: { isCanvas: true } });

  const handleDragStart = (event) => { setActiveId(event.active.id); lastOverIdRef.current = null; };
  const handleDragOver = (event) => { if (event.over?.id) lastOverIdRef.current = event.over.id; };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);
    const currentBlocks = useEditorStore.getState().blocks;
    let resolvedOverId = over?.id || lastOverIdRef.current;
    let resolvedOverData = over?.data?.current || ((resolvedOverId === 'canvas-droppable' || resolvedOverId === 'canvas-end-drop') ? { isCanvas: true } : undefined);
    const activeIdValue = String(active?.id || '');
    const fallbackPaletteType = activeIdValue.startsWith('palette-') ? activeIdValue.replace('palette-', '') : null;
    const isPaletteDrag = Boolean(active?.data?.current?.isPaletteItem || fallbackPaletteType);
    const activePaletteType = active?.data?.current?.type || fallbackPaletteType;
    const isCanvasItemDrag = Boolean(active?.data?.current?.isCanvasItem || activeIdValue.startsWith('block-'));
    lastOverIdRef.current = null;

    if (!resolvedOverId) {
      if (isPaletteDrag && activePaletteType) { resolvedOverId = 'canvas-droppable'; resolvedOverData = { isCanvas: true }; }
      else return;
    }

    if (isPaletteDrag && activePaletteType) {
      const newBlock = createBlock(activePaletteType);
      const uniqueId = newBlock.id;
      const sectionId = resolvedOverData?.isSectionDrop ? resolvedOverData.sectionId : null;
      const isOverCanvas = resolvedOverId === 'canvas-droppable' || resolvedOverId === 'canvas-end-drop' || resolvedOverData?.isCanvas;

      if (sectionId) {
        addBlock(newBlock, sectionId);
      } else if (resolvedOverId && !isOverCanvas) {
        const overIndex = currentBlocks.findIndex((b) => b.id === resolvedOverId);
        if (overIndex !== -1) {
          const newBlocks = [...currentBlocks];
          newBlocks.splice(overIndex + 1, 0, newBlock);
          reorderBlocks(newBlocks);
        } else { addBlock(newBlock); }
      } else { addBlock(newBlock); }

      setTimeout(() => {
        if (useEditorStore.getState().blocks.some((b) => b.id === uniqueId)) selectBlock(uniqueId);
      }, 50);
      return;
    }

    if (isCanvasItemDrag && resolvedOverId !== active.id) {
      if (resolvedOverId === 'canvas-droppable' || resolvedOverId === 'canvas-end-drop' || resolvedOverData?.isCanvas) {
        const oldIndex = currentBlocks.findIndex((b) => b.id === active.id);
        if (oldIndex !== -1 && oldIndex !== currentBlocks.length - 1) reorderBlocks(arrayMove(currentBlocks, oldIndex, currentBlocks.length - 1));
        return;
      }
      const oldIndex = currentBlocks.findIndex((b) => b.id === active.id);
      const newIndex = currentBlocks.findIndex((b) => b.id === resolvedOverId);
      if (oldIndex !== -1 && newIndex !== -1) reorderBlocks(arrayMove(currentBlocks, oldIndex, newIndex));
    }
  };

  if (!isMounted) return null;

  const PALETTE_ITEMS = [
    { type: 'Section',   icon: Layers,     label: 'Section',    group: 'structure' },
    { type: 'Divider',   icon: AlignLeft,  label: 'Separateur', group: 'structure' },
    { type: 'Spacer',    icon: AlignLeft,  label: 'Espace',     group: 'structure' },
    { type: 'UL',        icon: List,       label: 'Liste',      group: 'structure' },
    { type: 'H1',        icon: Heading1,   label: 'Titre 1',    group: 'text' },
    { type: 'H2',        icon: Heading2,   label: 'Titre 2',    group: 'text' },
    { type: 'H3',        icon: Heading3,   label: 'Titre 3',    group: 'text' },
    { type: 'H4',        icon: Heading4,   label: 'Titre 4',    group: 'text' },
    { type: 'Paragraph', icon: AlignLeft,  label: 'Paragraphe', group: 'text' },
    { type: 'Text',      icon: Type,       label: 'Texte court', group: 'text' },
    { type: 'Quote',     icon: AlignLeft,  label: 'Citation',   group: 'text' },
    { type: 'Image',     icon: ImageIcon,  label: 'Image',      group: 'media' },
    { type: 'Button',    icon: Box,        label: 'Bouton',     group: 'media' },
    { type: 'SocialLinks', icon: Globe,   label: 'Reseaux',    group: 'media' },
    { type: 'Table',     icon: Table2,     label: 'Tableau',    group: 'media' },
    { type: 'Accordion', icon: ListCollapse, label: 'FAQ',      group: 'media' },
  ];

  return (
    <div className="h-screen w-full flex flex-col bg-pb-background text-pb-foreground overflow-hidden font-sans">
      <EditorTopBar
        siteSlug={siteSlug}
        pagePath={pagePath}
        previewMode={previewMode}
        setPreviewMode={setPreviewMode}
        isPending={isPending}
        onSave={handleSave}
      />

      <DndContext sensors={sensors} collisionDetection={customCollisionDetection} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
        <main className="flex-1 flex overflow-hidden relative">
          {/* Palette gauche */}
          <aside className="w-72 flex-shrink-0 border-r border-pb-border bg-pb-background/50 p-4 overflow-y-auto relative z-50">
            <h2 className="text-xs font-bold text-pb-foreground/60 uppercase tracking-wider mb-4 flex items-center gap-2">
              Structure <InfoTip text="Commencez avec une section pour construire une zone." />
            </h2>
            <div className="grid grid-cols-2 gap-2 mb-6">
              {PALETTE_ITEMS.filter((i) => i.group === 'structure').map((item) => (
                <PaletteItem key={item.type} type={item.type} icon={item.icon} label={item.label} />
              ))}
            </div>
            <h2 className="text-xs font-bold text-pb-foreground/60 uppercase tracking-wider mb-4 flex items-center gap-2">
              Titres et textes <InfoTip text="H1 > H2 > H3 > H4 pour la hiérarchie." />
            </h2>
            <div className="grid grid-cols-2 gap-2 mb-6">
              {PALETTE_ITEMS.filter((i) => i.group === 'text').map((item) => (
                <PaletteItem key={item.type} type={item.type} icon={item.icon} label={item.label} />
              ))}
            </div>
            <h2 className="text-xs font-bold text-pb-foreground/60 uppercase tracking-wider mb-4">Media et actions</h2>
            <div className="grid grid-cols-2 gap-2">
              {PALETTE_ITEMS.filter((i) => i.group === 'media').map((item) => (
                <PaletteItem key={item.type} type={item.type} icon={item.icon} label={item.label} />
              ))}
            </div>
          </aside>

          {/* Canvas central */}
          <section className="flex-1 min-w-0 bg-pb-border/10 p-8 flex items-start justify-center overflow-y-auto overflow-x-auto relative">
            <div
              ref={setDroppableCanvasRef}
              className={`self-start transition-all duration-300 ease-in-out text-black shadow-2xl rounded-sm ring-2 relative ${
                isCanvasOver ? 'ring-pb-accent ring-opacity-100 bg-blue-50/20' : 'ring-pb-border ring-opacity-50'
              } ${previewMode === 'desktop' ? 'w-full max-w-6xl' : previewMode === 'tablet' ? 'w-[768px]' : 'w-[375px]'}`}
              style={{
                minHeight: 'calc(100vh - 8rem)',
                backgroundColor: '#ffffff',
                backgroundImage: [
                  pageSettings.backgroundImage || '',
                  pageSettings.backgroundColor && pageSettings.backgroundColor !== 'transparent' ? `linear-gradient(${pageSettings.backgroundColor}, ${pageSettings.backgroundColor})` : '',
                ].filter(Boolean).join(', ') || undefined,
              }}
            >
              {!blocks.length && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-300 pointer-events-none select-none">
                  Glissez-déposez le premier composant ici
                </div>
              )}
              <div className="relative z-10 w-full p-8 min-h-[120vh] pb-36">
                <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                  {blocks.map((block) => <SortableBlock key={block.id} block={block} siteSlug={siteSlug} />)}
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

          {/* Inspecteur droit */}
          <BlockInspector
            selectedBlock={selectedBlock}
            copiedBlock={copiedBlock}
            pageSettings={pageSettings}
            updatePageSetting={updatePageSetting}
            copySelectedBlock={copySelectedBlock}
            duplicateSelectedBlock={duplicateSelectedBlock}
            pasteCopiedBlock={pasteCopiedBlock}
            sitePages={sitePages || []}
          />
        </main>

        <DragOverlay dropAnimation={null}>
          {activeId ? (
            <div className="w-48 bg-pb-accent text-white font-bold px-4 py-2 rounded text-center shadow-2xl z-[9999] pointer-events-none">
              {activeId.startsWith('palette-') ? `Ajouter ${getBlockDisplayName(activeId.replace('palette-', ''))}` : 'Déplacement...'}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
