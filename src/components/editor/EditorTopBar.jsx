'use client';
import { Monitor, Smartphone, Tablet, Save, Eye } from 'lucide-react';
import ThemeToggle from '@/components/ui/ThemeToggle';

export default function EditorTopBar({ siteSlug, pagePath, previewMode, setPreviewMode, isPending, onSave }) {
  return (
    <header className="h-14 bg-pb-background border-b border-pb-border flex items-center px-4 justify-between">
      <div className="font-bold flex items-center gap-3">
        <a href={`/dashboard/${siteSlug}`} className="text-xs font-semibold px-2 py-1 rounded border border-pb-border hover:bg-pb-border/30 transition">← Dashboard</a>
        <span className="text-pb-accent">Pb</span>
        <span className="text-xs text-pb-foreground/60">{siteSlug} / {pagePath.join('/')}</span>
      </div>

      <div className="flex bg-pb-border/30 rounded-md p-1 border border-pb-border">
        {[
          { mode: 'desktop', Icon: Monitor },
          { mode: 'tablet',  Icon: Tablet },
          { mode: 'mobile',  Icon: Smartphone },
        ].map(({ mode, Icon }) => (
          <button
            key={mode}
            onClick={() => setPreviewMode(mode)}
            className={`p-2 rounded-sm transition ${previewMode === mode ? 'bg-pb-background shadow text-pb-foreground' : 'text-pb-foreground/50 hover:bg-white/10'}`}
          >
            <Icon size={16} />
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <ThemeToggle compact />
        <a
          href={`/view/${siteSlug}/${pagePath.join('/')}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-pb-border/30 hover:bg-pb-border rounded-md transition border border-pb-border"
        >
          <Eye size={16} /> Aperçu
        </a>
        <button
          onClick={onSave}
          disabled={isPending}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-pb-accent text-white font-medium hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition shadow-md"
        >
          <Save size={16} /> {isPending ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
    </header>
  );
}
