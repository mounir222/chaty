import React, { useState } from 'react';
import { User, Lock, Mail, Save, ArrowRight, Check, Camera } from 'lucide-react';
import { useAppStore } from '../lib/store';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';

// Beautiful DiceBear v9 avatars - Boys / Men
const BOYS_AVATARS = [
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Felix&backgroundColor=b6e3f4',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Max&backgroundColor=c0aede',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Omar&backgroundColor=d1d4f9',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Ahmed&backgroundColor=ffd5dc',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Leo&backgroundColor=ffdfbf',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Ziad&backgroundColor=c0aede',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Adam&backgroundColor=b6e3f4',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Hassan&backgroundColor=d1d4f9',
];

// Beautiful DiceBear v9 avatars - Girls / Women
const GIRLS_AVATARS = [
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Lily&backgroundColor=ffd5dc',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Sara&backgroundColor=c0aede',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Nour&backgroundColor=b6e3f4',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Mia&backgroundColor=ffdfbf',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Lina&backgroundColor=d1d4f9',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Ava&backgroundColor=ffd5dc',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Hana&backgroundColor=c0aede',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Maya&backgroundColor=b6e3f4',
];

// Fun animal avatars
const FUN_AVATARS = [
  'https://api.dicebear.com/9.x/bottts/svg?seed=Cat&backgroundColor=b6e3f4',
  'https://api.dicebear.com/9.x/bottts/svg?seed=Dog&backgroundColor=c0aede',
  'https://api.dicebear.com/9.x/bottts/svg?seed=Fox&backgroundColor=ffd5dc',
  'https://api.dicebear.com/9.x/bottts/svg?seed=Bear&backgroundColor=d1d4f9',
  'https://api.dicebear.com/9.x/bottts/svg?seed=Lion&backgroundColor=ffdfbf',
  'https://api.dicebear.com/9.x/bottts/svg?seed=Wolf&backgroundColor=b6e3f4',
  'https://api.dicebear.com/9.x/bottts/svg?seed=Eagle&backgroundColor=c0aede',
  'https://api.dicebear.com/9.x/bottts/svg?seed=Tiger&backgroundColor=ffd5dc',
];

// Pixel art avatars
const PIXEL_AVATARS = [
  'https://api.dicebear.com/9.x/pixel-art/svg?seed=A&backgroundColor=b6e3f4',
  'https://api.dicebear.com/9.x/pixel-art/svg?seed=B&backgroundColor=c0aede',
  'https://api.dicebear.com/9.x/pixel-art/svg?seed=C&backgroundColor=ffd5dc',
  'https://api.dicebear.com/9.x/pixel-art/svg?seed=D&backgroundColor=d1d4f9',
  'https://api.dicebear.com/9.x/pixel-art/svg?seed=E&backgroundColor=ffdfbf',
  'https://api.dicebear.com/9.x/pixel-art/svg?seed=F&backgroundColor=b6e3f4',
  'https://api.dicebear.com/9.x/pixel-art/svg?seed=G&backgroundColor=c0aede',
  'https://api.dicebear.com/9.x/pixel-art/svg?seed=H&backgroundColor=ffd5dc',
];

const AvatarGrid = ({
  avatars,
  selected,
  onSelect,
  accentColor = 'primary'
}: {
  avatars: string[];
  selected: string;
  onSelect: (url: string) => void;
  accentColor?: string;
}) => (
  <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
    {avatars.map((url, i) => (
      <div
        key={i}
        onClick={() => onSelect(url)}
        className={clsx(
          "aspect-square rounded-2xl cursor-pointer border-4 transition-all relative overflow-hidden",
          selected === url
            ? `border-${accentColor}-500 scale-110 shadow-xl shadow-${accentColor}-500/30`
            : "border-transparent hover:border-gray-200 dark:hover:border-dark-600 bg-gray-50 dark:bg-dark-900"
        )}
      >
        <img
          src={url}
          className="w-full h-full object-cover p-1"
          alt={`avatar-${i}`}
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=A&background=6366f1&color=fff&bold=true`;
          }}
        />
        {selected === url && (
          <div className="absolute inset-0 bg-primary-500/20 flex items-center justify-center">
            <div className="bg-primary-500 text-white p-1 rounded-full shadow-lg">
              <Check className="w-3 h-3" />
            </div>
          </div>
        )}
      </div>
    ))}
  </div>
);

export default function Profile() {
  const { currentUser, setCurrentUser, siteSettings } = useAppStore();
  const [username, setUsername] = useState(currentUser?.username || '');
  const [password, setPassword] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(currentUser?.avatar || '');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  if (!currentUser) return null;

  const isGuest = currentUser.id.startsWith('guest-');

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // If guest user - only update local state (no DB)
      if (isGuest) {
        setCurrentUser({ ...currentUser, username: username.trim(), avatar: selectedAvatar });
        toast.success('تم تحديث بروفايلك ✨ (كزائر يتم الحفظ مؤقتاً فقط)');
        setLoading(false);
        return;
      }

      // Regular user - update in DB
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          username: username.trim(),
          avatar: selectedAvatar,
        })
        .eq('id', currentUser.id);

      if (profileError) {
        if (profileError.message.includes('JWT')) {
          throw new Error('انتهت جلسة تسجيل الدخول، يرجى تسجيل الخروج والدخول مرة أخرى.');
        }
        throw profileError;
      }

      // Update password if entered
      if (password && password.trim().length > 0) {
        const { error: authError } = await supabase.auth.updateUser({ password: password.trim() });
        if (authError) {
          if (authError.message.includes('session')) {
            toast.error('لم نتمكن من تحديث كلمة المرور. سيتم تحديث الاسم والصورة فقط.');
          } else {
            throw authError;
          }
        } else {
          toast.success('تم تحديث كلمة المرور بنجاح ✅');
        }
      }

      setCurrentUser({ ...currentUser, username: username.trim(), avatar: selectedAvatar });
      toast.success('تم تحديث بروفايلك بنجاح ✨');
      setPassword('');
    } catch (error: any) {
      console.error('Update Error:', error);
      toast.error('حدث خطأ: ' + (error.message || 'بيانات غير صحيحة'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900 pb-20 font-sans">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-indigo-800 h-56 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
        <div className="max-w-5xl mx-auto px-4 h-full flex items-end pb-8">
          <button onClick={() => navigate(-1)} className="absolute top-6 right-6 bg-white/20 hover:bg-white/40 text-white p-3 rounded-2xl backdrop-blur-md transition-all shadow-lg active:scale-90">
            <ArrowRight className="w-5 h-5" />
          </button>
          {isGuest && (
            <div className="absolute top-6 left-6 bg-amber-500/80 backdrop-blur-md text-white px-4 py-2 rounded-2xl text-xs font-black">
              ⚠️ دخلت كزائر - التغييرات مؤقتة
            </div>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-20 relative z-10">
        <div className="bg-white dark:bg-dark-800 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-dark-700 p-8 md:p-12">
          <form onSubmit={handleUpdateProfile} className="space-y-10">

            {/* Profile Header */}
            <div className="flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-right">
              <div className="relative group">
                <div className="w-36 h-36 rounded-[2rem] bg-gradient-to-br from-primary-400 to-indigo-600 flex items-center justify-center text-white text-6xl font-black border-4 border-white dark:border-dark-700 shadow-2xl overflow-hidden ring-4 ring-primary-500/20">
                  {selectedAvatar ? (
                    <img
                      src={selectedAvatar}
                      className="w-full h-full object-cover"
                      alt={currentUser.username}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <span>{currentUser.username?.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-dark-700">
                  <Camera className="w-4 h-4 text-white" />
                </div>
              </div>

              <div className="flex-1 space-y-2">
                <h1 className="text-3xl font-black text-gray-900 dark:text-white">{currentUser.username}</h1>
                <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
                  <span className="bg-primary-500 text-white px-4 py-1.5 rounded-full text-xs font-black tracking-widest uppercase shadow-lg shadow-primary-500/30">
                    {currentUser.role}
                  </span>
                  <span className="bg-gray-100 dark:bg-dark-700 text-gray-500 px-3 py-1.5 rounded-full text-xs font-bold">
                    {siteSettings?.site_name || 'الشات'}
                  </span>
                </div>
                <p className="flex items-center justify-center md:justify-start gap-2 text-gray-400 font-bold text-sm mt-2">
                  <Mail className="w-4 h-4" /> {currentUser.email}
                </p>
              </div>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-dark-600 to-transparent"></div>

            {/* Avatar Selection */}
            <div className="space-y-8">
              <div>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-1">🎨 اختر صورتك الرمزية</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-bold">تميز بشكل جديد وعصري أمام الجميع</p>
              </div>

              {/* Boys */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-blue-500 uppercase tracking-widest flex items-center gap-2">
                  <span>👦</span> صور شبابية
                </h4>
                <AvatarGrid avatars={BOYS_AVATARS} selected={selectedAvatar} onSelect={setSelectedAvatar} />
              </div>

              {/* Girls */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-pink-500 uppercase tracking-widest flex items-center gap-2">
                  <span>👧</span> صور بناتي
                </h4>
                <AvatarGrid avatars={GIRLS_AVATARS} selected={selectedAvatar} onSelect={setSelectedAvatar} accentColor="pink" />
              </div>

              {/* Fun / Robots */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-purple-500 uppercase tracking-widest flex items-center gap-2">
                  <span>🤖</span> روبوتات مضحكة
                </h4>
                <AvatarGrid avatars={FUN_AVATARS} selected={selectedAvatar} onSelect={setSelectedAvatar} accentColor="purple" />
              </div>

              {/* Pixel Art */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-amber-500 uppercase tracking-widest flex items-center gap-2">
                  <span>🎮</span> بيكسل آرت
                </h4>
                <AvatarGrid avatars={PIXEL_AVATARS} selected={selectedAvatar} onSelect={setSelectedAvatar} accentColor="amber" />
              </div>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-dark-600 to-transparent"></div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 px-1">اسم المستخدم</label>
                <div className="relative">
                  <User className="absolute right-4 top-4 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="input-field h-14 pr-12 font-black text-lg bg-gray-50 dark:bg-dark-900 border-none transition-all focus:ring-4 focus:ring-primary-500/10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 px-1">
                  تغيير كلمة المرور {isGuest && <span className="text-amber-500">(متاح للأعضاء فقط)</span>}
                </label>
                <div className="relative">
                  <Lock className="absolute right-4 top-4 text-gray-400 w-5 h-5" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isGuest}
                    className="input-field h-14 pr-12 font-black text-lg bg-gray-50 dark:bg-dark-900 border-none transition-all focus:ring-4 focus:ring-amber-500/10 disabled:opacity-40 disabled:cursor-not-allowed"
                    placeholder={isGuest ? 'غير متاح للزوار' : '********'}
                  />
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full md:w-auto px-16 h-16 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-[1.5rem] font-black text-xl shadow-2xl shadow-primary-500/30 flex items-center justify-center gap-3 transition-all active:scale-95"
              >
                {loading ? (
                  <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <><Save className="w-6 h-6" /> حفظ وتحديث البروفايل</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
