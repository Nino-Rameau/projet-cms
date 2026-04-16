'use client';
import { parseColorAndOpacity, compileColor } from './editorUtils.jsx';

export default function ColorPicker({ label, value, onChange }) {
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
}
