import React, { useState, useRef, useEffect } from 'react';
import { Send, Smile, Image as ImageIcon, Paperclip, Palette } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { useAppStore } from '../../lib/store';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

const COLORS = [
  '#ef4444', '#f97316', '#eab308', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899',
  '#000000', '#ffffff', '#94a3b8'
];
const BAD_WORDS = [
  'كس', 'طيز', 'زب', 'خول', 'شرموط', 'متناك', 'قحبة', 'منيوك', 'عرص', 'ديوث',
  'ياضين', 'لبوة', 'لبوه', 'كسمك', 'مكالمة كنسل', 'ابن الكلب', 'يا وسخ', 'يا زبالة',
  'يا كلب', 'لحس', 'مص', 'نكاح', 'سكس', 'نيك', 'تناك', 'شراميط', 'مناييك', 'انيكك',
  'كس اختك', 'طيزك', 'يا حيوان', 'يا حمار', 'يا بقرة', 'يا اهبل', 'يا غبي', 'تفو',
  'قذر', 'واطي', 'سافل', 'منحط', 'حقير', 'يا جزمة', 'يا فاشل', 'يا زفت'
];

const filterText = (input: string) => {
  let filtered = input;
  BAD_WORDS.forEach(word => {
    const reg = new RegExp(word.split('').join('+[\\s\\._\\-*]*'), 'gi');
    filtered = filtered.replace(reg, (match) => '*'.repeat(match.length));
  });
  return filtered;
};

interface Props {
  onSend: (text: string, type?: 'text' | 'image' | 'file') => void;
}

export default function MessageInput({ onSend }: Props) {
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [showFontSettings, setShowFontSettings] = useState(false);
  const { currentUser, setCurrentUser } = useAppStore();

  const pickerRef = useRef<HTMLDivElement>(null);
  const fontRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowEmoji(false);
      }
      if (fontRef.current && !fontRef.current.contains(event.target as Node)) {
        setShowFontSettings(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (currentUser.is_muted) {
      if (currentUser.muted_until) {
        if (new Date(currentUser.muted_until) > new Date()) {
          const remaining = Math.ceil(
            (new Date(currentUser.muted_until).getTime() - Date.now()) / 1000
          );
          toast.error(`أنت مكتوم. متبقي ${remaining} ثانية`);
          return;
        } else {
          setCurrentUser({ ...currentUser, is_muted: false, muted_until: null });
        }
      } else {
        toast.error('أنت مكتوم نهائياً من الكتابة بواسطة الإدارة.');
        return;
      }
    }

    if (text.trim()) {
      const input = text.trim();

      const phoneRegex = /(\+?[\d\u0660-\u0669][\d\u0660-\u0669\s\-]{7,}[\d\u0660-\u0669])/g;
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

      if (phoneRegex.test(input) || emailRegex.test(input)) {
        toast.error('🚫 ممنوع تداول ارقام التليفونات او الايميلات!', { duration: 5000 });

        const muteUntil = new Date(Date.now() + 2 * 60 * 1000).toISOString();
        const updatedUser = { ...currentUser, is_muted: true, muted_until: muteUntil };

        setCurrentUser(updatedUser);
        await supabase
          .from('user_profiles')
          .update({ is_muted: true, muted_until: muteUntil })
          .eq('id', currentUser.id);

        setText('');
        return;
      }

      const cleanText = filterText(input);
      if (cleanText !== input) {
        toast.error('تم حجب كلمات غير لائقة');
      }

      onSend(cleanText);
      setText('');
    }
  };

  const updateFontSettings = async (updates: Partial<typeof currentUser>) => {
    if (!currentUser) return;
    const newUser = { ...currentUser, ...updates };
    setCurrentUser(newUser);
    
    // Save to supabase
    await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', currentUser.id);
  };

  return (
    <div className="relative max-w-4xl mx-auto w-full">
      {showEmoji && (
        <div ref={pickerRef} className="absolute bottom-full right-0 mb-2 z-50">
          <EmojiPicker onEmojiClick={(e) => setText(text + e.emoji)} />
        </div>
      )}

      <input type="file" ref={imageRef} className="hidden" />
      <input type="file" ref={fileRef} className="hidden" />

      {showFontSettings && (
        <div ref={fontRef} className="absolute bottom-full left-14 mb-2 z-50 bg-white dark:bg-dark-800 rounded-xl shadow-xl p-3 border border-gray-100 dark:border-dark-700 w-64">
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-gray-500 mb-2 block">اللون</label>
              <div className="flex flex-wrap gap-1.5">
                {COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => updateFontSettings({ font_color: color })}
                    className={`w-6 h-6 rounded-full border-2 ${currentUser?.font_color === color ? 'border-primary-500 scale-110' : 'border-transparent text-shadow-sm'} shadow-sm`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs font-bold text-gray-500 mb-2 block">الحجم</label>
                <div className="flex bg-gray-100 dark:bg-dark-700 rounded-lg p-1">
                  {['small', 'normal', 'large'].map(size => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => updateFontSettings({ font_size: size as any })}
                      className={`flex-1 py-1 text-xs rounded-md ${currentUser?.font_size === size ? 'bg-white dark:bg-dark-600 shadow-sm' : ''}`}
                    >
                      {size === 'small' ? 'صغير' : size === 'large' ? 'كبير' : 'عادي'}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex-1">
                <label className="text-xs font-bold text-gray-500 mb-2 block">السمك</label>
                <div className="flex bg-gray-100 dark:bg-dark-700 rounded-lg p-1">
                  {['normal', 'bold'].map(weight => (
                    <button
                      key={weight}
                      type="button"
                      onClick={() => updateFontSettings({ font_weight: weight as any })}
                      className={`flex-1 py-1 text-xs rounded-md ${currentUser?.font_weight === weight ? 'bg-white dark:bg-dark-600 shadow-sm' : ''} ${weight === 'bold' ? 'font-bold' : ''}`}
                    >
                      {weight === 'bold' ? 'عريض' : 'عادي'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-end gap-2 p-2 bg-gray-50 dark:bg-dark-800 rounded-2xl border border-gray-200 dark:border-dark-700 shadow-sm">

        <button type="button" onClick={() => setShowEmoji(!showEmoji)} className="p-2.5 text-gray-500 hover:text-primary-500 transition-colors">
          <Smile className="w-6 h-6" />
        </button>
        
        <button type="button" onClick={() => setShowFontSettings(!showFontSettings)} className={`p-2.5 transition-colors ${showFontSettings ? 'text-primary-500' : 'text-gray-500 hover:text-primary-500'}`}>
          <Palette className="w-6 h-6" />
        </button>

        <textarea
          className="flex-1 bg-transparent border-0 p-2 min-h-[44px] max-h-32 resize-none focus:ring-0 text-gray-900 dark:text-white scrollbar-thin format-rtl"
          style={{
            color: currentUser?.font_color || undefined,
            fontSize:
              currentUser?.font_size === 'large'
                ? '1.25rem'
                : currentUser?.font_size === 'small'
                  ? '0.875rem'
                  : '1rem',
            fontWeight: currentUser?.font_weight === 'bold' ? 'bold' : 'normal'
          }}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          placeholder={
            currentUser?.is_muted
              ? (currentUser?.muted_until &&
                new Date(currentUser.muted_until) > new Date()
                ? "أنت مكتوم مؤقتاً..."
                : "أنت مكتوم")
              : "اكتب رسالتك..."
          }
          disabled={
            currentUser?.is_muted &&
            (!currentUser?.muted_until ||
              new Date(currentUser.muted_until) > new Date())
          }
          dir="auto"
        />

        <button type="submit" disabled={!text.trim()} className="p-2.5 text-white bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:hover:bg-primary-500 rounded-xl transition-colors">
          <Send className="w-5 h-5 rtl:-scale-x-100" />
        </button>

      </form>
    </div>
  );
}