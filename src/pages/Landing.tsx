import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../lib/store';
import toast from 'react-hot-toast';
import { ArrowRight, ChevronRight, MessageSquare, Info, ShieldCheck, Mail, Send, User, FileText } from 'lucide-react';
import type { ChatRoom, StaticPage } from '../lib/types';

export default function Landing() {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const { slug } = useParams();
  const [page, setPage] = useState<StaticPage | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { siteSettings, currentUser, setActiveRoom, joinRoom } = useAppStore();

  useEffect(() => {
    supabase.from('chat_rooms').select('*').eq('type', 'public').order('name').then(({ data }) => {
      if (data) setRooms(data);
    });
  }, []);

  useEffect(() => {
    if (slug) {
      setLoading(true);
      supabase.from('pages').select('*').eq('slug', slug).maybeSingle().then(({ data }) => {
        setPage(data);
        setLoading(false);
      });
    } else {
      setPage(null);
      setLoading(false);
    }
  }, [slug]);

  const handleJoinRoom = (room: ChatRoom) => {
    if (!currentUser) {
      navigate('/login');
    } else {
      joinRoom(room);
      setActiveRoom(room);
      navigate('/');
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-900">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary-500"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-dark-950 font-sans flex flex-col text-gray-900 dark:text-gray-100 transition-colors">
      {/* Hero Header */}
      <header className="bg-white dark:bg-dark-900 border-b border-gray-100 dark:border-dark-800 py-6 px-4 sticky top-0 z-20 shadow-sm">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link to="/" className="text-2xl font-black text-primary-600 flex items-center gap-2">
            <span className="text-3xl">💬</span>
            {siteSettings?.site_name || 'حكاوينا شات'}
          </Link>
          <div className="flex gap-4">
            <Link to="/login" className="px-6 py-2 rounded-xl border-2 border-gray-100 dark:border-dark-700 font-bold hover:bg-gray-50 dark:hover:bg-dark-800 transition">دخول</Link>
            <Link to="/register" className="px-6 py-2 rounded-xl bg-primary-600 text-white font-bold shadow-lg shadow-primary-500/20 hover:bg-primary-700 transition">سجل مجاناً</Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full p-6 space-y-12">
        {page ? (
          <div className="bg-white dark:bg-dark-900 p-8 sm:p-12 rounded-3xl border border-gray-100 dark:border-dark-800 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-4xl font-black mb-8 border-b-4 border-primary-500 pb-4 inline-block">{page.title}</h1>
            
            {slug === 'contact' ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-6">
                   <div className="prose prose-lg dark:prose-invert max-w-none prose-p:text-gray-800 dark:prose-p:text-gray-200">
                      <div className="text-gray-800 dark:text-gray-200 leading-relaxed" dangerouslySetInnerHTML={{ __html: page.content }} />
                   </div>
                   <div className="p-6 bg-primary-50 dark:bg-primary-900/10 rounded-2xl border border-primary-100 dark:border-primary-900/20">
                      <h3 className="font-black text-primary-600 mb-2 flex items-center gap-2">
                        <Info className="w-5 h-5" /> معلومات سريعة
                      </h3>
                      <p className="text-sm text-gray-500 leading-relaxed">
                         سيتم الرد على استفسارك خلال 24 ساعة عمل. يرجى التأكد من كتابة بريدك الإلكتروني بشكل صحيح.
                      </p>
                   </div>
                </div>

                <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); toast.success('تم إرسال رسالتك بنجاح! سنتواصل معك قريباً.'); }}>
                  <div className="space-y-1">
                    <label className="text-sm font-black text-gray-500 flex items-center gap-2">
                      <User className="w-4 h-4 text-primary-500" /> الاسم الكامل
                    </label>
                    <input 
                      type="text" 
                      required
                      placeholder="مثال: أحمد محمد"
                      className="w-full px-5 py-4 bg-gray-50 dark:bg-dark-800 border-2 border-transparent focus:border-primary-500 focus:bg-white dark:focus:bg-black rounded-2xl transition-all outline-none font-bold text-gray-900 dark:text-white"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-sm font-black text-gray-500 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-primary-500" /> البريد الإلكتروني
                    </label>
                    <input 
                      type="email" 
                      required
                      placeholder="name@example.com"
                      className="w-full px-5 py-4 bg-gray-50 dark:bg-dark-800 border-2 border-transparent focus:border-primary-500 focus:bg-white dark:focus:bg-black rounded-2xl transition-all outline-none font-bold text-gray-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-black text-gray-500 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary-500" /> نص الرسالة
                    </label>
                    <textarea 
                      required
                      rows={4}
                      placeholder="اكتب ما تريد إخبارنا به هنا..."
                      className="w-full px-5 py-4 bg-gray-50 dark:bg-dark-800 border-2 border-transparent focus:border-primary-500 focus:bg-white dark:focus:bg-black rounded-2xl transition-all outline-none font-bold text-gray-900 dark:text-white resize-none"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-5 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-black text-xl shadow-xl shadow-primary-500/30 flex items-center justify-center gap-3 active:scale-95 transition-all"
                  >
                    إرسال الرسالة <Send className="w-6 h-6" />
                  </button>
                </form>
              </div>
            ) : (
              <div className="prose prose-lg dark:prose-invert max-w-none prose-p:text-gray-800 dark:prose-p:text-gray-200 prose-headings:text-gray-900 dark:prose-headings:text-white prose-headings:font-black">
                 <div className="text-gray-800 dark:text-gray-200 leading-relaxed" dangerouslySetInnerHTML={{ __html: page.content }} />
              </div>
            )}

            <div className="mt-12 pt-8 border-t border-gray-100 dark:border-dark-800 flex justify-center">
               <Link to="/" className="flex items-center gap-2 text-primary-600 font-black hover:gap-3 transition-all">
                  <ArrowRight className="w-5 h-5 rtl:rotate-180" /> العودة للرئيسية
               </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Rooms Section */}
            <section className="animate-in fade-in duration-700">
              <div className="text-center mb-10">
                <h2 className="text-3xl font-black mb-2">غرف الدردشة المتاحة 🌍</h2>
                <p className="text-gray-500">اختر غرفتك المفضلة وابدأ التعارف الآن</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {rooms.map(room => (
                  <div 
                    key={room.id} 
                    onClick={() => handleJoinRoom(room)}
                    className="group bg-white dark:bg-dark-900 p-8 rounded-3xl border border-gray-100 dark:border-dark-800 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all cursor-pointer relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary-500/5 rounded-full -translate-x-12 -translate-y-12 group-hover:scale-150 transition-transform duration-500" />
                    <div className="flex flex-col items-center text-center relative z-10">
                      <div className="text-5xl mb-6 transform group-hover:scale-125 transition-transform duration-300 drop-shadow-md">
                        {room.icon || '💬'}
                      </div>
                      <h3 className="text-2xl font-black mb-3">{room.name}</h3>
                      <p className="text-gray-500 text-sm mb-6 line-clamp-2">{room.description || 'أفضل غرفة للدردشة والتعارف وبناء صداقات جديدة.'}</p>
                      {room.topic && (
                        <div className="mb-6 px-4 py-1.5 bg-primary-50 dark:bg-primary-900/20 text-primary-600 text-xs font-black rounded-full border border-primary-100">
                          {room.topic}
                        </div>
                      )}
                      <button className="w-full py-4 bg-gray-50 dark:bg-dark-800 group-hover:bg-primary-600 group-hover:text-white rounded-2xl font-black flex items-center justify-center gap-2 transition-all">
                        دخول الغرفة <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

             {/* Features Section */}
             <section className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-12">
                {[
                  { title: 'دردشة فورية', desc: 'تحدث مع الجميع بسرعة البرق وبدون انتظار.', icon: MessageSquare, color: 'blue' },
                  { title: 'أمان وخصوصية', desc: 'بياناتك مشفرة ومحمية بأحدث التقنيات.', icon: ShieldCheck, color: 'emerald' },
                  { title: 'دعم فني', desc: 'نحن معك دائماً لحل أي مشكلة تواجهك.', icon: Mail, color: 'purple' },
                ].map((f, i) => (
                  <div key={i} className="bg-white dark:bg-dark-900 p-8 rounded-3xl border border-gray-100 dark:border-dark-800 text-center shadow-sm">
                    <div className={`w-14 h-14 bg-${f.color}-500/10 text-${f.color}-600 rounded-2xl flex items-center justify-center mx-auto mb-6`}>
                      <f.icon className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-black mb-2">{f.title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
                  </div>
                ))}
            </section>
          </div>
        )}
      </main>

      {/* Footer Links Page Icons */}
      <footer className="bg-white dark:bg-dark-900 border-t border-gray-100 dark:border-dark-800 py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-wrap justify-center gap-8 mb-8">
            <Link to="/page/about" className="flex items-center gap-2 text-gray-500 hover:text-primary-600 font-bold transition">
              <Info className="w-5 h-5" /> من نحن
            </Link>
            <Link to="/page/privacy" className="flex items-center gap-2 text-gray-500 hover:text-primary-600 font-bold transition">
              <ShieldCheck className="w-5 h-5" /> سياسة الخصوصية
            </Link>
            <Link to="/page/contact" className="flex items-center gap-2 text-gray-500 hover:text-primary-600 font-bold transition">
              <Mail className="w-5 h-5" /> اتصل بنا
            </Link>
          </div>
          <div className="text-center text-gray-400 text-xs font-bold uppercase tracking-widest">
            جميع الحقوق محفوظة © {new Date().getFullYear()} {siteSettings?.site_name}
          </div>
        </div>
      </footer>
    </div>
  );
}
