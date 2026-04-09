import { useState, useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import type { Message, Ad } from '../../lib/types';
import { useAppStore } from '../../lib/store';
import { Share2, Users, Megaphone, Edit2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

function AdFrame({ html }: { html: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  useEffect(() => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      const doc = iframeRef.current.contentWindow.document;
      doc.open();
      // Write HTML properly so external scripts (like Adsterra) can execute
      // Handle protocol-relative URLs (//...) which fail in an about:blank iframe
      const safeHtml = html
         .replace(/src=['"]\/\/([^'"]+)['"]/g, 'src="https://$1"')
         .replace(/href=['"]\/\/([^'"]+)['"]/g, 'href="https://$1"');
         
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { margin: 0; padding: 0; overflow: hidden; display: flex; justify-content: center; align-items: center; background: transparent; }
            </style>
          </head>
          <body>${safeHtml}</body>
        </html>
      `);
      doc.close();
    }
  }, [html]);

  return (
    <iframe 
      ref={iframeRef} 
      title="AdBanner" 
      style={{ width: '100%', height: '90px', border: 'none', overflow: 'hidden' }} 
      scrolling="no" 
      sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-same-origin"
    />
  );
}

export default function ChatBoard() {
  const { activeRoom, currentUser, siteSettings } = useAppStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [topAd, setTopAd] = useState<Ad | null>(null);
  const [bottomAd, setBottomAd] = useState<Ad | null>(null);
  const [roomTopic, setRoomTopic] = useState<string>('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const welcomedRoomRef = useRef<string | null>(null);

  useEffect(() => {
    if (!activeRoom || !currentUser) return;
    setRoomTopic(activeRoom.topic || '');

    const isPrivate = activeRoom.type === 'private';

    if (isPrivate) {
      supabase.from('private_messages')
        .select('*, sender:user_profiles!sender_id(*), receiver:user_profiles!receiver_id(*)')
        .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${activeRoom.id}),and(sender_id.eq.${activeRoom.id},receiver_id.eq.${currentUser.id})`)
        .order('created_at', { ascending: true })
        .limit(100)
        .then(({ data }) => {
          if (data) {
            const formatted = data.map(m => ({ ...m, profiles: m.sender }));
            setMessages(formatted as any);
          }
        });
    } else {
      // No historical fetch for public rooms. User starts with empty chat!
      setMessages([]);
    }

    const channelName = isPrivate ? `private-${currentUser.id}` : `room-${activeRoom.id}`;
    
    // Automatically send welcome message when entering a public room
    if (!isPrivate && welcomedRoomRef.current !== activeRoom.id) {
      welcomedRoomRef.current = activeRoom.id;
      supabase.from('messages').insert([{
        user_id: currentUser.id,
        room_id: activeRoom.id,
        content: `تم دخول العضو ${currentUser.username}`,
        type: 'system'
      }]).then();
    }

    const channel = supabase.channel(channelName)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: isPrivate ? 'private_messages' : 'messages',
        filter: isPrivate
          ? `receiver_id=eq.${currentUser.id}`
          : `room_id=eq.${activeRoom.id}`
      }, async (payload) => {
        const userId = isPrivate ? payload.new.sender_id : payload.new.user_id;
        const msgType = payload.new.type;
        
        let profile = null;
        if (msgType !== 'system' && userId) {
          try {
            const { data } = await supabase.from('user_profiles').select('*').eq('id', userId).single();
            profile = data;
          } catch(e) {}
        }
        
        const msgWithProfile = { ...payload.new, profiles: profile };
        
        if (isPrivate && (payload.new.sender_id === activeRoom.id || payload.new.sender_id === currentUser.id)) {
          setMessages(prev => [...prev, msgWithProfile as any]);
        } else if (!isPrivate) {
          if (msgType === 'system') {
            if (payload.new.content === 'RESTART_SIGNAL_ACTIVATE') {
               toast.error('🚨 الإدارة: جاري إعادة تشغيل الشات وتفريغ الرسائل...', { 
                 duration: 4000,
                 position: 'top-center',
                 style: { fontSize: '18px', padding: '24px', fontWeight: '900', border: '4px solid white', zIndex: 9999 }
               });
               return; // Don't add to list
            }
            toast(payload.new.content, { 
              icon: '📢', 
              position: 'top-center', 
              duration: 5000,
              style: { borderRadius: '20px', background: '#333', color: '#fff' }
            });
          }
          setMessages(prev => [...prev, msgWithProfile as any]);
        }
      })
      .subscribe();

    // Fetch ads
    supabase.from('ads').select('*').eq('active', true).eq('position', 'top').limit(1).maybeSingle().then(({ data }) => setTopAd(data));
    supabase.from('ads').select('*').eq('active', true).eq('position', 'sidebar').limit(1).maybeSingle().then(({ data }) => setBottomAd(data));

    // Room update listener for topics
    const roomChannel = supabase.channel(`room-update-${activeRoom.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chat_rooms', filter: `id=eq.${activeRoom.id}` }, (payload) => {
        if (payload.new.topic !== undefined) {
          setRoomTopic(payload.new.topic);
        }
      })
      .subscribe();

    return () => { 
      supabase.removeChannel(channel);
      supabase.removeChannel(roomChannel);
    };
  }, [activeRoom, currentUser]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!activeRoom) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 h-full">
        <div className="text-6xl mb-4">💬</div>
        <h2 className="text-2xl font-bold mb-2">مرحباً بك في الدردشة</h2>
        <p>اختر غرفة من القائمة للبدء في الدردشة</p>
      </div>
    );
  }

  const adEnabled = (siteSettings as any)?.ad_space_enabled;
  const adPos = (siteSettings as any)?.ad_space_position || 'top';
  const activeAd = adPos === 'bottom' ? bottomAd : topAd;

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-dark-900 shadow-[inset_0_0_20px_rgba(0,0,0,0.02)] dark:shadow-none">
      {/* Room Header */}
      <div className="h-16 flex-none px-6 flex items-center justify-between border-b border-gray-100 dark:border-dark-700 bg-white/50 dark:bg-dark-800/50 backdrop-blur-sm z-10 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center text-xl shadow-sm border border-primary-100 dark:border-primary-800/50">
            {activeRoom.icon}
          </div>
          <div>
            <h2 className="font-bold text-gray-800 dark:text-gray-100 text-lg flex items-center gap-2">
              {activeRoom.name}
              {roomTopic && <span className="text-[10px] bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 px-2 py-0.5 rounded-full font-black border border-primary-200 dark:border-primary-800 animate-pulse">توبيك: {roomTopic}</span>}
            </h2>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Users className="w-3 h-3" /> المتواجدون: {(window as any).onlineCount || 1}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {(['admin', 'moderator', 'super'].includes(currentUser?.role?.toLowerCase() || '')) && (
            <button 
              onClick={async () => {
                const newTopic = prompt('أدخل التوبيك الجديد للغرفة (اتركه فارغاً للحذف):', roomTopic);
                if (newTopic !== null) {
                  const { error } = await supabase
                    .from('chat_rooms')
                    .update({ topic: newTopic })
                    .eq('id', activeRoom.id);

                  if (error) {
                    console.error('Topic update error:', error);
                    toast.error(`فشل تحديث التوبيك: ${error.message}`);
                  } else {
                    toast.success('تم تحديث التوبيك بنجاح');
                    setRoomTopic(newTopic);
                  }
                }
              }}
              className="p-2 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg text-primary-500 transition-colors" 
              title="تعديل توبيك الغرفة"
            >
              <Edit2 className="w-5 h-5" />
            </button>
          )}
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg text-gray-500 transition-colors" title="مشاركة">
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* === AD BANNER (controlled from admin) === */}
      {adEnabled && activeAd && (
        <div className="flex-none border-b border-gray-100 dark:border-dark-700 bg-amber-50/60 dark:bg-amber-900/10">
          <div className="flex items-center gap-2 px-3 py-1 border-b border-amber-100 dark:border-amber-900/20">
            <Megaphone className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest">مساحة إعلانية</span>
          </div>
          <div className="p-3">
            {activeAd.ad_code ? (
              <div className="w-full flex justify-center overflow-hidden rounded-xl bg-white dark:bg-dark-800 border border-amber-100 dark:border-amber-900/30">
                <AdFrame html={activeAd.ad_code} />
              </div>
            ) : (
              <a href={activeAd.link} target="_blank" rel="noreferrer" className="block rounded-xl overflow-hidden border border-amber-200 dark:border-amber-900/30 shadow-sm hover:shadow-md transition cursor-pointer relative">
                <span className="absolute top-1 right-2 bg-black/50 text-white text-[9px] px-1.5 py-0.5 rounded backdrop-blur-md">إعلان ممول</span>
                {activeAd.image && <img src={activeAd.image} alt={activeAd.title} className="w-full h-auto object-cover max-h-28" />}
                {!activeAd.image && <div className="p-3 text-sm font-bold text-amber-800 dark:text-amber-300">{activeAd.title}</div>}
              </a>
            )}
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 flex flex-col min-h-0 bg-[url('/pattern.svg')] opacity-95 dark:opacity-100 bg-center">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        <div ref={bottomRef} className="h-px w-full" />
      </div>

      {/* Message Input */}
      <div className="flex-none p-4 bg-white dark:bg-dark-800 border-t border-gray-100 dark:border-dark-700">
        <MessageInput onSend={async (text, type = 'text') => {
          if (!currentUser || !activeRoom) return;

          if (activeRoom.type === 'private') {
            const { data: newMsg, error } = await supabase.from('private_messages').insert([{
              sender_id: currentUser.id,
              receiver_id: activeRoom.id,
              content: text
            }]).select('*, sender:user_profiles!sender_id(*)').single();

            if (error) {
              console.error(error);
              toast.error('فشل إرسال الرسالة الخاصة');
            } else if (newMsg) {
              setMessages(prev => [...prev, { ...newMsg, profiles: newMsg.sender } as any]);
            }
          } else {
            const { error } = await supabase.from('messages').insert([{
              user_id: currentUser.id,
              room_id: activeRoom.id,
              content: text,
              type: type
            }]);
            if (error) toast.error('فشل إرسال الرسالة');
          }
        }} />
      </div>
    </div>
  );
}
