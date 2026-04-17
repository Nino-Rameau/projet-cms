"use client"
import Link from 'next/link';
import { useState } from 'react';
import { FileText, Plus, Edit2, Check, X, Trash2, CornerDownRight, ChevronRight, ChevronLeft, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { updatePageStatus, updatePageDetails, deletePage, createNewPage } from '@/app/actions/site';

function SortHeader({ field, label, sortField, sortDir, onSort, className = '' }) {
  const active = sortField === field;
  const Icon = active ? (sortDir === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <button
      onClick={() => onSort(field)}
      className={`flex items-center gap-1 hover:text-pb-foreground transition-colors ${active ? 'text-pb-foreground' : ''} ${className}`}
    >
      {label}
      <Icon size={11} className={active ? 'opacity-100' : 'opacity-40'} />
    </button>
  );
}

function formatLastModification(page) {
  const lastModification = Array.isArray(page.modifications) ? page.modifications[0] : null;
  const dateValue = lastModification?.createdAt || page.updatedAt;

  if (!dateValue) {
    return { dateLabel: '--/--/---- --:--', authorLabel: 'Historique indisponible' };
  }

  const dateLabel = new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(new Date(dateValue));

  const authorLabel =
    lastModification?.user?.name ||
    lastModification?.user?.email ||
    'Historique indisponible';

  return { dateLabel, authorLabel };
}

export default function PageList({ initialPages, siteSlug, siteId, canEdit = true }) {
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [collapsedIds, setCollapsedIds] = useState(new Set());
  const [sortField, setSortField] = useState('updatedAt');
  const [sortDir, setSortDir] = useState('desc');

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
    setCurrentPage(1);
  };

  const getModifiedAt = (page) => {
    const mod = Array.isArray(page.modifications) ? page.modifications[0] : null;
    return mod?.createdAt || page.updatedAt || '';
  };

  const visiblePages = initialPages.filter((p) => !String(p.slug || '').startsWith('__global-'));

  const sortedPages = [...visiblePages].sort((a, b) => {
    let valA, valB;
    if (sortField === 'title') {
      valA = a.title?.toLowerCase() ?? '';
      valB = b.title?.toLowerCase() ?? '';
    } else if (sortField === 'updatedAt') {
      valA = getModifiedAt(a);
      valB = getModifiedAt(b);
    } else if (sortField === 'status') {
      valA = a.status ?? '';
      valB = b.status ?? '';
    }
    if (valA < valB) return sortDir === 'asc' ? -1 : 1;
    if (valA > valB) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const buildTree = (pages, parentId = null) =>
    pages
      .filter(p => p.parentId === parentId)
      .map(p => ({ ...p, children: buildTree(pages, p.id) }));

  const tree = buildTree(sortedPages);

  const toggleCollapse = (id) => {
    setCollapsedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Flatten tree respecting collapsed state — children of collapsed nodes are hidden
  const flattenTree = (nodes, depth = 0) => {
    const result = [];
    for (const node of nodes) {
      result.push({ ...node, depth });
      if (node.children?.length > 0 && !collapsedIds.has(node.id)) {
        result.push(...flattenTree(node.children, depth + 1));
      }
    }
    return result;
  };

  const flatRows = flattenTree(tree);
  const totalRows = flatRows.length;
  const totalPages = Math.ceil(totalRows / pageSize);
  const start = (currentPage - 1) * pageSize;
  const paginatedRows = flatRows.slice(start, start + pageSize);

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  return (
    <div className="pb-4">
      {visiblePages.length === 0 && (
        <div className="p-8 font-medium text-center text-pb-foreground/50">
          Aucune page. Créez-en une avec le bouton Ajouter.
        </div>
      )}

      {/* En-têtes de tri */}
      <div className="grid grid-cols-12 px-6 py-2 text-xs font-bold tracking-wider uppercase border-b border-pb-border bg-pb-border/10 text-pb-foreground/40">
        <SortHeader className="col-span-4" field="title" label="Page" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
        <SortHeader className="flex justify-center col-span-2" field="status" label="Statut" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
        <SortHeader className="flex justify-center col-span-2" field="updatedAt" label="Modifié" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
        <div className="col-span-4" />
      </div>

      <div className="divide-y divide-pb-border">
        {paginatedRows.map(row => (
          <PageRow
            key={row.id}
            page={row}
            depth={row.depth}
            isCollapsed={collapsedIds.has(row.id)}
            onToggleCollapse={toggleCollapse}
            siteSlug={siteSlug}
            siteId={siteId}
            allPages={visiblePages}
            canEdit={canEdit}
          />
        ))}
      </div>

      {totalRows > 0 && (
        <div className="flex items-center justify-between px-6 py-3 mt-2 border-t border-pb-border">
          <div className="flex items-center gap-2 text-sm text-pb-foreground/60">
            <span>Lignes par page :</span>
            {[10, 20, 50, 100].map(size => (
              <button
                key={size}
                onClick={() => handlePageSizeChange(size)}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors ${
                  pageSize === size
                    ? 'bg-pb-foreground text-pb-background'
                    : 'hover:bg-pb-border/30'
                }`}
              >
                {size}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 text-sm text-pb-foreground/60">
            <span>
              {start + 1}–{Math.min(start + pageSize, totalRows)} sur {totalRows}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-md hover:bg-pb-border/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="px-2 font-semibold text-pb-foreground">
                {currentPage} / {totalPages || 1}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="p-1.5 rounded-md hover:bg-pb-border/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PageRow({ page, depth, isCollapsed, onToggleCollapse, siteSlug, siteId, allPages, canEdit }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingChild, setIsAddingChild] = useState(false);
  const [title, setTitle] = useState(page.title);
  const [slug, setSlug] = useState(page.slug);

  const hasChildren = page.children?.length > 0;

  const getFullSlug = () => {
    let current = page;
    let parts = [current.slug];
    while (current.parentId && current.parentId !== "null") {
      const parent = allPages.find(p => p.id === current.parentId);
      if (parent) { parts.unshift(parent.slug); current = parent; }
      else break;
    }
    return parts.join("/");
  };

  const fullSlug = getFullSlug();
  const { dateLabel, authorLabel } = formatLastModification(page);

  return (
    <>
      <div className="grid items-center grid-cols-12 px-6 py-4 transition-colors hover:bg-pb-border/5 group">
        <div className="flex items-center col-span-4 pr-2" style={{ paddingLeft: `${depth * 2.5}rem` }}>
          {hasChildren ? (
            <button
              onClick={() => onToggleCollapse(page.id)}
              title={isCollapsed ? 'Afficher les sous-pages' : 'Masquer les sous-pages'}
              className="p-1 mr-1 transition-colors rounded hover:bg-pb-border/30 shrink-0 text-pb-foreground/40 hover:text-pb-foreground/80"
            >
              <ChevronRight
                size={14}
                className={`transition-transform duration-150 ${isCollapsed ? '' : 'rotate-90'}`}
              />
            </button>
          ) : depth > 0 ? (
            <CornerDownRight size={18} className="mr-2 text-pb-border shrink-0" />
          ) : (
            <span className="w-[22px] mr-1 shrink-0" />
          )}

          <div className={`p-2 rounded-md mr-3 shrink-0 ${page.status === 'PUBLISHED' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
            <FileText size={18} />
          </div>

          {isEditing ? (
            <form action={(formData) => { updatePageDetails(formData); setIsEditing(false); }} className="flex-1 mr-4">
              <input type="hidden" name="pageId" value={page.id} />
              <input type="hidden" name="siteSlug" value={siteSlug} />
              <div className="flex flex-col w-full gap-1">
                <input value={title} onChange={e => setTitle(e.target.value)} name="title" className="w-full px-2 py-1 text-sm font-bold text-black border rounded bg-pb-border/20 border-pb-border" placeholder="Titre..." />
                <div className="flex items-center w-full gap-1">
                  <span className="text-xs text-pb-foreground/40">/</span>
                  <input value={slug} onChange={e => setSlug(e.target.value)} name="slug" className="flex-1 px-2 py-1 font-mono text-xs text-white border rounded bg-pb-background border-pb-border" placeholder="Slug..." />
                </div>
                <div className="flex gap-2 mt-1">
                  <button type="submit" className="text-green-500 hover:text-green-600"><Check size={16} /></button>
                  <button type="button" onClick={() => { setIsEditing(false); setTitle(page.title); setSlug(page.slug); }} className="text-red-500 hover:text-red-600"><X size={16} /></button>
                </div>
              </div>
            </form>
          ) : (
            <div className="w-full min-w-0 pr-4">
              <div className="flex items-center gap-1.5">
                <h3 className="mb-1 font-bold text-[15px] leading-tight">{page.title}</h3>
              </div>
              <div className="font-mono text-xs leading-snug break-all whitespace-normal text-pb-foreground/50">/{siteSlug}/{fullSlug}</div>
            </div>
          )}
        </div>

        <div className="flex justify-center col-span-2">
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

        <div className="col-span-2 px-2 text-center">
          <p className="text-xs font-semibold text-pb-foreground/80">{dateLabel}</p>
          <p className="text-[11px] text-pb-foreground/60 truncate">{authorLabel}</p>
        </div>

        <div className="flex flex-wrap items-center justify-end col-span-4 gap-2 transition-opacity opacity-50 xl:opacity-0 group-hover:opacity-100">
          {!isEditing && canEdit && (
            <>
              <button title="Ajouter une Sous-page" onClick={() => setIsAddingChild(!isAddingChild)} className="p-2 transition-colors rounded-md text-pb-foreground/60 hover:text-pb-accent hover:bg-pb-border/20"><Plus size={16} /></button>
              <button title="Modifier Paramètres" onClick={() => setIsEditing(true)} className="p-2 transition-colors rounded-md text-pb-foreground/60 hover:text-pb-accent hover:bg-pb-border/20"><Edit2 size={16} /></button>
              <form action={deletePage} onSubmit={(e) => { if (!confirm('Sûr de supprimer cette page et ses sous-pages ?')) e.preventDefault() }}>
                <input type="hidden" name="pageId" value={page.id} />
                <input type="hidden" name="siteSlug" value={siteSlug} />
                <button type="submit" className="p-2 transition-colors rounded-md text-pb-foreground/60 hover:text-red-500 hover:bg-red-500/10"><Trash2 size={16} /></button>
              </form>
            </>
          )}
          <div className="self-center w-px h-6 mx-1 bg-pb-border" />
          <Link href={`/view/${siteSlug}/${fullSlug}`} target="_blank" className="flex items-center px-4 py-2 text-xs font-bold transition-all border rounded-lg shadow-sm border-pb-border bg-pb-background hover:bg-pb-foreground hover:text-pb-background">
            Voir
          </Link>
          {canEdit && (
            <Link href={`/editor/${siteSlug}/edit/${fullSlug}`} className="flex items-center px-4 py-2 text-xs font-bold transition-all border rounded-lg shadow-sm border-pb-border bg-pb-background hover:bg-pb-foreground hover:text-pb-background">
              Éditer
            </Link>
          )}
        </div>
      </div>

      {isAddingChild && canEdit && (
        <div className="px-6 py-3 bg-pb-accent/5 border-y border-pb-accent/20" style={{ paddingLeft: `${(depth + 1) * 2.5 + 1.5}rem` }}>
          <form action={(formData) => { createNewPage(formData); setIsAddingChild(false); }} className="flex items-center gap-3">
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
    </>
  );
}
