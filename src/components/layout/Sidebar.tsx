import { useState, useEffect } from 'react';
import { Lock, Award, MessageSquare, LogOut, Settings } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppStore } from '../../lib/store';
import { clsx } from 'clsx';
import type { ChatRoom, Ad } from '../../lib/types';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

export default function Sidebar() {
  const {
    isSidebarOpen,
    activeRoom,
    setActiveRoom,
    currentUser,
    setCurrentUser,
    unreadMessages,
    setUnreadMessage,
    siteSettings,
    joinRoom
  } = useAppStore();

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

    supabase
      .from('ads')
      .select('*')
      .eq('active', true)
      .eq('position', 'sidebar')
      .limit(1)
      .maybeSingle()
      .then(({ data }) => data && setSidebarAd(data));
  }, [activeRoom, setActiveRoom]);

  return (
    <aside
      className={clsx(
        "fixed lg:static top-16 right-0 h-[calc(100vh-4rem)] bg-white dark:bg-dark-800 border-l border-gray-200 dark:border-dark-700 w-64 flex flex-col transition-transform duration-300 z-20",
        isSidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
      )}
    >
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
                <span className="text-xl group-hover:scale-110 transition-transform">
                  {room.icon}
                </span>
                <span className="font-bold text-sm">{room.name}</span>
              </div>

              {room.type === 'private' && (
                <Lock className="w-3.5 h-3.5 opacity-50" />
              )}

              {room.creator_id === currentUser?.id && (
                <Award className="w-3.5 h-3.5 text-amber-500" />
              )}
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

          {showCreateModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <div className="bg-white dark:bg-dark-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl">
                <h3 className="text-lg font-black mb-4">إنشاء غرفة جديدة</h3>

                <input
                  type="text"
                  value={newRoomData.name}
                  onChange={(e) =>
                    setNewRoomData({ ...newRoomData, name: e.target.value })
                  }
                  placeholder="اسم الغرفة"
                  className="w-full mb-4 p-3 rounded-xl bg-gray-100 dark:bg-dark-700 text-gray-900 dark:text-white border border-gray-200 dark:border-dark-600 focus:ring-2 focus:ring-primary-500"
                />

                <button
                  onClick={async () => {
                    if (!newRoomData.name.trim()) {
                      return toast.error('اكتب اسم');
                    }

                    const { data, error } = await supabase
                      .from('chat_rooms')
                      .insert([
                        {
                          name: newRoomData.name,
                          icon: newRoomData.icon,
                          type: 'public',
                          creator_id: currentUser?.id || null
                        }
                      ])
                      .select()
                      .single();

                    if (error) {
                      toast.error('فشل في إنشاء الغرفة: ' + error.message);
                    } else {
                      setRooms((prev) => [...prev, data]);
                      joinRoom(data);

                      // ✅ FIX هنا
                      if (currentUser) {
                        await supabase.from('messages').insert([
                          {
                            user_id: currentUser.id,
                            room_id: data.id,
                            content: `👋 أهلاً بك [${currentUser.username}] في غرفتك الجديدة!`,
                            type: 'system'
                          }
                        ]);
                      }

                      setShowCreateModal(false);
                      setNewRoomData({ name: '', icon: '🌟' });
                    }
                  }}
                  className="btn-primary w-full"
                >
                  إنشاء
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8">
          {(siteSettings as any)?.sidebar_vip_enabled !== false || sidebarAd ? (
            sidebarAd ? (
              <img src={sidebarAd.image} />
            ) : null
          ) : null}
        </div>
      </div>

      {currentUser && (
        <div className="p-4 border-t border-gray-200 dark:border-dark-700 bg-gray-50/50 dark:bg-dark-800/50 flex flex-col gap-3 shrink-0">
          <div className="flex items-center gap-3 bg-white dark:bg-dark-700 p-3 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-600">
            {currentUser.avatar ? (
              <img src={currentUser.avatar} alt="Avatar" className="w-10 h-10 rounded-xl object-cover shadow-sm" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400 flex items-center justify-center font-bold text-lg shadow-sm">
                {currentUser.username[0].toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="font-bold text-gray-900 dark:text-white truncate" style={{ color: currentUser.name_color || undefined }}>
                {currentUser.name_decoration ? currentUser.name_decoration.replace('[name]', currentUser.username) : currentUser.username}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {currentUser.role === 'User' ? 'عضو' : currentUser.role}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            {(currentUser?.role === 'Admin' || currentUser?.role === 'Super') && (
              <button 
                onClick={() => navigate('/admin')}
                className="flex-1 flex items-center justify-center gap-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 p-2.5 rounded-xl transition-all font-bold text-sm"
              >
                <Settings className="w-4 h-4" />
                <span>الإدارة</span>
              </button>
            )}
            
            <button
              onClick={async () => {
                if (currentUser && activeRoom) {
                  await supabase.from('messages').insert([
                    {
                      user_id: currentUser.id,
                      room_id: activeRoom.id,
                      content: `🚪 ${currentUser.username} غادر الغرفة`,
                      type: 'system'
                    }
                  ]);
                }
                setCurrentUser(null);
                navigate('/login');
              }}
              className="flex-1 flex items-center justify-center gap-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 p-2.5 rounded-xl transition-all font-bold text-sm"
            >
              <LogOut className="w-4 h-4" />
              <span>خروج</span>
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}