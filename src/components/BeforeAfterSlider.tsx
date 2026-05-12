import { useRef, useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeftRight, Download, Columns2 } from 'lucide-react';

interface BeforeAfterSliderProps {
  beforeUrl: string;
  afterUrl: string;
  beforeLabel?: string;
  afterLabel?: string;
  height?: number;
  improvementPct?: number;
}

export default function BeforeAfterSlider({
  beforeUrl,
  afterUrl,
  beforeLabel = 'Before',
  afterLabel = 'After',
  height = 280,
  improvementPct,
}: BeforeAfterSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [mode, setMode] = useState<'slider' | 'side'>('slider');

  const download = async (url: string, name: string) => {
    try {
      const res = await fetch(url, { mode: 'cors' });
      const blob = await res.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = name;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch {
      window.open(url, '_blank');
    }
  };

  const updateFromClientX = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.max(0, Math.min(100, pct)));
  }, []);

  useEffect(() => {
    if (!isDragging) return;
    const handleMove = (e: MouseEvent | TouchEvent) => {
      const x = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      updateFromClientX(x);
    };
    const handleUp = () => setIsDragging(false);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchend', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchend', handleUp);
    };
  }, [isDragging, updateFromClientX]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 text-[11px]">
          <button
            onClick={() => setMode('slider')}
            className={`px-2 py-1 rounded-md flex items-center gap-1 ${mode === 'slider' ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <ArrowLeftRight className="w-3 h-3" /> Slider
          </button>
          <button
            onClick={() => setMode('side')}
            className={`px-2 py-1 rounded-md flex items-center gap-1 ${mode === 'side' ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Columns2 className="w-3 h-3" /> Side-by-side
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => download(beforeUrl, 'before.jpg')}
            className="px-2 py-1 rounded-md text-[11px] flex items-center gap-1 text-muted-foreground hover:text-foreground"
            title="Download before"
          >
            <Download className="w-3 h-3" /> Before
          </button>
          <button
            onClick={() => download(afterUrl, 'after.jpg')}
            className="px-2 py-1 rounded-md text-[11px] flex items-center gap-1 text-muted-foreground hover:text-foreground"
            title="Download after"
          >
            <Download className="w-3 h-3" /> After
          </button>
        </div>
      </div>

      {mode === 'side' ? (
        <div className="grid grid-cols-2 gap-2" style={{ height }}>
          <div className="relative rounded-xl overflow-hidden border border-white/10 bg-black">
            <img src={beforeUrl} alt={beforeLabel} className="w-full h-full object-cover" />
            <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur text-[10px] font-semibold tracking-wide text-white uppercase">{beforeLabel}</div>
          </div>
          <div className="relative rounded-xl overflow-hidden border border-white/10 bg-black">
            <img src={afterUrl} alt={afterLabel} className="w-full h-full object-cover" />
            <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur text-[10px] font-semibold tracking-wide text-white uppercase">{afterLabel}</div>
            {improvementPct !== undefined && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-full bg-success/90 text-success-foreground text-[11px] font-bold shadow-lg">
                Damage reduced by {improvementPct}%
              </div>
            )}
          </div>
        </div>
      ) : (
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden rounded-xl border border-white/10 bg-black select-none cursor-ew-resize"
        style={{ height }}
        onMouseDown={(e) => {
          setIsDragging(true);
          updateFromClientX(e.clientX);
        }}
        onTouchStart={(e) => {
          setIsDragging(true);
          updateFromClientX(e.touches[0].clientX);
        }}
      >
        {/* After image (full background) */}
        <img
          src={afterUrl}
          alt={afterLabel}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          draggable={false}
        />
        {/* Before image (clipped) */}
        <div
          className="absolute inset-0 overflow-hidden pointer-events-none"
          style={{ width: `${position}%` }}
        >
          <img
            src={beforeUrl}
            alt={beforeLabel}
            className="absolute inset-0 h-full object-cover"
            style={{ width: `${(100 / position) * 100}%`, maxWidth: 'none' }}
            draggable={false}
          />
        </div>

        {/* Labels */}
        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur text-[10px] font-semibold tracking-wide text-white uppercase">
          {beforeLabel}
        </div>
        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur text-[10px] font-semibold tracking-wide text-white uppercase">
          {afterLabel}
        </div>

        {improvementPct !== undefined && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-full bg-success/90 text-success-foreground text-[11px] font-bold shadow-lg"
          >
            Damage reduced by {improvementPct}%
          </motion.div>
        )}

        {/* Slider line */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white/90 pointer-events-none"
          style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
        />
        {/* Handle */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white shadow-xl flex items-center justify-center pointer-events-none"
          style={{ left: `${position}%`, transform: 'translate(-50%, -50%)' }}
        >
          <ArrowLeftRight className="w-4 h-4 text-primary" />
        </div>
      </div>
      )}
      {mode === 'slider' && (
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>← Drag the slider to compare →</span>
          <span className="font-mono">{Math.round(position)}%</span>
        </div>
      )}
    </div>
  );
}
