import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, User, Lock, Globe } from 'lucide-react';
import { useAppStore } from '../lib/store';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import type { UserProfile } from '../lib/types';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setCurrentUser, siteSettings } = useAppStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    let emailToUse = username;

    try {
      // If the input is not an email, try to find the email by username
      if (!username.includes('@')) {
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('email')
          .eq('username', username)
          .maybeSingle();
        
        if (profileError) throw profileError;

        if (profile?.email) {
          emailToUse = profile.email;
        } else if (username.toLowerCase() !== 'admin') {
          // If no profile found and not the mock admin
          throw new Error('اسم المستخدم غير موجود');
        }
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailToUse,
        password: password,
      });

      if (error) {
        // Mock for development if login fails (only for admin)
        if (username.toLowerCase() === 'admin' && password === '123456') {
          setCurrentUser({
            id: '00000000-0000-0000-0000-000000000000',
            username: 'admin',
            email: 'admin@hakawina.com',
            role: 'Admin',
            avatar: null,
            bio: '',
            status: 'online',
            balance: 0,
            created_at: new Date().toISOString()
          });
          navigate('/');
          return;
        }
        throw error;
      }
      
      if (data.user) {
        const { data: profile } = await supabase.from('user_profiles').select('*').eq('id', data.user.id).single();
        if (profile) setCurrentUser(profile as UserProfile);
        navigate('/');
      }
    } catch (error: any) {
      toast.error('خطأ في تسجيل الدخول: ' + (error.message || 'بيانات غير صحيحة'));
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    // Generate a valid UUID for the guest id
    const guestId = crypto.randomUUID();
    const guestUsername = `زائر_${guestId.substring(0, 5)}`;
    
    const newGuest = {
      id: guestId,
      username: guestUsername,
      email: `${guestUsername}@guest.com`,
      role: 'User' as const,
      avatar: null,
      bio: 'انا زائر في الشات',
      status: 'online' as const,
      balance: 0,
    };
    
    // Insert into DB so other users see them
    const { error } = await supabase.from('user_profiles').insert([newGuest]);
    if (error) {
       toast.error('حدث خطأ أثناء دخول الزائر');
       return;
    }

    setCurrentUser({
      ...newGuest,
      created_at: new Date().toISOString()
    });
    navigate('/');
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      });
      if (error) throw error;
    } catch (error) {
       console.error(error);
       toast.error('فشل الدخول بواسطة جوجل');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-dark-900 bg-[url('/pattern.svg')] bg-center opacity-95 dark:opacity-100 font-sans">
      <div className="w-full max-w-md card p-8 sm:p-10 shadow-2xl shadow-primary-500/10 dark:shadow-none border border-gray-100 dark:border-dark-800">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 text-primary-500 rounded-3xl flex items-center justify-center text-3xl mx-auto mb-4 animate-bounce">
            💬
          </div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            {siteSettings?.site_name || 'الشات'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm font-bold">أهلاً بك في عالم المحادثة</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-black text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wider">اسم المستخدم</label>
            <div className="relative group">
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary-500 transition-colors">
                <User className="h-5 w-5" />
              </div>
              <input
                type="text"
                required
                disabled={loading}
                className="input-field pr-12 h-14 text-lg bg-gray-50 dark:bg-dark-900 border-2 border-transparent focus:border-primary-500 focus:bg-white dark:focus:bg-dark-800 transition-all font-black"
                placeholder="أدخل اسمك"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-black text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wider">كلمة المرور</label>
            <div className="relative group">
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary-500 transition-colors">
                <Lock className="h-5 w-5" />
              </div>
              <input
                type="password"
                required
                disabled={loading}
                className="input-field pr-12 h-14 text-lg bg-gray-50 dark:bg-dark-900 border-2 border-transparent focus:border-primary-500 focus:bg-white dark:focus:bg-dark-800 transition-all font-black"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="text-left mt-3">
              <Link to="/forgot-password" hidden className="text-xs font-black text-primary-600 dark:text-primary-400 hover:underline">نسيت كلمة المرور؟</Link>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full btn-primary h-14 text-xl font-black flex justify-center items-center gap-2 shadow-xl shadow-primary-500/30 transform active:scale-95 transition-all"
          >
            {loading ? (
              <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <LogIn className="w-6 h-6 rtl:-scale-x-100" /> دخول الآن
              </>
            )}
          </button>
        </form>

        <div className="mt-8 flex items-center justify-between">
          <span className="w-1/4 border-b-2 border-gray-100 dark:border-dark-800"></span>
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">أو الدخول بواسطة</span>
          <span className="w-1/4 border-b-2 border-gray-100 dark:border-dark-800"></span>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4">
          <button 
            onClick={handleGoogleLogin} 
            disabled={loading}
            type="button" 
            className="h-14 bg-white dark:bg-dark-800 border-2 border-gray-100 dark:border-dark-700 rounded-2xl flex items-center justify-center gap-2 text-sm font-black hover:bg-gray-50 dark:hover:bg-dark-700 transition-all"
          >
             <Globe className="w-5 h-5 text-blue-500" /> جوجل
          </button>
          
          <button 
            onClick={handleGuestLogin} 
            disabled={loading}
            type="button" 
            className="h-14 bg-primary-50 dark:bg-primary-900/10 border-2 border-primary-100 dark:border-primary-900/30 rounded-2xl flex items-center justify-center gap-2 text-sm font-black text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/20 transition-all"
          >
             <User className="w-5 h-5" /> دخول زائر
          </button>
        </div>

        <p className="mt-10 text-center text-sm font-bold text-gray-500 dark:text-gray-400">
          ليس لديك حساب؟{' '}
          <Link to="/register" className="font-black text-primary-600 dark:text-primary-400 hover:text-primary-500 underline underline-offset-4">
            سجل حسابك مجاناً
          </Link>
        </p>
      </div>
    </div>
  );
}
