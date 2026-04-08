import { useState, useEffect } from 'react';
import { Lock, Award, MessageSquare, LogOut, Settings } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppStore } from '../../lib/store';
import { clsx } from 'clsx';
import type { ChatRoom, Ad } from '../../lib/types';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

export default function Sidebar() {
  const { isSidebarOpen, activeRoom, setActiveRoom, currentUser, setCurrentUser, unreadMessages, setUnreadMessage, siteSettings, joinRoom } = useAppStore();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [sidebarAd, setSidebarAd] = useState<Ad | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoomData, setNewRoomData] = useState({ name: '', icon: '🌟' });
  const navigate = useNavigate();

  useEffect(() => {
    supabase.from('chat_rooms').select('*').then(({ data }) => {
      if (data) {
        setRooms(data);
        if (!activeRoom && data.length > 0) {
          setActiveRoom(data[0]);
        }
      }
    });
    supabase.from('ads').select('*').eq('active', true).eq('position', 'sidebar').limit(1).maybeSingle().then(({ data }) => data && setSidebarAd(data));
  }, [activeRoom, setActiveRoom]);

  return (
    <aside className={clsx(
      "fixed lg:static top-16 right-0 h-[calc(100vh-4rem)] bg-white dark:bg-dark-800 border-l border-gray-200 dark:border-dark-700 w-64 flex flex-col transition-transform duration-300 z-20",
      isSidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
    )}>
      <div className="p-4 flex-1 overflow-y-auto">
        <h2 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4 px-2">
          الغرف المتاحة
        </h2>
        <div className="space-y-1">
          {rooms.map((room) => (
            <button
              key={room.id}
              onClick={() => joinRoom(room)}
              className={clsx(
                "w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all group",
                activeRoom?.id === room.id 
                  ? "bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-500 shadow-sm" 
                  : "hover:bg-gray-50 dark:hover:bg-dark-700 text-gray-700 dark:text-gray-300"
              )}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl group-hover:scale-110 transition-transform">{room.icon}</span>
                <span className="font-bold text-sm">{room.name}</span>
              </div>
              {room.type === 'private' && <Lock className="w-3.5 h-3.5 opacity-50" />}
              {room.creator_id === currentUser?.id && <Award className="w-3.5 h-3.5 text-amber-500" />}
            </button>
          ))}
          
          {currentUser && !currentUser.username.startsWith('زائر_') && (
            <button 
              onClick={() => setShowCreateModal(true)}
              className="w-full mt-4 flex items-center justify-center gap-2 py-3 border-2 border-dashed border-primary-200 dark:border-primary-800 rounded-2xl text-primary-600 dark:text-primary-400 font-bold hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-all text-xs"
            >
              + إنشاء غرفتي الخاصة
            </button>
          )}

          {/* Create Room Modal */}
          {showCreateModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-white dark:bg-dark-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl scale-in-center overflow-hidden border border-gray-100 dark:border-dark-700">
                <h3 className="text-lg font-black mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                   <div className="p-2 bg-primary-50 dark:bg-primary-900/30 rounded-xl">🌟</div>
                   إنشاء غرفة جديدة
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5 px-1 text-right">اسم الغرفة</label>
                    <input 
                      type="text" 
                      value={newRoomData.name} 
                      onChange={(e) => setNewRoomData({...newRoomData, name: e.target.value})}
                      placeholder="مثلاً: غرفة الأصدقاء"
                      className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-dark-900 border-none ring-1 ring-gray-200 dark:ring-dark-700 focus:ring-2 focus:ring-primary-500 transition-all font-bold text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5 px-1 text-right">أيقونة الغرفة</label>
                    <div className="grid grid-cols-5 gap-2">
                       {['🌟','🏠','⚡','❤️','🎮','🎵','📱','💎','🎨','⚽'].map(icon => (
                         <button 
                           key={icon}
                           onClick={() => setNewRoomData({...newRoomData, icon})}
                           className={clsx(
                             "w-10 h-10 flex items-center justify-center rounded-xl text-lg transition-all",
                             newRoomData.icon === icon ? "bg-primary-500 text-white shadow-lg scale-110" : "bg-gray-100 dark:bg-dark-700 hover:bg-gray-200"
                           )}
                         >
                           {icon}
                         </button>
                       ))}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button 
                      onClick={async () => {
                        if (!newRoomData.name.trim()) return toast.error('يرجى كتابة اسم للغرفة');
                        const { data, error } = await supabase.from('chat_rooms').insert([{
                          name: newRoomData.name,
                          icon: newRoomData.icon,
                          type: 'public',
                          creator_id: currentUser?.id
                        }]).select().single();
                        
                        if (error) {
                          toast.error('فشل إنشاء الغرفة');
                        } else {
                          toast.success('تم إنشاء الغرفة بنجاح');
                          setRooms(prev => [...prev, data]);
                          joinRoom(data);
                          
                          // Send welcome message for specific room join
                          await supabase.from('messages').insert([{
                            user_id: currentUser?.id,
                            room_id: data.id,
                            content: `👋 أهلاً بك [${currentUser.username}] في غرفتك الجديدة!`,
                            type: 'system'
                          }]);
                          
                          setShowCreateModal(false);
                          setNewRoomData({ name: '', icon: '🌟' });
                        }
                      }}
                      className="flex-1 btn-primary !py-3 rounded-2xl text-xs"
                    >إنشاء</button>
                    <button 
                      onClick={() => setShowCreateModal(false)}
                      className="flex-1 px-4 py-3 bg-gray-100 dark:bg-dark-700 rounded-2xl text-xs font-bold text-gray-500 hover:bg-gray-200 transition-all"
                    >إلغاء</button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        <div className="mt-8">
           <h2 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4 px-2">
            مساحة إعلانية
          </h2>
          {(siteSettings as any)?.sidebar_vip_enabled !== false || sidebarAd ? (
            sidebarAd ? (
              sidebarAd.ad_code ? (
                <div 
                  className="w-full overflow-hidden rounded-xl"
                  dangerouslySetInnerHTML={{ __html: sidebarAd.ad_code }}
                />
              ) : (
                <a href={sidebarAd.link} target="_blank" rel="noreferrer" className="block w-full rounded-2xl overflow-hidden shadow-md border border-gray-100 dark:border-dark-700 hover:shadow-xl hover:-translate-y-1 transition-all">
                  <img src={sidebarAd.image} alt={sidebarAd.title} className="w-full h-auto object-cover" />
                </a>
              )
            ) : (
              <div className="bg-gray-50 dark:bg-dark-900/50 rounded-2xl p-6 text-center border-2 border-dashed border-gray-200 dark:border-dark-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-dark-800 transition-all">
                <span className="text-[10px] font-black text-primary-500 block mb-3 uppercase tracking-widest">
                  {(siteSettings as any)?.sidebar_vip_text || 'إعلان مميز'}
                </span>
                <div className="w-12 h-12 bg-white dark:bg-dark-700 rounded-2xl mb-3 flex items-center justify-center mx-auto shadow-sm">
                   <Award className="w-6 h-6 text-amber-500" />
                </div>
                <p className="text-sm font-black text-gray-900 dark:text-white">
                  {(siteSettings as any)?.sidebar_vip_title || 'اشترك في VIP'}
                </p>
                <p className="text-[10px] text-gray-500 mt-1">
                  {(siteSettings as any)?.sidebar_vip_subtext || 'واحصل على اسم ملون'}
                </p>
              </div>
            )
          ) : null}
        </div>
      </div>

      {/* User Section at the Bottom */}
      {currentUser && (
        <div className="flex-none p-4 bg-gray-50 dark:bg-dark-900 border-t border-gray-200 dark:border-dark-700 space-y-4">
           <div className="flex items-center justify-between">
              <Link to="/profile" className="flex items-center gap-3 group">
                 <div className="w-10 h-10 rounded-2xl bg-primary-600 flex items-center justify-center text-white ring-2 ring-white dark:ring-dark-800 shadow-lg group-hover:scale-105 transition-all overflow-hidden font-black">
                    {currentUser.avatar ? <img src={currentUser.avatar} className="w-full h-full object-cover" alt="" /> : currentUser.username.slice(0, 1).toUpperCase()}
                 </div>
                 <div className="flex flex-col">
                    <span className="text-xs font-black text-gray-900 dark:text-white group-hover:text-primary-500 transition-colors truncate w-24">{currentUser.username}</span>
                    <span className="text-[9px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest">{currentUser.role}</span>
                 </div>
              </Link>
              
              <div className="flex items-center gap-1">
                 <div className="relative">
                    <button 
                      onClick={() => {
                        if (unreadMessages.length > 0) {
                           const lastSenderId = unreadMessages[unreadMessages.length - 1];
                           setActiveRoom({ id: lastSenderId, name: 'رسالة جديدة', type: 'private', icon: '💬', description: '', created_at: '' });
                           setUnreadMessage(lastSenderId, true);
                        } else {
                           toast.success('لا توجد رسائل جديدة');
                        }
                      }}
                      className="p-2.5 bg-white dark:bg-dark-800 rounded-2xl border border-gray-200 dark:border-dark-700 text-gray-500 hover:text-primary-500 transition-all shadow-sm"
                    >
                       <MessageSquare className="w-5 h-5" />
                    </button>
                    {unreadMessages.length > 0 && (
                       <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white dark:border-dark-900 shadow-lg animate-bounce">
                          {unreadMessages.length}
                       </span>
                    )}
                 </div>
              </div>
           </div>
           
           <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={async () => {
                   try {
                     if (currentUser && activeRoom) {
                        await supabase.from('messages').insert([{
                          user_id: currentUser.id,
                          room_id: activeRoom.id,
                          content: `🚪 غادر العضو [${currentUser.username}]، نراك قريباً! 👋`,
                          type: 'system'
                        }]);
                     }
                     if (currentUser?.role === 'User' && currentUser.username.startsWith('زائر_')) {
                        await supabase.from('user_profiles').delete().eq('id', currentUser.id);
                     } else {
                        await supabase.auth.signOut();
                     }
                   } catch(e) { console.error('Logout error:', e); }
                   setCurrentUser(null);
                   navigate('/login');
                }}
                className="flex items-center justify-center gap-2 py-2.5 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 rounded-xl text-xs font-black hover:bg-red-600 hover:text-white transition-all shadow-sm"
              >
                 <LogOut className="w-4 h-4" /> خروج
              </button>
              <button 
                onClick={() => navigate('/admin')}
                className={clsx(
                  "flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all shadow-sm",
                  (currentUser.role === 'Admin' || currentUser.role === 'Super')
                    ? "bg-amber-50 dark:bg-amber-900/10 text-amber-600 dark:text-amber-500 hover:bg-amber-500 hover:text-white"
                    : "hidden"
                )}
              >
                 <Settings className="w-4 h-4" /> الإدارة
              </button>
           </div>
        </div>
      )}
    </aside>
  );
}
