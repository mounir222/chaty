import { useState, useEffect } from 'react';
import Navbar from '../components/layout/Navbar';
import { CheckCircle, Crown, Star, Wallet, Send, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { SubscriptionPlan, PaymentMethod } from '../lib/types';

export default function Subscriptions() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [payments, setPayments] = useState<PaymentMethod[]>([]);

  useEffect(() => {
    supabase.from('subscription_plans').select('*').then(({ data }) => data && setPlans(data));
    supabase.from('payment_methods').select('*').eq('active', true).then(({ data }) => data && setPayments(data));
  }, []);

  const getPlanStyle = (role: string) => {
    if (role === 'VIP') return { icon: Crown, color: 'from-amber-400 to-yellow-600', shadow: 'shadow-yellow-500/20' };
    if (role === 'Super') return { icon: Star, color: 'from-purple-500 to-indigo-600', shadow: 'shadow-purple-500/20' };
    return { icon: Star, color: 'from-primary-500 to-blue-600', shadow: 'shadow-blue-500/20' };
  };

  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50 dark:bg-dark-900 bg-[url('/pattern.svg')] opacity-95 dark:opacity-100 bg-center">
      <Navbar />
      <main className="flex-1 overflow-y-auto p-4 sm:p-8">
        <div className="max-w-4xl mx-auto space-y-12 pb-12">
          
          <div className="text-center space-y-4 pt-8">
            <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-l from-primary-600 to-purple-600 pb-2">
              ارتقِ بتجربتك في الشات 🚀
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
              احصل على مميزات حصرية، زيّن اسمك بألوان وتاج، واستمتع بالتحكم الكامل في الدردشة!
            </p>
          </div>

          {!selectedPlan ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
              {plans.map(plan => {
                const style = getPlanStyle(plan.role_reward);
                const Icon = style.icon;
                return (
                <div key={plan.id} className={`bg-white dark:bg-dark-800 rounded-3xl p-8 relative overflow-hidden flex flex-col shadow-xl ${style.shadow} border border-gray-100 dark:border-dark-700 hover:scale-[1.02] transition-transform duration-300`}>
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${style.color} opacity-20 blur-3xl rounded-full -mr-16 -mt-16`}></div>
                  <div className="flex items-center gap-4 mb-6 relative">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${style.color} flex items-center justify-center text-white shadow-lg`}>
                       <Icon className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-gray-900 dark:text-white">{plan.name}</h3>
                      <p className="font-bold text-gray-500 dark:text-gray-400">
                        <span className="text-3xl text-gray-900 dark:text-white">{plan.price}{plan.currency}</span> / {plan.duration_days} يوم
                      </p>
                    </div>
                  </div>

                  <ul className="space-y-4 flex-1 mb-8 relative">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex gap-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center bg-gradient-to-br ${style.color} shrink-0`}>
                          <CheckCircle className="w-3 h-3 text-white" />
                        </div>
                        {f}
                      </li>
                    ))}
                  </ul>

                  <button 
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`w-full py-4 rounded-xl font-bold text-white shadow-lg bg-gradient-to-r ${style.color} hover:brightness-110 transition-all`}
                  >
                    اشترك الآن
                  </button>
                </div>
                );
              })}
            </div>
          ) : (
            <div className="max-w-xl mx-auto">
              <button 
                onClick={() => setSelectedPlan(null)}
                className="flex items-center gap-2 text-gray-500 hover:text-primary-600 mb-6 font-medium transition-colors"
              >
                <ArrowRight className="w-4 h-4 rtl:-scale-x-100" /> العودة للباقات
              </button>
              
              <div className="bg-white dark:bg-dark-800 rounded-3xl p-8 shadow-xl border border-gray-100 dark:border-dark-700">
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Wallet className="w-6 h-6 text-primary-500" />
                  اختر طريقة الدفع
                </h3>

                <div className="space-y-4 mb-8">
                  {payments.map(method => (
                    <div key={method.id} className="p-4 rounded-xl border border-gray-200 dark:border-dark-600 bg-gray-50 dark:bg-dark-900 hover:border-primary-500 transition-colors cursor-pointer group">
                      <div className="flex justify-between items-center mb-2">
                         <span className="font-bold text-lg group-hover:text-primary-600 transition-colors">{method.name}</span>
                         <span className="text-sm bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 px-2 py-1 rounded font-mono text-left" dir="ltr">{method.details}</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        قم بتحويل المبلغ المطلوب إلى الحساب الموضح أعلاه، ثم أرسل إيصال الدفع للإدارة لتفعيل اشتراكك فوراً.
                      </p>
                    </div>
                  ))}
                </div>

                <div className="bg-primary-50 dark:bg-primary-900/10 rounded-xl p-4 flex gap-4 text-sm text-primary-800 dark:text-primary-300">
                  <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                    <Send className="w-5 h-5 text-primary-600 z-10" />
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">بعد إتمام التحويل!</h4>
                    <p>قم بالتواصل مع الإدارة وإرسال اسم المستخدم الخاص بك وإيصال الدفع عبر وسائل التواصل الخاصة بالموقع أو للأدمن داخل الشات لتفعيل العضوية.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
