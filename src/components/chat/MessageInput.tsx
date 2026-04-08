import React, { useState, useRef, useEffect } from 'react';
import { Send, Smile, Image as ImageIcon, Paperclip, Palette } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { useAppStore } from '../../lib/store';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

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

  return (
    <div className="relative max-w-4xl mx-auto w-full">
      {showEmoji && (
        <div ref={pickerRef} className="absolute bottom-full right-0 mb-2 z-50">
          <EmojiPicker onEmojiClick={(e) => setText(text + e.emoji)} />
        </div>
      )}

      <input type="file" ref={imageRef} className="hidden" />
      <input type="file" ref={fileRef} className="hidden" />

      <form onSubmit={handleSubmit} className="flex items-end gap-2 p-2">

        <button type="button" onClick={() => setShowEmoji(!showEmoji)}>
          <Smile />
        </button>

        <textarea
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
        />

        <button type="submit">
          <Send />
        </button>

      </form>
    </div>
  );
}