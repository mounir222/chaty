import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  Users as UsersIcon, 
  MessageSquare, 
  Layout, 
  Settings, 
  CreditCard, 
  Trash2, 
  DollarSign, 
  Wallet, 
  Radio, 
  Shield, 
  Ban, 
  Volume2 as VolumeX, 
  Eye, 
  AlertCircle as ShieldAlert,
  Plus,
  RotateCcw,
  ChevronRight,
  FileText
} from 'lucide-react';
import type { PrivateMessage } from '../lib/types';
import Navbar from '../components/layout/Navbar';
import type { UserProfile, ChatRoom, Ad, Role, SubscriptionPlan, PaymentMethod, RadioStation, StaticPage } from '../lib/types';
import toast from 'react-hot-toast';
import { useAppStore } from '../lib/store';
import { clsx } from 'clsx';

export default function Admin() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [payments, setPayments] = useState<PaymentMethod[]>([]);
  const [radios, setRadios] = useState<RadioStation[]>([]);
  const [privateMsgLog, setPrivateMsgLog] = useState<PrivateMessage[]>([]);
  const [selectedMsgs, setSelectedMsgs] = useState<string[]>([]);
  const [pages, setPages] = useState<StaticPage[]>([]);

  const { currentUser, setCurrentUser, siteSettings, setSiteSettings, isAuthLoading } = useAppStore();
  const location = useLocation();

  const [newRoom, setNewRoom] = useState({ name: '', icon: '🌍', type: 'public', description: '' });
  const [newAd, setNewAd] = useState({ title: '', image: '', link: '', ad_code: '', position: 'sidebar' as const });
  const [newRadio, setNewRadio] = useState({ name: '', url: '' });

  const allowedRoles = ['admin', 'moderator', 'super'];
  const userRole = (currentUser?.role || '').toLowerCase();

  useEffect(() => {
    if (!currentUser || !allowedRoles.includes(userRole)) return;

    const fetchData = async () => {
      const [u, r, a, p, py, rd, s, pg] = await Promise.all([
        supabase.from('user_profiles').select('*').not('email', 'like', '%@guest.com').order('created_at', { ascending: false }),
        supabase.from('chat_rooms').select('*').order('name'),
        supabase.from('ads').select('*').order('created_at', { ascending: false }),
        supabase.from('subscription_plans').select('*').order('price'),
        supabase.from('payment_methods').select('*'),
        supabase.from('radios').select('*').order('name'),
        supabase.from('site_settings').select('*').maybeSingle(),
        supabase.from('pages').select('*').order('created_at', { ascending: false })
      ]);

      if (u.data) setUsers(u.data as UserProfile[]);
      if (r.data) setRooms(r.data);
      if (a.data) setAds(a.data);
      if (p.data) setPlans(p.data);
      if (py.data) setPayments(py.data);
      if (rd.data) setRadios(rd.data);
      if (s.data) setSiteSettings(s.data);
      if (pg.data) setPages(pg.data);

      if (userRole === 'admin') {
        const { data } = await supabase.from('private_messages')
          .select('*, sender:user_profiles!sender_id(username), receiver:user_profiles!receiver_id(username)')
          .order('created_at', { ascending: false })
          .limit(100);
        if (data) setPrivateMsgLog(data as any[]);
      }
    };

    fetchData();
  }, [currentUser, userRole, setSiteSettings]);

  if (isAuthLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-900">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
          <p className="text-gray-500 font-bold">جاري تحميل لوحة التحكم...</p>
        </div>
      </div>
    );
  }

  if (!currentUser || !allowedRoles.includes(userRole)) {
    return (
      <div className="h-screen flex flex-col items-center justify-center p-6 bg-white dark:bg-dark-950">
        <div className="bg-red-50 dark:bg-red-900/10 p-10 rounded-3xl border border-red-100 dark:border-red-900/30 text-center max-w-md w-full shadow-2xl">
           <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-6" />
           <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">غير مسموح بالدخول</h2>
           <p className="text-gray-500 dark:text-gray-400 mb-8">رتبتك الحالية ({currentUser?.role || 'User'}) لا تمنحك صلاحية الإدارة</p>
           <Link to="/" className="bg-primary-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-primary-500/20 block">العودة للدردشة</Link>
        </div>
      </div>
    );
  }

  const menuItems = [
    { label: 'نظرة عامة', icon: Layout, path: '', roles: ['admin', 'moderator', 'super'] },
    { label: 'المستخدمين', icon: UsersIcon, path: 'users', roles: ['admin', 'moderator', 'super'] },
    { label: 'غرف الدردشة', icon: MessageSquare, path: 'rooms', roles: ['admin', 'moderator', 'super'] },
    { label: 'الاشتراكات', icon: DollarSign, path: 'subscriptions', roles: ['admin', 'super'] },
    { label: 'سجل الرقابة', icon: Eye, path: 'logs', roles: ['admin', 'super'] },
    { label: 'المحظورين والكتم', icon: Ban, path: 'penalties', roles: ['admin', 'moderator', 'super'] },
    { label: 'الإعلانات', icon: CreditCard, path: 'ads', roles: ['admin', 'super'] },
    { label: 'الراديو', icon: Radio, path: 'radio', roles: ['admin', 'super'] },
    { label: 'الصفحات الثابتة', icon: FileText, path: 'pages', roles: ['admin', 'super'] },
    { label: 'الإعدادات', icon: Settings, path: 'settings', roles: ['admin', 'super'] },
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-dark-950 font-sans text-gray-900 dark:text-gray-100">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-72 bg-white dark:bg-dark-900 border-l border-gray-200 dark:border-dark-800 flex flex-col p-6 shadow-sm z-10 transition-colors overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-dark-700">
          <div className="flex items-center gap-3 mb-10 px-2 shrink-0">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white shadow-lg">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-black text-lg text-gray-900 dark:text-white">لوحة الإدارة</h2>
              <p className="text-[10px] text-primary-600 dark:text-primary-400 uppercase tracking-widest font-bold truncate max-w-[180px]">
                {siteSettings?.site_name || 'Hakaweena System'}
              </p>
            </div>
          </div>

          <nav className="space-y-1 pb-10">
            {menuItems.filter(item => item.roles.includes(userRole.toLowerCase())).map(item => {
              const isActive = location.pathname === `/admin${item.path ? '/' + item.path : ''}`;
              return (
                <Link 
                  key={item.path} 
                  to={`/admin/${item.path}`} 
                  className={clsx(
                    "flex items-center justify-between p-3.5 rounded-xl transition-all group",
                    isActive 
                      ? "bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 shadow-sm" 
                      : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-800 hover:text-gray-900 dark:hover:text-white"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className={clsx("w-5 h-5", isActive ? "text-primary-600" : "text-gray-400 group-hover:text-gray-600")} />
                    <span className="font-bold text-sm">{item.label}</span>
                  </div>
                  {isActive && <ChevronRight className="w-4 h-4" />}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 overflow-y-auto bg-gray-50 dark:bg-dark-950">
          <Routes>
            {/* Overview */}
            <Route index element={
              <div className="space-y-8 animate-in fade-in duration-500">
                <header>
                  <h1 className="text-3xl font-black">مرحباً بك مجدداً 👋</h1>
                  <p className="text-gray-500 dark:text-gray-400 mt-1">هذه هي حالة موقعك الحالية في حكاوينا شات.</p>
                </header>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {[
                    { label: 'المستخدمين', value: users.length, color: 'blue', icon: UsersIcon },
                    { label: 'الغرف النشطة', value: rooms.length, color: 'emerald', icon: MessageSquare },
                    { label: 'الإعلانات', value: ads.length, color: 'amber', icon: CreditCard },
                    { label: 'محطات الراديو', value: radios.length, color: 'purple', icon: Radio },
                  ].map(stat => (
                    <div key={stat.label} className="bg-white dark:bg-dark-900 p-6 rounded-3xl border border-gray-100 dark:border-dark-800 shadow-sm hover:shadow-md transition-shadow">
                      <div className={`w-12 h-12 bg-${stat.color}-500/10 text-${stat.color}-600 dark:text-${stat.color}-400 rounded-2xl flex items-center justify-center mb-4`}>
                        <stat.icon className="w-6 h-6" />
                      </div>
                      <h3 className="text-gray-900 dark:text-gray-100 font-black text-sm">{stat.label}</h3>
                      <p className="text-3xl font-black mt-2 text-primary-600 dark:text-primary-400">{stat.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            } />

            {/* Users Management */}
            <Route path="users" element={
              <div className="space-y-6">
                <h1 className="text-2xl font-bold">إدارة المستخدمين والرقابة</h1>
                <div className="bg-white dark:bg-dark-900 rounded-3xl border border-gray-100 dark:border-dark-800 overflow-hidden shadow-sm">
                  <table className="w-full text-right border-collapse">
                    <thead className="bg-gray-50 dark:bg-dark-800 border-b border-gray-100 dark:border-dark-700">
                      <tr>
                        <th className="p-5 font-bold text-gray-500 dark:text-gray-400">المستخدم</th>
                        <th className="p-5 font-bold text-gray-500 dark:text-gray-400">الرتبة</th>
                        <th className="p-5 font-bold text-gray-500 dark:text-gray-400">الحالة</th>
                        <th className="p-5 font-bold text-gray-500 dark:text-gray-400 text-center">اللون</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-dark-800">
                      {users.slice(0, 50).map(u => (
                        <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-dark-800/50 transition-colors">
                          <td className="p-5">
                            <div className="flex items-center gap-3">
                               <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-dark-700 flex items-center justify-center font-bold" style={{ color: u.name_color || 'inherit' }}>
                                 {u.avatar ? <img src={u.avatar} className="w-full h-full rounded-full object-cover" /> : u.username.charAt(0)}
                               </div>
                               <div>
                                 <p className="font-bold">{u.username}</p>
                                 <p className="text-[10px] text-gray-400">{u.email}</p>
                               </div>
                            </div>
                          </td>
                          <td className="p-5">
                            <select 
                              value={u.role} 
                              onChange={async (e) => {
                                const newRole = e.target.value as Role;
                                await supabase.from('user_profiles').update({ role: newRole }).eq('id', u.id);
                                setUsers(users.map(prev => prev.id === u.id ? { ...prev, role: newRole } : prev));
                                toast.success(`تم تغيير رتبة ${u.username} إلى ${newRole}`);
                              }}
                              className="bg-gray-100 dark:bg-dark-700 border-none rounded-lg px-2 py-1 text-xs font-bold focus:ring-2 focus:ring-primary-500"
                            >
                               {['User', 'VIP', 'Super', 'Moderator', 'Admin'].map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                          </td>
                          <td className="p-5">
                             <div className="flex gap-2">
                               <button 
                                  onClick={async () => {
                                    const next = !u.is_muted;
                                    await supabase.from('user_profiles').update({ is_muted: next }).eq('id', u.id);
                                    setUsers(users.map(prev => prev.id === u.id ? { ...prev, is_muted: next } : prev));
                                    toast.success(next ? 'تم الكتم' : 'تم فك الكتم');
                                  }}
                                  className={clsx("p-2 rounded-lg transition-all", u.is_muted ? "bg-yellow-500 text-white shadow-lg shadow-yellow-500/20" : "bg-gray-100 dark:bg-dark-700 text-gray-500")}
                               >
                                 <VolumeX className="w-4 h-4" />
                               </button>
                               <button 
                                  onClick={async () => {
                                    const next = !u.is_banned;
                                    await supabase.from('user_profiles').update({ is_banned: next }).eq('id', u.id);
                                    setUsers(users.map(prev => prev.id === u.id ? { ...prev, is_banned: next } : prev));
                                    toast.success(next ? 'تم الحظر' : 'تم فك الحظر');
                                  }}
                                  className={clsx("p-2 rounded-lg transition-all", u.is_banned ? "bg-red-500 text-white shadow-lg shadow-red-500/20" : "bg-gray-100 dark:bg-dark-700 text-gray-500")}
                               >
                                 <Ban className="w-4 h-4" />
                               </button>
                             </div>
                          </td>
                          <td className="p-5 text-center">
                            <input 
                              type="color" 
                              value={u.name_color || '#000000'} 
                              onChange={async (e) => {
                                 await supabase.from('user_profiles').update({ name_color: e.target.value }).eq('id', u.id);
                                 setUsers(users.map(prev => prev.id === u.id ? { ...prev, name_color: e.target.value } : prev));
                              }}
                              className="w-8 h-8 rounded-full border-2 border-white dark:border-dark-800 overflow-hidden cursor-pointer shadow-sm" 
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            } />

            {/* Chat Rooms */}
            <Route path="rooms" element={
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h1 className="text-2xl font-bold">إدارة غرف الدردشة</h1>
                  <button 
                    onClick={() => {
                       const name = prompt('اسم الغرفة الجديدة:');
                       if (name) {
                         supabase.from('chat_rooms').insert([
                           { name, icon: '🌍', type: 'public', description: '' }
                         ]).select().single().then(({ data, error }) => {
                           if (error) {
                             console.error(error);
                             toast.error('حدث خطأ أثناء إضافة الغرفة');
                           } else if (data) {
                             setRooms([...rooms, data]);
                             toast.success('تمت إضافة الغرفة بنجاح');
                           }
                         });
                       }
                    }}
                    className="btn-primary flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    إضافة غرفة
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {rooms.map(room => (
                    <div key={room.id} className="bg-white dark:bg-dark-900 p-6 rounded-3xl border border-gray-100 dark:border-dark-800 flex items-center justify-between group shadow-sm hover:shadow-md transition">
                       <div className="flex items-center gap-4">
                         <div className="text-3xl">{room.icon}</div>
                         <div>
                            <h3 className="font-bold">{room.name}</h3>
                            <p className="text-[10px] text-gray-400 capitalize">{room.type}</p>
                         </div>
                       </div>
                       <button 
                        onClick={async () => {
                          if (confirm('حذف الغرفة؟')) {
                            await supabase.from('chat_rooms').delete().eq('id', room.id);
                            setRooms(rooms.filter(r => r.id !== room.id));
                            toast.success('تم الحذف');
                          }
                        }}
                        className="text-red-500 opacity-0 group-hover:opacity-100 p-2 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition"
                       >
                         <Trash2 className="w-5 h-5" />
                       </button>
                    </div>
                  ))}
                </div>
              </div>
            } />

            {/* Private Logs */}
            <Route path="logs" element={
               <div className="space-y-6">
                 <div className="flex items-center justify-between">
                   <h1 className="text-2xl font-bold text-gray-900 dark:text-white">سجل الرقابة والمحادثات</h1>
                   {selectedMsgs.length > 0 && (
                     <button
                       onClick={async () => {
                         if (confirm(`هل أنت متأكد من حذف ${selectedMsgs.length} رسائل؟`)) {
                           await supabase.from('private_messages').delete().in('id', selectedMsgs);
                           setPrivateMsgLog(privateMsgLog.filter(m => !selectedMsgs.includes(m.id as string)));
                           setSelectedMsgs([]);
                           toast.success('تم حذف الرسائل المحددة بنجاح');
                         }
                       }}
                       className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-bold transition flex items-center gap-2"
                     >
                       <Trash2 className="w-5 h-5" />
                       حذف المحدد ({selectedMsgs.length})
                     </button>
                   )}
                 </div>
                 <div className="bg-white dark:bg-dark-900 rounded-3xl border border-gray-200 dark:border-dark-800 overflow-hidden shadow-xl">
                    <table className="w-full text-right">
                      <thead className="bg-primary-600 text-white">
                        <tr>
                          <th className="p-4 font-black uppercase w-10">
                            <input
                              type="checkbox"
                              className="w-4 h-4 cursor-pointer"
                              onChange={(e) => {
                                if (e.target.checked) setSelectedMsgs(privateMsgLog.map(m => m.id as string));
                                else setSelectedMsgs([]);
                              }}
                              checked={selectedMsgs.length > 0 && selectedMsgs.length === privateMsgLog.length}
                            />
                          </th>
                          <th className="p-5 font-black uppercase">المرسل</th>
                          <th className="p-5 font-black uppercase">المستقبل</th>
                          <th className="p-5 font-black uppercase">الرسالة</th>
                          <th className="p-5 font-black uppercase">التوقيت</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-dark-800">
                        {privateMsgLog.map(m => (
                          <tr key={m.id} className="hover:bg-primary-50/50 dark:hover:bg-primary-900/10 transition-colors">
                            <td className="p-4">
                              <input
                                type="checkbox"
                                className="w-4 h-4 cursor-pointer"
                                checked={selectedMsgs.includes(m.id as string)}
                                onChange={(e) => {
                                  if (e.target.checked) setSelectedMsgs([...selectedMsgs, m.id as string]);
                                  else setSelectedMsgs(selectedMsgs.filter(id => id !== m.id));
                                }}
                              />
                            </td>
                            <td className="p-5">
                               <span className="font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 px-3 py-1.5 rounded-lg border border-primary-100 dark:border-primary-800/50">
                                 {(m.sender as any)?.username}
                               </span>
                            </td>
                            <td className="p-5">
                               <span className="font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1.5 rounded-lg border border-indigo-100 dark:border-indigo-800/50">
                                 {(m.receiver as any)?.username}
                               </span>
                            </td>
                            <td className="p-5 text-gray-800 dark:text-gray-200 font-medium">{m.content}</td>
                            <td className="p-5 text-xs font-bold text-gray-500">{new Date(m.created_at).toLocaleString('ar-EG')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                 </div>
               </div>
            } />

            {/* Ads Manager */}
            <Route path="ads" element={
              <div className="space-y-6">
                <div className="bg-white dark:bg-dark-900 p-8 rounded-3xl border border-gray-100 dark:border-dark-800 shadow-xl border-t-8 border-t-primary-500">
                  <h2 className="text-2xl font-black mb-6">إضافة إعلان جديد</h2>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold mb-2">عنوان الإعلان</label>
                        <input value={newAd.title} onChange={e => setNewAd({...newAd, title: e.target.value})} className="input-field" placeholder="مثلاً: خصم 50%" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold mb-2">المكان</label>
                        <select value={newAd.position} onChange={e => setNewAd({...newAd, position: e.target.value as any})} className="input-field">
                          <option value="sidebar">الجانبي (Sidebar)</option>
                          <option value="top">العلوي (Top)</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-2">شفرة الإعلان (HTML/JS)</label>
                      <textarea value={newAd.ad_code} onChange={e => setNewAd({...newAd, ad_code: e.target.value})} className="input-field h-32 font-mono" placeholder="ضع هنا كود AdSense أو كود HTML مخصص" />
                    </div>
                    <button 
                      onClick={async () => {
                         if (!newAd.title) return toast.error('أدخل العنوان');
                         const { data } = await supabase.from('ads').insert([newAd]).select().single();
                         if (data) {
                           setAds([data, ...ads]);
                           setNewAd({ title: '', image: '', link: '', ad_code: '', position: 'sidebar' });
                           toast.success('تم نشر الإعلان');
                         }
                      }}
                      className="btn-primary w-full py-4 text-lg shadow-xl shadow-primary-500/20"
                    >
                      نشر الإعلان الآن 🚀
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {ads.map(ad => (
                     <div key={ad.id} className="bg-white dark:bg-dark-900 p-6 rounded-3xl border border-gray-100 dark:border-dark-800 flex justify-between items-center group">
                        <div>
                           <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">{ad.position}</p>
                           <h4 className="font-black text-lg">{ad.title}</h4>
                        </div>
                        <button onClick={async () => { await supabase.from('ads').delete().eq('id', ad.id); setAds(ads.filter(a => a.id !== ad.id)); }} className="text-red-500 p-3 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-2xl transition-all">
                          <Trash2 className="w-6 h-6" />
                        </button>
                     </div>
                   ))}
                </div>
              </div>
            } />

            {/* Radio Manager */}
            <Route path="radio" element={
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-purple-600 to-indigo-700 p-8 rounded-3xl text-white shadow-2xl flex justify-between items-center">
                  <div>
                    <h2 className="text-3xl font-black mb-2 italic">Radio Control Station 🎙️</h2>
                    <p className="text-white/70">أضف محطات راديو ليتمكن الأعضاء من الاستماع إليها من الشات.</p>
                  </div>
                  <button 
                    onClick={() => {
                       const name = prompt('اسم المحطة:');
                       const url = prompt('رابط البث (URL):');
                       if (name && url) {
                         supabase.from('radios').insert([{ name, url }]).select().single().then(({ data }) => {
                           if (data) setRadios([...radios, data]);
                         });
                       }
                    }}
                    className="bg-white/20 hover:bg-white/30 backdrop-blur-md px-6 py-3 rounded-2xl font-bold transition"
                  >
                    إضافة محطة +
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {radios.map(radio => (
                    <div key={radio.id} className="bg-white dark:bg-dark-900 p-6 rounded-3xl border border-gray-100 dark:border-dark-800 flex items-center justify-between group shadow-sm">
                       <div className="flex items-center gap-4">
                         <div className="w-14 h-14 bg-purple-50 dark:bg-purple-900/20 rounded-2xl flex items-center justify-center text-2xl">📻</div>
                         <div>
                            <h4 className="font-bold text-lg">{radio.name}</h4>
                            <p className="text-xs text-gray-400 font-mono truncate max-w-[200px]">{radio.url}</p>
                         </div>
                       </div>
                       <button onClick={async () => { await supabase.from('radios').delete().eq('id', radio.id); setRadios(radios.filter(r => r.id !== radio.id)); }} className="text-red-500 opacity-0 group-hover:opacity-100 p-3 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-2xl transition">
                         <Trash2 className="w-5 h-5" />
                       </button>
                    </div>
                  ))}
                </div>
              </div>
            } />

            {/* Subscriptions */}
            <Route path="subscriptions" element={
              <div className="space-y-6">
                <header>
                  <h1 className="text-2xl font-bold">إدارة طرق الدفع</h1>
                  <p className="text-gray-500 dark:text-gray-400">تحكم في البيانات التي تظهر للأعضاء عند رغبتهم في الترقية.</p>
                </header>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {payments.map(method => (
                    <div key={method.id} className="bg-white dark:bg-dark-900 p-8 rounded-3xl border border-gray-100 dark:border-dark-800 space-y-6 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-primary-50 dark:bg-primary-900/10 rounded-2xl flex items-center justify-center text-primary-600">
                          <Wallet className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold italic">{method.name}</h3>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">تفاصيل الحساب / الرقم</label>
                        <textarea 
                          value={method.details} 
                          onChange={(e) => setPayments(payments.map(p => p.id === method.id ? { ...p, details: e.target.value } : p))} 
                          className="input-field h-24 font-bold text-center text-lg" 
                        />
                      </div>
                      <button 
                         onClick={async () => {
                           await supabase.from('payment_methods').update({ details: method.details }).eq('id', method.id);
                           toast.success('تم تحديث بيانات ' + method.name);
                         }}
                         className="btn-primary w-full py-4 shadow-xl shadow-primary-500/20 font-black italic"
                      >
                        حفظ بيانات الدفع ✅
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            } />

            {/* Settings */}
            <Route path="settings" element={
              <div className="space-y-8 max-w-4xl">
                 <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-black">إعدادات الموقع المتقدمة</h1>
                    <button 
                      onClick={async () => {
                        if (!siteSettings) return;
                        const { id, ...rest } = siteSettings as any;
                        await supabase.from('site_settings').update(rest).eq('id', id);
                        toast.success('تم حفظ جميع الإعدادات العامة بنجاح');
                      }} 
                      className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-2xl font-bold shadow-xl shadow-emerald-500/20 transition-all flex items-center gap-2"
                    >
                      <Layout className="w-5 h-5" />
                      حفظ جميع التغييرات
                    </button>
                 </div>
                 
                 <div className="grid grid-cols-1 gap-6">
                    <div className="bg-white dark:bg-dark-900 p-8 rounded-3xl border border-gray-100 dark:border-dark-800 space-y-8 shadow-sm">
                        <div>
                          <label className="block font-black text-sm text-gray-900 dark:text-white mb-2 uppercase tracking-wider">موقع مشغل الراديو</label>
                          <select
                            value={(siteSettings as any)?.radio_position || 'bottom-right'}
                            onChange={e => setSiteSettings({...siteSettings!, radio_position: e.target.value} as any)}
                            className="input-field"
                          >
                            <option value="bottom-right">أسفل اليمين (Floating)</option>
                            <option value="bottom-left">أسفل اليسار (Floating)</option>
                            <option value="bottom-center">أسفل الوسط</option>
                            <option value="top-right">أعلى اليمين</option>
                            <option value="top-left">أعلى اليسار</option>
                            <option value="center-right">وسط اليمين</option>
                            <option value="center-left">وسط اليسار</option>
                            <option value="hidden">إخفاء الراديو من الشات</option>
                          </select>
                          <p className="text-[11px] text-gray-400 mt-1">ℹ️ يمكنك سحب مشغل الراديو لأي مكان</p>
                        </div>

                        <div className="bg-red-50 dark:bg-red-900/10 p-6 rounded-2xl border-2 border-red-500/50 flex items-center justify-between">
                          <div>
                            <h4 className="font-black text-lg text-red-700 dark:text-red-400 flex items-center gap-2">
                              <ShieldAlert className="w-5 h-5" /> ريستارت للشات بالكامل!
                            </h4>
                            <p className="text-xs text-red-600/70 mt-1">سيقوم بحذف جميع الرسائل فوراً.</p>
                          </div>
                          <button 
                            onClick={async (e) => {
                                const btn = e.currentTarget;
                                btn.disabled = true;
                                toast.loading('🚀 بدء عملية الريستارت والفورمات...', { id: 'rs' });
                                
                                try {
                                  const { data: s } = await supabase.from('site_settings').select('id').limit(1).maybeSingle();
                                  if (!s) throw new Error('Settings not found');
                                  
                                  // 1. Get ALL public rooms
                                  const { data: publicRooms } = await supabase.from('chat_rooms').select('id').eq('type', 'public');
                                  
                                  // 2. Send visible warning to ALL rooms so ALL users see it
                                  if (publicRooms && publicRooms.length > 0) {
                                    const warningMessages = publicRooms.map(room => ({
                                      user_id: currentUser?.id,
                                      room_id: room.id,
                                      content: '🚨 تنبيه من الإدارة: جاري إعادة تشغيل الشات وتفريغ الرسائل الآن... سيتم تحديث الصفحة تلقائياً',
                                      type: 'system'
                                    }));
                                    await supabase.from('messages').insert(warningMessages);
                                  }

                                  // 3. Wait 2 seconds so users see the warning
                                  await new Promise(r => setTimeout(r, 2000));

                                  // 4. CLEAR ALL MESSAGES
                                  await supabase.from('messages').delete().neq('id', '00000000-0000-0000-0000-000000000000');
                                  
                                  // 5. TRIGGER RELOAD SIGNAL via site_settings
                                  await supabase.from('site_settings').update({ 
                                    chat_restart_signal: new Date().toISOString() 
                                  }).eq('id', s.id);
                                  
                                  toast.success('تم الريستارت بنجاح!', { id: 'rs' });
                                } catch (err: any) {
                                  console.error('Restart error:', err);
                                  toast.error(`❌ خطأ في الريستارت: ${err.message}`, { id: 'rs' });
                                } finally {
                                  btn.disabled = false;
                                }
                              }}
                              className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-3 rounded-2xl font-black shadow-lg shadow-amber-500/30 transition-all flex items-center gap-2"
                            >
                              <RotateCcw className="w-5 h-5" /> بدء ريستارت الشات
                            </button>
                         </div>

                        {/* === Ad Space Section === */}
                        <div className={clsx(
                          "p-6 rounded-2xl border-2 transition-all",
                          (siteSettings as any)?.ad_space_enabled
                            ? "bg-amber-50 dark:bg-amber-900/10 border-amber-400/60"
                            : "bg-gray-50 dark:bg-dark-800 border-dashed border-gray-300 dark:border-dark-600"
                        )}>
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h4 className="font-black text-lg flex items-center gap-2">
                                📢 المساحة الإعلانية في الشات
                              </h4>
                              <p className="text-xs text-gray-500 mt-0.5">عند التفعيل يظهر بانر إعلاني في صفحة الشات مرتبط بإعلاناتك</p>
                            </div>
                            <button
                              onClick={() => setSiteSettings({...siteSettings!, ad_space_enabled: !(siteSettings as any)?.ad_space_enabled} as any)}
                              className={clsx(
                                'px-5 py-2 rounded-xl font-bold shadow-sm transition-all',
                                (siteSettings as any)?.ad_space_enabled
                                  ? 'bg-amber-500 text-white hover:bg-amber-600'
                                  : 'bg-gray-200 dark:bg-dark-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300'
                              )}
                            >
                              {(siteSettings as any)?.ad_space_enabled ? 'مفعلة ✅' : 'معطلة'}
                            </button>
                          </div>
                          {(siteSettings as any)?.ad_space_enabled && (
                            <div>
                              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">موقع البانر في الشات</label>
                              <select
                                value={(siteSettings as any)?.ad_space_position || 'top'}
                                onChange={e => setSiteSettings({...siteSettings!, ad_space_position: e.target.value as any} as any)}
                                className="input-field"
                              >
                                <option value="top">أعلى منطقة الرسائل (Top)</option>
                                <option value="bottom">إعلان الشريط الجانبي (Sidebar Ad)</option>
                              </select>
                              <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 font-bold">⚠️ يجب إضافة إعلان من صفحة «الإعلانات» أولاً ليظهر هنا.</p>
                            </div>
                          )}
                        </div>

                        {/* === Sidebar VIP Ad Section === */}
                        <div className={clsx(
                          "p-6 rounded-2xl border-2 transition-all",
                          (siteSettings as any)?.sidebar_vip_enabled !== false
                            ? "bg-purple-50 dark:bg-purple-900/10 border-purple-400/60"
                            : "bg-gray-50 dark:bg-dark-800 border-dashed border-gray-300 dark:border-dark-600"
                        )}>
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h4 className="font-black text-lg flex items-center gap-2">
                                🌟 إعلان الشريط الجانبي (الافتراضي)
                              </h4>
                              <p className="text-xs text-gray-500 mt-0.5">حدد محتوى الإعلان الافتراضي أو قم بإيقافه</p>
                            </div>
                            <button
                              onClick={() => setSiteSettings({...siteSettings!, sidebar_vip_enabled: (siteSettings as any)?.sidebar_vip_enabled === false ? true : false} as any)}
                              className={clsx(
                                'px-5 py-2 rounded-xl font-bold shadow-sm transition-all',
                                (siteSettings as any)?.sidebar_vip_enabled !== false
                                  ? 'bg-purple-500 text-white hover:bg-purple-600'
                                  : 'bg-gray-200 dark:bg-dark-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300'
                              )}
                            >
                              {(siteSettings as any)?.sidebar_vip_enabled !== false ? 'مفعل ✅' : 'معطل'}
                            </button>
                          </div>
                          {(siteSettings as any)?.sidebar_vip_enabled !== false && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">النص العلوي (مثال: إعلان مميز)</label>
                                <input
                                  value={(siteSettings as any)?.sidebar_vip_text || ''}
                                  onChange={e => setSiteSettings({...siteSettings!, sidebar_vip_text: e.target.value} as any)}
                                  className="input-field"
                                  placeholder="إعلان مميز"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">العنوان الرئيسي (مثال: اشترك في VIP)</label>
                                <input
                                  value={(siteSettings as any)?.sidebar_vip_title || ''}
                                  onChange={e => setSiteSettings({...siteSettings!, sidebar_vip_title: e.target.value} as any)}
                                  className="input-field"
                                  placeholder="اشترك في VIP"
                                />
                              </div>
                              <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">النص السفلي (مثال: واحصل على اسم ملون)</label>
                                <input
                                  value={(siteSettings as any)?.sidebar_vip_subtext || ''}
                                  onChange={e => setSiteSettings({...siteSettings!, sidebar_vip_subtext: e.target.value} as any)}
                                  className="input-field"
                                  placeholder="واحصل على اسم ملون"
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* === Admin Invisible Mode === */}
                        <div className={clsx(
                          "p-6 rounded-2xl border-2 transition-all flex items-center justify-between",
                          currentUser?.is_invisible 
                            ? "bg-slate-800 text-white border-slate-700" 
                            : "bg-blue-50 dark:bg-blue-900/10 border-blue-500/50"
                        )}>
                          <div>
                            <h4 className={clsx("font-black text-lg", currentUser?.is_invisible ? "text-white" : "text-blue-700 dark:text-blue-400")}>
                              {currentUser?.is_invisible ? 'وضع التخفي مفعل 👻' : 'أنت غير متخفي 👁️'}
                            </h4>
                            <p className={clsx("text-xs opacity-70", currentUser?.is_invisible ? "text-slate-300" : "")}>
                              عند التفعيل لن تظهر أبداً في قائمة المتواجدين للزوار والأعضاء الآخرين.
                            </p>
                          </div>
                          <button 
                            onClick={async () => {
                              if (!currentUser) return;
                              const nextInvisibleState = !currentUser?.is_invisible;
                              const { error } = await supabase.from('user_profiles').update({ is_invisible: nextInvisibleState }).eq('id', currentUser.id);
                              if (!error) {
                                setCurrentUser({ ...currentUser, is_invisible: nextInvisibleState });
                                toast.success(nextInvisibleState ? 'تم تفعيل التخفي بنجاح' : 'تم إيقاف التخفي');
                              }
                            }}
                            className={clsx(
                              "px-6 py-2 rounded-xl font-bold shadow-sm transition-all text-sm",
                              currentUser?.is_invisible 
                                ? "bg-slate-600 hover:bg-slate-700 text-white" 
                                : "bg-blue-600 text-white hover:bg-blue-700"
                            )}
                          >
                            {currentUser?.is_invisible ? 'الغى' : 'فعل'}
                          </button>
                        </div>

                       <div>
                         <label className="block font-black text-sm text-gray-900 dark:text-white mb-2 uppercase tracking-wider">اسم الشات / الموقع</label>
                         <input 
                            value={siteSettings?.site_name || ''} 
                            onChange={e => setSiteSettings({...siteSettings!, site_name: e.target.value})} 
                            className="input-field text-xl font-black bg-primary-50/30 border-primary-100 focus:bg-white" 
                         />
                       </div>
                       <div>
                         <label className="block font-bold mb-2 text-gray-700 dark:text-gray-300">الكلمات الدلالية (Keywords) للمحركات</label>
                         <textarea 
                            value={siteSettings?.keywords || ''} 
                            onChange={e => setSiteSettings({...siteSettings!, keywords: e.target.value})} 
                            className="input-field h-32" 
                            placeholder="دردشة مجانية، كلامنجي، شات مصري..."
                         />
                       </div>
                       <div className={clsx(
                         "p-6 rounded-2xl border-2 transition-all flex items-center justify-between",
                         siteSettings?.maintenance_mode 
                           ? "bg-red-50 dark:bg-red-900/10 border-red-500/50" 
                           : "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-500/50"
                       )}>
                          <div>
                            <h4 className={clsx("font-black text-lg", siteSettings?.maintenance_mode ? "text-red-700 dark:text-red-400" : "text-emerald-700 dark:text-emerald-400")}>
                              {siteSettings?.maintenance_mode ? 'وضع الصيانة نشط 🛑' : 'الموقع يعمل بشكل طبيعي ✅'}
                            </h4>
                            <p className="text-xs opacity-70">عند التفعيل، سيتم منع جميع الأعضاء من دخول الشات باستثناء الإدارة.</p>
                          </div>
                          <button 
                            onClick={() => setSiteSettings({...siteSettings!, maintenance_mode: !siteSettings?.maintenance_mode})}
                            className={clsx(
                              "px-6 py-2 rounded-xl font-bold shadow-sm transition-all",
                              siteSettings?.maintenance_mode 
                                ? "bg-red-600 text-white hover:bg-red-700" 
                                : "bg-emerald-600 text-white hover:bg-emerald-700"
                            )}
                          >
                            {siteSettings?.maintenance_mode ? 'إيقاف الصيانة' : 'بدء الصيانة'}
                          </button>
                       </div>
                    </div>
                 </div>
              </div>
            } />

            {/* Penalties Management */}
            <Route path="penalties" element={
              <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                <header>
                  <h1 className="text-3xl font-black">قائمة المحظورين والمكتومين 🛡️</h1>
                  <p className="text-gray-500 dark:text-gray-400 mt-1">إدارة العقوبات وفك الحظر/الكتم عن الأعضاء.</p>
                </header>

                <div className="grid grid-cols-1 gap-6">
                  <div className="bg-white dark:bg-dark-900 rounded-3xl border border-gray-100 dark:border-dark-800 overflow-hidden shadow-sm">
                    <table className="w-full text-right border-collapse">
                      <thead className="bg-gray-50 dark:bg-dark-800 border-b border-gray-100 dark:border-dark-700">
                        <tr>
                          <th className="p-5 font-bold text-gray-500 dark:text-gray-400">المستخدم</th>
                          <th className="p-5 font-bold text-gray-500 dark:text-gray-400">نوع العقوبة</th>
                          <th className="p-5 font-bold text-gray-500 dark:text-gray-400">تنتهي في</th>
                          <th className="p-5 font-bold text-gray-500 dark:text-gray-400">الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 dark:divide-dark-800">
                        {users.filter(u => u.is_banned || u.is_muted).length === 0 ? (
                          <tr>
                            <td colSpan={4} className="p-10 text-center text-gray-400 font-bold">لا يوجد مستخدمون محظورون أو مكتومون حالياً.</td>
                          </tr>
                        ) : (
                          users.filter(u => u.is_banned || u.is_muted).map(u => (
                            <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-dark-800/50 transition-colors">
                              <td className="p-5">
                                <div className="flex items-center gap-3">
                                   <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-dark-700 flex items-center justify-center font-bold">
                                     {u.avatar ? <img src={u.avatar} className="w-full h-full rounded-full object-cover" /> : u.username.charAt(0)}
                                   </div>
                                   <div>
                                     <p className="font-bold">{u.username}</p>
                                     <p className="text-[10px] text-gray-400 font-bold">{u.role}</p>
                                   </div>
                                </div>
                              </td>
                              <td className="p-5 text-sm">
                                {u.is_banned && <span className="bg-red-500/10 text-red-600 px-3 py-1 rounded-full font-bold ml-2">حظر نهائي</span>}
                                {u.is_muted && <span className="bg-amber-500/10 text-amber-600 px-3 py-1 rounded-full font-bold">كتم صوت</span>}
                              </td>
                              <td className="p-5 text-xs font-bold text-gray-500">
                                {u.muted_until ? new Date(u.muted_until).toLocaleString('ar-EG') : (u.is_muted || u.is_banned ? 'مستمر' : '-')}
                              </td>
                              <td className="p-5 text-center">
                                <div className="flex justify-center gap-2">
                                  {u.is_banned && (
                                    <button 
                                      onClick={async () => {
                                        await supabase.from('user_profiles').update({ is_banned: false }).eq('id', u.id);
                                        setUsers(users.map(prev => prev.id === u.id ? { ...prev, is_banned: false } : prev));
                                        toast.success(`تم فك حظر ${u.username}`);
                                      }}
                                      className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-1.5 rounded-xl font-bold text-xs shadow-lg shadow-emerald-500/20"
                                    >
                                      فك الحظر
                                    </button>
                                  )}
                                  {u.is_muted && (
                                    <button 
                                      onClick={async () => {
                                        await supabase.from('user_profiles').update({ is_muted: false, muted_until: null }).eq('id', u.id);
                                        setUsers(users.map(prev => prev.id === u.id ? { ...prev, is_muted: false, muted_until: null } : prev));
                                        toast.success(`تم فك كتم ${u.username}`);
                                      }}
                                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1.5 rounded-xl font-bold text-xs shadow-lg shadow-blue-500/20"
                                    >
                                      فك الكتم
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            } />

            {/* Pages Management */}
            <Route path="pages" element={
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h1 className="text-2xl font-bold">إدارة الصفحات الثابتة</h1>
                  <button 
                    onClick={() => {
                      const title = prompt('عنوان الصفحة:');
                      const slug = prompt('رابط الصفحة (slug):');
                      if (title && slug) {
                        supabase.from('pages').insert([{ title, slug, content: 'محتوى جديد...' }]).select().single().then(({ data }) => {
                          if (data) setPages([data, ...pages]);
                        });
                      }
                    }}
                    className="btn-primary flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" /> إضافة صفحة
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {pages.map(page => (
                    <div key={page.id} className="bg-white dark:bg-dark-900 p-6 rounded-3xl border border-gray-100 dark:border-dark-800 space-y-4 shadow-sm">
                       <div className="flex justify-between items-center">
                          <div>
                             <h3 className="font-black text-xl text-primary-600 dark:text-primary-400">{page.title}</h3>
                             <p className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest">/{page.slug}</p>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={async () => {
                              if (confirm('حذف الصفحة؟')) {
                                await supabase.from('pages').delete().eq('id', page.id);
                                setPages(pages.filter(p => p.id !== page.id));
                              }
                            }} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">حذف</button>
                          </div>
                       </div>
                       <textarea 
                        value={page.content}
                        onChange={(e) => setPages(pages.map(p => p.id === page.id ? { ...p, content: e.target.value } : p))}
                        className="w-full p-6 rounded-xl border-2 border-gray-200 dark:border-dark-600 bg-white dark:bg-black text-gray-950 dark:text-white font-mono text-sm h-80 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all shadow-inner"
                        dir="ltr"
                        spellCheck="false"
                       />
                       <button 
                        onClick={async () => {
                          await supabase.from('pages').update({ content: page.content }).eq('id', page.id);
                          toast.success('تم حفظ المحتوى بنجاح');
                        }}
                        className="btn-primary w-full py-2" 
                       >
                         حفظ التغييرات
                       </button>
                    </div>
                  ))}
                </div>
              </div>
            } />
          </Routes>
        </main>
      </div>
    </div>
  );
}
