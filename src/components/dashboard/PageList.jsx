"use client"
import Link from 'next/link';
import { useState } from 'react';
import { Globe, FileText, Plus, Edit2, Check, X, Trash2, CornerDownRight } from 'lucide-react';
import { updatePageStatus, updatePageDetails, deletePage, createNewPage } from '@/app/actions/site';

function formatLastModification(page) {
  const lastModification = Array.isArray(page.modifications) ? page.modifications[0] : null;
  const dateValue = lastModification?.createdAt || page.updatedAt;

  if (!dateValue) {
    return {
      dateLabel: '--/--/---- --:--',
      authorLabel: 'Historique indisponible',
    };
  }

  const dateLabel = new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(dateValue));

  const authorLabel =
    lastModification?.user?.name ||
    lastModification?.user?.email ||
    'Historique indisponible';

  return {
    dateLabel,
    authorLabel,
  };
}

export default function PageList({ initialPages, siteSlug, siteId, canEdit = true }) {
  const visiblePages = initialPages.filter((p) => !String(p.slug || '').startsWith('__global-'));

  const buildTree = (pages, parentId = null) => {
    return pages
      .filter(p => p.parentId === parentId)
      .map(p => ({ ...p, children: buildTree(pages, p.id) }));
  };

  const tree = buildTree(visiblePages);

  return (
    <div className="divide-y divide-pb-border pb-12">
      {visiblePages.length === 0 && (
        <div className="p-8 text-center text-pb-foreground/50 font-medium">
          Aucune page. Créez-en une avec le bouton Ajouter.
        </div>
      )}
      
      {tree.map(node => (
        <PageRow key={node.id} page={node} siteSlug={siteSlug} siteId={siteId} depth={0} allPages={visiblePages} canEdit={canEdit} />
      ))}
    </div>
  );
}

function PageRow({ page, siteSlug, siteId, depth, allPages, canEdit }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingChild, setIsAddingChild] = useState(false);
  const [title, setTitle] = useState(page.title);
  const [slug, setSlug] = useState(page.slug);

  const getFullSlug = () => {
    let current = page;
    let parts = [current.slug];
    while (current.parentId && current.parentId !== "null") {
      const parent = allPages.find(p => p.id === current.parentId);
      if(parent) {
         parts.unshift(parent.slug);
         current = parent;
      } else break;
    }
    return parts.join("/");
  };

  const fullSlug = getFullSlug();
  const { dateLabel, authorLabel } = formatLastModification(page);

  return (
    <>
      <div className="grid grid-cols-12 px-6 py-4 items-center hover:bg-pb-border/5 transition-colors group">
        <div className="col-span-4 flex items-center pr-2" style={{ paddingLeft: `${depth * 2.5}rem` }}>
          {depth > 0 && <CornerDownRight size={18} className="text-pb-border mr-2 shrink-0" />}
          <div className={`p-2 rounded-md mr-4 shrink-0 ${page.status === 'PUBLISHED' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
            <FileText size={20} />
          </div>
          
          {isEditing ? (
            <form action={(formData) => {
              updatePageDetails(formData);
              setIsEditing(false);
            }} className="flex-1 mr-4">
              <input type="hidden" name="pageId" value={page.id} />
              <input type="hidden" name="siteSlug" value={siteSlug} />
              <div className="flex flex-col gap-1 w-full">
                <input value={title} onChange={e => setTitle(e.target.value)} name="title" className="px-2 py-1 bg-pb-border/20 font-bold border border-pb-border rounded text-sm text-black w-full" placeholder="Titre..." />
                <div className="flex items-center gap-1 w-full">
                   <span className="text-xs text-pb-foreground/40">/</span>
                   <input value={slug} onChange={e => setSlug(e.target.value)} name="slug" className="flex-1 px-2 py-1 bg-pb-background font-mono text-xs border border-pb-border rounded text-white" placeholder="Slug..." />
                </div>
                <div className="flex gap-2 mt-1">
                   <button type="submit" className="text-green-500 hover:text-green-600"><Check size={16} /></button>
                   <button type="button" onClick={() => { setIsEditing(false); setTitle(page.title); setSlug(page.slug); }} className="text-red-500 hover:text-red-600"><X size={16} /></button>
                </div>
              </div>
            </form>
          ) : (
            <div className="pr-4 w-full min-w-0">
              <h3 className="font-bold text-[15px] leading-tight mb-1">{page.title}</h3>
              <div className="text-xs text-pb-foreground/50 font-mono break-all whitespace-normal leading-snug">/{siteSlug}/{fullSlug}</div>
            </div>
          )}
        </div>

        <div className="col-span-2 flex justify-center">
          {canEdit ? (
            <form action={updatePageStatus}>
              <input type="hidden" name="pageId" value={page.id} />
              <input type="hidden" name="siteSlug" value={siteSlug} />
              <input type="hidden" name="status" value={page.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED'} />
              <button type="submit" className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full cursor-pointer hover:opacity-80 transition-opacity ${
                page.status === 'PUBLISHED' ? 'bg-green-500/20 text-green-500' : 'bg-yellow-500/20 text-yellow-600'
              }`}>
                {page.status === 'PUBLISHED' ? 'Public' : 'Brouillon'}
              </button>
            </form>
          ) : (
            <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full ${
              page.status === 'PUBLISHED' ? 'bg-green-500/20 text-green-500' : 'bg-yellow-500/20 text-yellow-600'
            }`}>
              {page.status === 'PUBLISHED' ? 'Public' : 'Brouillon'}
            </span>
          )}
        </div>

        <div className="col-span-2 text-center px-2">
          <p className="text-xs font-semibold text-pb-foreground/80">{dateLabel}</p>
          <p className="text-[11px] text-pb-foreground/60 truncate">{authorLabel}</p>
        </div>

        <div className="col-span-4 flex flex-wrap items-center justify-end gap-2 opacity-50 xl:opacity-0 group-hover:opacity-100 transition-opacity">
          {!isEditing && canEdit && (
            <>
              <button title="Ajouter une Sous-page" onClick={() => setIsAddingChild(!isAddingChild)} className="p-2 text-pb-foreground/60 hover:text-pb-accent hover:bg-pb-border/20 rounded-md transition-colors"><Plus size={16}/></button>
              <button title="Modifier Paramètres" onClick={() => setIsEditing(true)} className="p-2 text-pb-foreground/60 hover:text-pb-accent hover:bg-pb-border/20 rounded-md transition-colors"><Edit2 size={16}/></button>
              <form action={deletePage} onSubmit={(e) => { if(!confirm('Sûr de supprimer cette page et ses sous-pages ?')) e.preventDefault() }}>
                <input type="hidden" name="pageId" value={page.id} />
                <input type="hidden" name="siteSlug" value={siteSlug} />
                <button type="submit" className="p-2 text-pb-foreground/60 hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors"><Trash2 size={16}/></button>
              </form>
            </>
          )}
          <div className="w-px h-6 bg-pb-border mx-1 self-center"></div>
          <Link href={`/view/${siteSlug}/${fullSlug}`} target="_blank" className="px-4 py-2 border border-pb-border bg-pb-background hover:bg-pb-foreground hover:text-pb-background rounded-lg font-bold text-xs transition-all shadow-sm flex items-center">
            Voir
          </Link>
          {canEdit && (
            <Link href={`/editor/${siteSlug}/edit/${fullSlug}`} className="px-4 py-2 border border-pb-border bg-pb-background hover:bg-pb-foreground hover:text-pb-background rounded-lg font-bold text-xs transition-all shadow-sm flex items-center">
              Éditer
            </Link>
          )}
        </div>
      </div>

      {isAddingChild && canEdit && (
        <div className="bg-pb-accent/5 px-6 py-3 border-y border-pb-accent/20" style={{ paddingLeft: `${(depth + 1) * 2.5}rem` }}>
          <form action={(formData) => {
            createNewPage(formData);
            setIsAddingChild(false);
          }} className="flex items-center gap-3">
             <CornerDownRight size={18} className="text-pb-accent shrink-0" />
             <input type="hidden" name="siteId" value={siteId} />
             <input type="hidden" name="siteSlug" value={siteSlug} />
             <input type="hidden" name="parentId" value={page.id} />
             <input name="title" required placeholder="Titre de la sous-page..." className="px-3 py-1.5 bg-white text-black text-sm border border-pb-border/50 rounded-md focus:border-pb-accent outline-none w-64 shadow-sm" />
             <button type="submit" className="px-3 py-1.5 bg-pb-accent text-white font-bold rounded-md text-xs shadow-sm">Créer</button>
             <button type="button" onClick={() => setIsAddingChild(false)} className="px-3 py-1.5 text-pb-foreground/50 hover:text-pb-foreground font-medium text-xs">Annuler</button>
          </form>
        </div>
      )}

      {page.children && page.children.map(child => (
        <PageRow key={child.id} page={child} siteSlug={siteSlug} siteId={siteId} depth={depth + 1} allPages={allPages} canEdit={canEdit} />
      ))}
    </>
  );
}
