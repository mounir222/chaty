import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, User, Lock, Mail, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

import { useAppStore } from '../lib/store';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { siteSettings, setCurrentUser } = useAppStore();
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username,
          }
        }
      });

      if (error) throw error;
      
      if (data.user) {
        // Explicitly create the profile first
        const { error: profileError } = await supabase.from('user_profiles').insert([{
          id: data.user.id,
          username: username,
          email: email,
          role: 'User',
          status: 'online',
          created_at: new Date().toISOString()
        }]);

        if (profileError) {
          console.error("Profile Error:", profileError);
          // If profile creation failed, we still proceed to login
        }

        // Auto-login the user into our app store
        const { data: profile } = await supabase.from('user_profiles').select('*').eq('id', data.user.id).single();
        if (profile) setCurrentUser(profile as any);
        
        toast.success(`أهلاً بك يا ${username}! تم إنشاء حسابك بنجاح.`);
        navigate('/');
      }
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ أثناء التسجيل');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-dark-900 bg-[url('/pattern.svg')] bg-center">
      <div className="w-full max-w-md card p-8 sm:p-10 shadow-xl shadow-gray-200/50 dark:shadow-none">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 text-primary-500 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
            ✨
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
             {siteSettings?.site_name || 'الشات'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">أنشئ حسابك الجديد للتواصل</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">اسم الشهرة (Username)</label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                <User className="h-5 w-5" />
              </div>
              <input
                type="text"
                required
                className="input-field pr-10"
                placeholder="أدخل اسمك في المحادثة"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">البريد الإلكتروني</label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                <Mail className="h-5 w-5" />
              </div>
              <input
                type="email"
                required
                className="input-field pr-10"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">كلمة المرور</label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                <Lock className="h-5 w-5" />
              </div>
              <input
                type="password"
                required
                className="input-field pr-10"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full btn-primary py-3 text-lg flex justify-center items-center gap-2 transform active:scale-95 transition-transform"
          >
            {loading ? 'جاري التسجيل...' : (
              <>
                <UserPlus className="w-5 h-5" /> سجل الآن
              </>
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
          لديك حساب بالفعل؟{' '}
          <Link to="/login" className="font-bold text-primary-600 dark:text-primary-400 hover:text-primary-500 flex items-center justify-center gap-1 mt-2">
            تسجيل دخول <ArrowRight className="w-4 h-4 rtl:rotate-180" />
          </Link>
        </p>
      </div>
    </div>
  );
}
