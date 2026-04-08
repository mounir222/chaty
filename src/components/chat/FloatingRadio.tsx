import { useState, useEffect, useRef } from 'react';
import { Radio, X, Play, Pause, GripHorizontal, RotateCcw } from 'lucide-react';
import { useAppStore } from '../../lib/store';
import { supabase } from '../../lib/supabase';
import { clsx } from 'clsx';
import type { RadioStation } from '../../lib/types';

export default function FloatingRadio() {
  const { siteSettings } = useAppStore();
  const [radios, setRadios] = useState<RadioStation[]>([]);
  const [currentRadio, setCurrentRadio] = useState<RadioStation | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [isOpen, setIsOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Dragging state
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const adminPosition = (siteSettings as any)?.radio_position || 'bottom-right';

  useEffect(() => {
    supabase.from('radios').select('*').then(({ data }) => {
      if (data && data.length > 0) {
        setRadios(data);
        setCurrentRadio(data[0]);
      }
    });
  }, []);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  // Drag handlers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      setDragPos({ x: e.clientX - dragOffset.current.x, y: e.clientY - dragOffset.current.y });
    };
    const handleMouseUp = () => { isDragging.current = false; };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleDragStart = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    isDragging.current = true;
    const rect = containerRef.current.getBoundingClientRect();
    dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    e.preventDefault();
  };

  const resetPosition = () => setDragPos(null);

  if (adminPosition === 'hidden' || radios.length === 0) return null;

  const togglePlay = () => {
    if (!audioRef.current || !currentRadio) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(e => console.error('Playback blocked', e));
    }
    setIsPlaying(!isPlaying);
  };

  // Position as inline style (supports dragging + admin presets)
  const getPositionStyle = (): React.CSSProperties => {
    if (dragPos) return { left: dragPos.x, top: dragPos.y, right: 'auto', bottom: 'auto' };
    const posMap: Record<string, React.CSSProperties> = {
      'bottom-right':  { bottom: 24, right: 24 },
      'bottom-left':   { bottom: 24, left: 24 },
      'bottom-center': { bottom: 24, left: '50%', transform: 'translateX(-50%)' },
      'top-right':     { top: 80, right: 24 },
      'top-left':      { top: 80, left: 24 },
      'center-right':  { top: '50%', right: 24, transform: 'translateY(-50%)' },
      'center-left':   { top: '50%', left: 24, transform: 'translateY(-50%)' },
    };
    return posMap[adminPosition] || { bottom: 24, right: 24 };
  };

  return (
    <div
      ref={containerRef}
      className="fixed z-50 select-none"
      style={getPositionStyle()}
    >
      {isOpen ? (
        <div className="bg-white dark:bg-dark-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-dark-700 w-72 animate-in slide-in-from-bottom-4 duration-300 overflow-hidden">
          {/* Drag Handle */}
          <div
            className="flex items-center justify-center w-full py-2 bg-gray-50 dark:bg-dark-900 cursor-grab active:cursor-grabbing border-b border-gray-100 dark:border-dark-700 group"
            onMouseDown={handleDragStart}
            title="اسحب لتحريك الراديو"
          >
            <GripHorizontal className="w-5 h-5 text-gray-300 dark:text-dark-500 group-hover:text-primary-400 transition-colors" />
          </div>

          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-white">
                  <Radio className="w-4 h-4 animate-pulse" />
                </div>
                <span className="font-bold text-sm">الراديو</span>
              </div>
              <div className="flex gap-1">
                {dragPos && (
                  <button onClick={resetPosition} className="p-1 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-full" title="إعادة الموضع الأصلي">
                    <RotateCcw className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                )}
                <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-full">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-dark-900 rounded-2xl p-4 mb-4 text-center">
              <h4 className="font-black text-primary-600 dark:text-primary-400 mb-1">{currentRadio?.name}</h4>
              <p className="text-[10px] text-gray-400">بث مباشر الآن</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={togglePlay}
                className="w-12 h-12 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl flex items-center justify-center shadow-lg transition-transform active:scale-95"
              >
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 fill-current" />}
              </button>
              <div className="flex-1 space-y-1">
                <div className="flex justify-between text-[10px] font-bold text-gray-400">
                  <span>الصوت</span>
                  <span>{Math.round(volume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-full accent-primary-600 h-1.5"
                />
              </div>
            </div>

            {radios.length > 1 && (
              <div className="mt-4 flex gap-1 overflow-x-auto pb-1">
                {radios.map(r => (
                  <button
                    key={r.id}
                    onClick={() => { setCurrentRadio(r); setIsPlaying(false); }}
                    className={clsx(
                      'px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap transition-colors',
                      currentRadio?.id === r.id ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-dark-700 text-gray-500'
                    )}
                  >
                    {r.name}
                  </button>
                ))}
              </div>
            )}

            <audio
              ref={audioRef}
              src={currentRadio?.url}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-1">
          {/* Mini drag handle above button */}
          <div
            className="w-8 h-2.5 bg-gray-200 dark:bg-dark-600 rounded-full cursor-grab active:cursor-grabbing flex items-center justify-center opacity-50 hover:opacity-100 transition-opacity shadow-sm border border-gray-300 dark:border-dark-500"
            onMouseDown={handleDragStart}
            title="اسحب لتحريك الراديو"
          >
            <GripHorizontal className="w-4 h-2 text-gray-400" />
          </div>
          <button
            onClick={() => setIsOpen(true)}
            className="w-14 h-14 bg-purple-600 hover:bg-purple-700 text-white rounded-full flex items-center justify-center shadow-2xl transition-all hover:scale-110 active:scale-95 relative"
          >
            <Radio className={clsx('w-6 h-6', isPlaying && 'animate-spin')} />
            {isPlaying && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
              </span>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
