import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Admin from './pages/Admin';
import Profile from './pages/Profile';
import Landing from './pages/Landing';
import FloatingRadio from './components/chat/FloatingRadio';
import Subscriptions from './pages/Subscriptions';
import { Toaster, toast } from 'react-hot-toast';
import { Wrench } from 'lucide-react';
import { useAppStore } from './lib/store';
import { supabase } from './lib/supabase';
import type { UserProfile } from './lib/types';

function App() {
  const { theme, siteSettings, setSiteSettings, currentUser, setCurrentUser, isAuthLoading, setAuthLoading, activeRoom, setUnreadMessage } = useAppStore();

  useEffect(() => {
    if (!currentUser) return;

    // Global subscription for all private messages to update unread badge
    const privateChannel = supabase.channel(`global-private-${currentUser.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'private_messages',
        filter: `receiver_id=eq.${currentUser.id}` 
      }, (payload) => {
        // If we are not currently in a room OR not talking to this specific sender, show notification AND badge
        if (!activeRoom || activeRoom.id !== payload.new.sender_id) {
           toast('لديك رسالة خاصة جديدة!', { icon: '📩', position: 'bottom-left' });
           setUnreadMessage(payload.new.sender_id);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(privateChannel);
    };
  }, [currentUser, activeRoom]);

  useEffect(() => {
    supabase.from('site_settings').select('*').limit(1).maybeSingle().then(({ data }) => {
      if (data) setSiteSettings(data as any);
    });

    // Restore Auth Session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        // Fetch profile
        const { data: profile } = await supabase.from('user_profiles').select('*').eq('id', session.user.id).maybeSingle();
        
        if (profile) {
          if (profile.is_banned) {
            if (profile.banned_until && new Date(profile.banned_until) > new Date()) {
              alert('حسابك محظور (بند) مؤقتاً.');
              setCurrentUser(null);
              supabase.auth.signOut();
              return;
            } else if (!profile.banned_until) {
              alert('حسابك محظور (باند) نهائياً.');
              setCurrentUser(null);
              supabase.auth.signOut();
              return;
            } else {
              supabase.from('user_profiles').update({ is_banned: false, banned_until: null }).eq('id', session.user.id);
              profile.is_banned = false;
            }
          }

          setCurrentUser(profile as any);
        } else {
          // Auto-create Admin profile for the first user if none found
          const { data: newProfile } = await supabase.from('user_profiles').insert([{
            id: session.user.id,
            username: session.user.email?.split('@')[0] || 'Admin',
            role: 'Admin',
            email: session.user.email || ''
          }]).select().single();
          if (newProfile) setCurrentUser(newProfile as any);
        }
        setAuthLoading(false);
      } else {
        const persistedUser = useAppStore.getState().currentUser;
        if (!persistedUser?.email?.endsWith('@guest.com')) {
            setCurrentUser(null);
        }
        setAuthLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        if (session?.user) {
          supabase.from('user_profiles').select('*').eq('id', session.user.id).maybeSingle().then(({ data }) => {
            if (data) {
              setCurrentUser(data as UserProfile);
            }
            setAuthLoading(false);
          });
        }
      } else if (event === 'SIGNED_OUT') {
        const persistedUser = useAppStore.getState().currentUser;
        if (!persistedUser?.email?.endsWith('@guest.com')) {
            setCurrentUser(null);
        }
        setAuthLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [setCurrentUser, setSiteSettings, setAuthLoading]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    document.title = siteSettings?.site_name || 'الشات';
  }, [siteSettings?.site_name]);

  // Global Presence & Restart Listener
  useEffect(() => {
    if (!currentUser) return;

    // 1. Presence setup
    const presenceChannel = supabase.channel('online-users', {
      config: { presence: { key: currentUser.id } }
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const onlineIds = Object.keys(state);
        (window as any).actualOnlineIds = onlineIds;
        // Trigger a custom event so OnlineUsers can update
        window.dispatchEvent(new CustomEvent('presence-sync', { detail: onlineIds }));
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('join', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('leave', key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            id: currentUser.id,
            username: currentUser.username,
            online_at: new Date().toISOString(),
          });
        }
      });

    // 2. Restart Listener
    const settingsChannel = supabase.channel('schema-db-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'site_settings' 
      }, (payload) => {
        const newData = payload.new as any;
        const oldData = payload.old as any;
        
        if (newData?.chat_restart_signal && newData.chat_restart_signal !== oldData?.chat_restart_signal) {
           toast.error('🚨 الإدارة: جاري إعادة تشغيل الشات وتفريغ الرسائل...', { 
             duration: 4000,
             position: 'top-center',
             style: { fontSize: '18px', padding: '24px', fontWeight: '900', border: '4px solid white' }
           });
           setTimeout(() => { window.location.reload(); }, 3500);
        }
        if (newData) setSiteSettings(newData);
      })
      .subscribe();

    return () => { 
      supabase.removeChannel(presenceChannel);
      supabase.removeChannel(settingsChannel);
    };
  }, [currentUser, setSiteSettings]);

  // Global User Status Listener (Kick/Mute/Ban)
  useEffect(() => {
    if (!currentUser) return;

    const channel = supabase.channel(`user-status-${currentUser.id}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'user_profiles',
        filter: `id=eq.${currentUser.id}`
      }, (payload) => {
        const newData = payload.new as UserProfile;
        
        // Handle Kick
        if (newData.is_kicked && !currentUser.is_kicked) {
           toast.error('تم طردك من الشات! جاري الإخراج...', { duration: 4000 });
           setTimeout(() => {
             useAppStore.getState().setCurrentUser(null);
             localStorage.clear();
             supabase.auth.signOut();
             window.location.replace('/login');
           }, 2500);
        }

        // Handle Ban
        if (newData.is_banned && !currentUser.is_banned) {
           let msg = 'تم حظر حسابك نهائياً!';
           if (newData.banned_until) {
             const hrs = Math.ceil((new Date(newData.banned_until).getTime() - Date.now()) / 3600000);
             msg = `تم حظر حسابك مؤقتاً (بند) لمدة ${hrs} ساعة.`;
           }
           toast.error(msg, { duration: 4000 });
           setTimeout(() => {
             useAppStore.getState().setCurrentUser(null);
             localStorage.clear();
             supabase.auth.signOut();
             window.location.replace('/login');
           }, 2500);
        }

        // Update local state if mute status changes
        if (newData.is_muted !== currentUser.is_muted) {
           if (newData.is_muted) toast.error('تم كتمك من قبل الإدارة!');
           else toast.success('تم فك الكتم عنك، يمكنك التحدث الآن.');
        }

        setCurrentUser(newData);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentUser, setCurrentUser]);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (siteSettings?.maintenance_mode && currentUser?.role !== 'Admin') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex flex-col items-center justify-center p-4">
        <Wrench className="w-20 h-20 text-gray-400 mb-6" />
        <h1 className="text-3xl font-bold mb-2">الشات تحت الصيانة</h1>
        <p className="text-gray-500 text-center max-w-md">نقوم بإجراء بعض التحسينات الآن، سنعود قريباً جداً.</p>
        <button onClick={() => window.location.href='/login'} className="mt-8 text-primary-500 hover:underline">تسجيل دخول الإدارة</button>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900 transition-colors duration-200">
        <Routes>
          <Route path="/" element={currentUser ? <Home /> : <Landing />} />
          <Route path="/page/:slug" element={<Landing />} />
          <Route path="/login" element={!currentUser ? <Login /> : <Navigate to="/" replace />} />
          <Route path="/register" element={!currentUser ? <Register /> : <Navigate to="/" replace />} />
          <Route path="/admin/*" element={<Admin />} />
          <Route path="/profile" element={currentUser ? <Profile /> : <Navigate to="/login" replace />} />
          <Route path="/subscriptions" element={currentUser ? <Subscriptions /> : <Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <FloatingRadio />
        <Toaster position="top-center" />
      </div>
    </BrowserRouter>
  );
}

export default App;
