import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export function SortableComponent({ component }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: component.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative outline-none ring-offset-2 focus:ring-2 focus:ring-pb-accent ${isDragging ? 'opacity-50 scale-[0.98] z-50 shadow-2xl ring-2 shadow-black/20' : 'opacity-100 hover:ring-2 hover:ring-pb-accent hover:z-10 transition-all'}`}
    >
      {/* Poignée de drag Neo-Bento */}
      <div 
        {...attributes} 
        {...listeners}
        className="absolute -left-10 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing p-1.5 text-white bg-pb-accent shadow transition-all rounded hover:scale-110 z-50"
      >
        ⇕
      </div>
      
      {/* Simulation du composant (Ici c'est la version modifiable qui s'affiche !) */}
      <div className="bg-pb-background relative z-0">
        <h3 className="absolute right-2 top-2 text-[10px] font-mono tracking-widest px-2 py-1 bg-pb-foreground text-pb-background opacity-0 group-hover:opacity-100 rounded transition-opacity">
          {component.type}
        </h3>
        <pre className="text-xs text-pb-foreground/70 p-4">{JSON.stringify(component.props, null, 2)}</pre>
      </div>
    </div>
  );
}