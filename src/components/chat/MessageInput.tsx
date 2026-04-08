import React, { useState, useRef, useEffect } from 'react';
import { Send, Smile, Image as ImageIcon, Paperclip, Mic, Palette, Square } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { useAppStore } from '../../lib/store';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';

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
    // Create a regex that looks for the word, allowing for some variations
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
      if (currentUser.mute_until) {
        if (new Date(currentUser.mute_until) > new Date()) {
          const remaining = Math.ceil((new Date(currentUser.mute_until).getTime() - new Date().getTime()) / 1000);
          toast.error(`أنت مكتوم. متبقي ${remaining} ثانية`);
          return;
        } else {
          setCurrentUser({ ...currentUser, is_muted: false, mute_until: null });
        }
      } else {
        toast.error('أنت مكتوم نهائياً من الكتابة بواسطة الإدارة.');
        return;
      }
    }

    if (text.trim()) {
      const input = text.trim();
      
      // 1. Check for Phone Numbers (Detects various formats)
      const phoneRegex = /(\+?[\d\u0660-\u0669][\d\u0660-\u0669\s\-]{7,}[\d\u0660-\u0669])/g;
      // 2. Check for Emails
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

      if (phoneRegex.test(input) || emailRegex.test(input)) {
        toast.error('🚫 ممنوع تداول ارقام التليفونات او الايميلات على العام!', { duration: 5000 });
        
        // AUTO-MUTE for 2 minutes
        const muteUntil = new Date(Date.now() + 2 * 60 * 1000).toISOString();
        const updatedUser = { ...currentUser, is_muted: true, mute_until: muteUntil };
        
        setCurrentUser(updatedUser);
        await supabase.from('user_profiles').update({ is_muted: true, mute_until: muteUntil }).eq('id', currentUser.id);
        
        setText('');
        return;
      }

      const cleanText = filterText(input);
      if (cleanText !== input) {
        toast.error('تم حجب كلمات غير لائقة في رسالتك');
      }
      
      onSend(cleanText);
      setText('');
    }
  };

  return (
    <div className="relative max-w-4xl mx-auto w-full">
      {showEmoji && (
        <div ref={pickerRef} className="absolute bottom-full right-0 mb-2 z-50 shadow-2xl rounded-2xl overflow-hidden border border-gray-100 dark:border-dark-700">
           <div className="bg-white dark:bg-dark-800 rounded-2xl">
             <EmojiPicker onEmojiClick={(emojiData) => setText(text + emojiData.emoji)} />
           </div>
        </div>
      )}

      {showFontSettings && currentUser && (
        <div ref={fontRef} className="absolute bottom-full right-12 mb-2 z-50 w-64 bg-white dark:bg-dark-800 shadow-2xl rounded-2xl border border-gray-100 dark:border-dark-700 p-4">
          <h4 className="font-bold text-sm mb-3 text-gray-700 dark:text-gray-300">تنسيق الخط</h4>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">لون الخط</label>
              <input 
                type="color" 
                value={currentUser.font_color || '#000000'} 
                onChange={(e) => { setCurrentUser({ ...currentUser, font_color: e.target.value }); supabase.from('user_profiles').update({ font_color: e.target.value }).eq('id', currentUser.id); }}
                className="w-full h-8 rounded cursor-pointer"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">حجم الخط</label>
              <div className="flex gap-2">
                {['small', 'medium', 'large'].map(size => (
                  <button 
                    key={size}
                    type="button"
                    onClick={() => { setCurrentUser({ ...currentUser, font_size: size as any }); supabase.from('user_profiles').update({ font_size: size }).eq('id', currentUser.id); }}
                    className={`flex-1 py-1 rounded text-xs border ${currentUser.font_size === size ? 'bg-primary-50 border-primary-500 text-primary-600' : 'border-gray-200 dark:border-dark-600 text-gray-600 dark:text-gray-400'}`}
                  >
                    {size === 'small' ? 'صغير' : size === 'medium' ? 'عادي' : 'كبير'}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="boldCheck"
                checked={currentUser.font_weight === 'bold'}
                onChange={(e) => { const w = e.target.checked ? 'bold' : 'normal'; setCurrentUser({ ...currentUser, font_weight: w }); supabase.from('user_profiles').update({ font_weight: w }).eq('id', currentUser.id); }}
              />
              <label htmlFor="boldCheck" className="text-sm font-bold cursor-pointer">خط عريض (Bold)</label>
            </div>
          </div>
        </div>
      )}
      
      <input type="file" accept="image/*" ref={imageRef} className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) onSend(URL.createObjectURL(file), 'image'); }} />
      <input type="file" ref={fileRef} className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) onSend(file.name, 'file'); }} />

      <form onSubmit={handleSubmit} className="flex items-end gap-2 bg-gray-50 dark:bg-dark-800 p-2 rounded-2xl border border-gray-200 dark:border-dark-700 shadow-sm focus-within:border-primary-500 dark:focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500 transition-all">
        <button type="button" className="p-3 text-gray-400 hover:text-primary-500 transition-colors shrink-0" onClick={() => setShowEmoji(!showEmoji)}>
          <Smile className="w-6 h-6" />
        </button>
        <button type="button" className={`p-3 transition-colors shrink-0 ${showFontSettings ? 'text-primary-500' : 'text-gray-400 hover:text-primary-500'}`} onClick={() => setShowFontSettings(!showFontSettings)}>
          <Palette className="w-6 h-6" />
        </button>
        <button type="button" className="p-3 text-gray-400 hover:text-primary-500 transition-colors shrink-0 hidden sm:block" onClick={() => imageRef.current?.click()}>
          <ImageIcon className="w-6 h-6" />
        </button>
        <button type="button" className="p-3 text-gray-400 hover:text-primary-500 transition-colors shrink-0 hidden sm:block" onClick={() => fileRef.current?.click()}>
          <Paperclip className="w-6 h-6" />
        </button>
        
        <textarea
          style={{ color: currentUser.font_color || undefined, fontSize: currentUser.font_size === 'large' ? '1.25rem' : currentUser.font_size === 'small' ? '0.875rem' : '1rem', fontWeight: currentUser.font_weight === 'bold' ? 'bold' : 'normal' }}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={
            currentUser.is_muted
              ? (currentUser.mute_until && new Date(currentUser.mute_until) > new Date() ? "أنت مكتوم مؤقتاً... حاول لاحقاً" : "أنت مكتوم من الكتابة بواسطة الإدارة")
              : "اكتب رسالتك هنا..."
          }
          disabled={currentUser.is_muted && (!currentUser.mute_until || new Date(currentUser.mute_until) > new Date())}
          className={`w-full bg-transparent border-none focus:ring-0 resize-none max-h-32 py-3 px-2 text-gray-800 dark:text-gray-100 placeholder-gray-400 min-h-[48px] ${currentUser.is_muted && currentUser.mute_until && new Date(currentUser.mute_until) > new Date() ? 'opacity-50 cursor-not-allowed' : 'cursor-text'}`}
          rows={1}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />
        
        {text.trim() && (
          <button type="submit" className="p-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl transition-all shadow-md shadow-primary-500/20 shrink-0 mb-0.5">
            <Send className="w-5 h-5 rtl:-scale-x-100" />
          </button>
        )}
      </form>
    </div>
  );
}
