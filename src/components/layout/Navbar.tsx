import { Menu, Moon, Sun, LogOut, User as UserIcon, MessageSquare } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAppStore } from '../../lib/store';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { clsx } from 'clsx';

export default function Navbar() {
  const { toggleSidebar, theme, toggleTheme, currentUser, setCurrentUser, siteSettings, unreadMessages, setUnreadMessage, setActiveRoom, joinedRooms, leaveRoom, activeRoom } = useAppStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
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
    navigate('/');
  };

  return (
    <nav className="h-auto bg-white dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700 flex flex-col sticky top-0 z-50 transition-colors duration-200">
      <div className="h-16 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleSidebar}
            className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg lg:hidden"
          >
            <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          <Link to="/" className="text-xl font-bold text-primary-600 dark:text-primary-500 font-sans tracking-tight flex items-center gap-2">
            <span className="text-2xl">💬</span>
            {siteSettings?.site_name || 'الشات'}
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="relative">
               <button 
                 onClick={() => {
                   if (unreadMessages.length > 0) {
                      const lastSenderId = unreadMessages[unreadMessages.length - 1];
                      setActiveRoom({ id: lastSenderId, name: 'رسالة خاصة', type: 'private', icon: '💬', description: '', created_at: '' });
                      setUnreadMessage(lastSenderId, true);
                   } else {
                      toast.success('لا توجد رسائل جديدة');
                   }
                 }}
                 className="p-2.5 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-2xl text-gray-600 dark:text-gray-300 transition-all"
               >
                  <MessageSquare className="w-5 h-5" />
                  {unreadMessages.length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-black w-4 h-4 flex items-center justify-center rounded-full border-2 border-white dark:border-dark-800 shadow-lg">
                      {unreadMessages.length}
                    </span>
                  )}
               </button>
            </div>

            <button 
              onClick={toggleTheme}
              className="p-2.5 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-2xl text-gray-600 dark:text-gray-300"
              title="تغيير المظهر"
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
          </div>

          {currentUser ? (
            <div className="flex items-center gap-3 ml-2 border-r border-gray-200 dark:border-dark-700 pr-3">
              {['admin', 'moderator', 'super'].includes(currentUser.role.toLowerCase()) && (
                <Link to="/admin" className="text-sm font-bold text-red-500 hover:text-red-600 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors">
                  لوحة التحكم
                </Link>
              )}
              <Link to="/subscriptions" className="text-sm font-bold text-yellow-600 dark:text-yellow-500 hover:text-yellow-700 bg-yellow-50 dark:bg-yellow-900/20 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors hidden sm:flex">
                ترقية العضوية
              </Link>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200 hidden sm:block">
                  {currentUser.username}
                </span>
                <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold overflow-hidden border border-primary-200 dark:border-primary-700">
                  {currentUser.avatar ? (
                    <img src={currentUser.avatar} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    currentUser.username.charAt(0).toUpperCase()
                  )}
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                title="تسجيل الخروج"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 pr-2 border-r border-gray-200 dark:border-dark-700">
              <Link to="/login" className="btn-secondary text-sm !px-3 !py-1.5 flex items-center gap-1">
                <UserIcon className="w-4 h-4" />
                دخول
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Multi-Room Tabs Bar */}
      {joinedRooms.length > 0 && (
        <div className="h-10 bg-gray-50 dark:bg-dark-900 border-t border-gray-100 dark:border-dark-700 flex items-center px-4 gap-2 overflow-x-auto scrollbar-hide py-1">
          {joinedRooms.map(room => (
            <div 
              key={room.id}
              className={clsx(
                "flex items-center gap-2 px-3 h-full rounded-t-lg transition-all cursor-pointer min-w-fit border-x border-t relative group",
                activeRoom?.id === room.id 
                  ? "bg-white dark:bg-dark-800 border-gray-200 dark:border-dark-700 text-primary-600 dark:text-primary-400 font-bold shadow-sm translate-y-[1px]" 
                  : "bg-transparent border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-dark-800"
              )}
              onClick={() => setActiveRoom(room)}
            >
              <span className="text-sm">{room.icon}</span>
              <span className="text-xs truncate max-w-[100px]">{room.name}</span>
              <button 
                onClick={(e) => { e.stopPropagation(); leaveRoom(room.id); }}
                className="ml-1 p-0.5 rounded-full hover:bg-red-100 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
              >
                <LogOut className="w-2.5 h-2.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </nav>
  );
}
