"use client";

import { useState, useCallback } from "react";
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useRealtimeSync } from "@/lib/hooks/useRealtimeSync";
import { SortableComponent } from "./SortableComponent";

export function VisualEditor({ siteId, initialContent }) {
  // Synchronisation temps réel optimiste
  const { content, updateContent } = useRealtimeSync(siteId, initialContent);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = content.findIndex((c) => c.id === active.id);
      const newIndex = content.findIndex((c) => c.id === over.id);

      // Optimistic UI update localement avant la sync
      const newContent = arrayMove(content, oldIndex, newIndex);
      updateContent(newContent);
    }
  }, [content, updateContent]);

  return (
    <div className="w-full flex h-full">
      {/* Barre Latérale (Sidebar Style Elementor) */}
      <aside className="w-72 flex-shrink-0 bg-neutral-900 border-r border-pb-border flex flex-col h-full z-10 overflow-y-auto">
        <div className="p-4 border-b border-pb-border sticky top-0 bg-neutral-900">
          <h3 className="font-bold text-white mb-1">Composants</h3>
          <p className="text-xs text-neutral-400">Glissez-déposez pour éditer la page.</p>
        </div>
        
        {/* Grille de composants (MOCK pour le moment) */}
        <div className="p-4 grid grid-cols-2 gap-3">
          {['Hero Section', 'Texte', 'Image', 'Grille', 'Bouton', 'Formulaire'].map(t => (
            <div key={t} className="flex flex-col items-center justify-center p-3 bg-neutral-800 border border-neutral-700 rounded cursor-grab hover:border-pb-accent hover:bg-neutral-700 transition-colors text-white py-6">
              <div className="w-6 h-6 bg-neutral-600 mb-2 rounded-sm" />
              <span className="text-[10px] uppercase font-bold tracking-wider">{t}</span>
            </div>
          ))}
        </div>

        <div className="p-4 mt-auto border-t border-pb-border sticky bottom-0 bg-neutral-900">
          <h3 className="font-bold text-white mb-2 text-sm">Paramètres globaux</h3>
          <button className="w-full py-2 bg-neutral-800 text-xs rounded border border-neutral-700 hover:border-pb-border text-white">Éditer le thème</button>
        </div>
      </aside>

      {/* Zone principale (Toile / Canvas) */}
      <main className="flex-1 bg-pb-background relative overflow-y-auto w-full flex justify-center py-10 px-4">
        {/* Cadre de l'appareil (simule le rendu) */}
        <div className="w-full max-w-5xl bg-white dark:bg-black border border-pb-border rounded-xl shadow-2xl overflow-hidden min-h-[800px] flex flex-col relative transition-all duration-300 ring-4 ring-black/5 dark:ring-white/5">
          <div className="h-8 bg-neutral-100 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 flex items-center px-4 gap-2 opacity-50 shrink-0">
             <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
             <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
             <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
          </div>
          
          <div className="flex-1 p-0 m-0 w-full relative">
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext 
                items={content.map(c => c.id)}
                strategy={verticalListSortingStrategy}
              >
                {content.map((component) => (
                  <SortableComponent key={component.id} component={component} />
                ))}
              </SortableContext>
            </DndContext>
            
            {content.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-pb-border border-4 border-dashed border-pb-border/30 m-8 rounded-2xl">
                <span className="text-2xl font-bold mb-2">Zone de dépôt</span>
                <span className="text-sm">Glissez un composant ici</span>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}