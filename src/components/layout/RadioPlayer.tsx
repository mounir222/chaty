import { useState, useRef, useEffect } from 'react';
import { Radio as RadioIcon, Play, Square, ChevronUp, ChevronDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { RadioStation } from '../../lib/types';

export default function RadioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [stations, setStations] = useState<RadioStation[]>([]);
  const [currentStation, setCurrentStation] = useState<RadioStation | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    supabase.from('radios').select('*').eq('active', true).then(({ data }) => {
      if (data && data.length > 0) {
        setStations(data);
        setCurrentStation(data[0]);
      }
    });
  }, []);

  const toggleRadio = () => {
    if (!currentStation) return;
    if (isPlaying) {
      audioRef.current?.pause();
    } else {
      // Small timeout to allow src change if needed
      setTimeout(() => {
        audioRef.current?.play().catch(e => console.error("Radio error:", e));
      }, 50);
    }
    setIsPlaying(!isPlaying);
  };

  const changeStation = (station: RadioStation) => {
    setIsPlaying(false);
    if (audioRef.current) audioRef.current.pause();
    setCurrentStation(station);
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-4 left-4 z-50 flex flex-col gap-2">
      {isOpen && stations.length > 1 && (
        <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-dark-700 p-2 max-h-48 overflow-y-auto animate-fade-in divide-y divide-gray-100 dark:divide-dark-700">
          {stations.map(s => (
            <button 
              key={s.id} 
              onClick={() => changeStation(s)}
              className={`w-full text-right px-4 py-2 hover:bg-primary-50 dark:hover:bg-primary-900/20 text-sm font-medium transition-colors ${currentStation?.id === s.id ? 'text-primary-600' : 'text-gray-700 dark:text-gray-300'}`}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}
      
      <audio ref={audioRef} src={currentStation?.url} preload="none" key={currentStation?.id} />
      <div className={`bg-white dark:bg-dark-800 rounded-2xl shadow-xl shadow-gray-200/50 dark:shadow-black/50 border border-gray-200 dark:border-dark-700 p-2 flex items-center gap-3 transition-all ${isPlaying ? 'ring-2 ring-primary-500' : ''}`}>
        <button 
          onClick={toggleRadio}
          className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm transition-transform hover:scale-105 active:scale-95 ${isPlaying ? 'bg-red-500' : 'bg-primary-500'}`}
        >
          {isPlaying ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-1" />}
        </button>
        <div className="flex flex-col pr-2 pl-4 cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
          <span className="text-xs font-bold flex items-center gap-1 text-gray-800 dark:text-gray-200">
            <RadioIcon className={`w-4 h-4 ${isPlaying ? 'text-primary-500 animate-pulse' : 'text-gray-400'}`} />
            {currentStation?.name || 'الراديو'}
            {stations.length > 1 && (isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />)}
          </span>
          <span className="text-[10px] text-gray-500">{isPlaying ? 'بث مباشر الآن...' : 'متوقف'}</span>
        </div>
      </div>
    </div>
  );
}
