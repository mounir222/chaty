import { useState, useEffect } from 'react';
import type { UserProfile, ChatRoom } from '../../lib/types';
import { clsx } from 'clsx';
import { Shield, Search, User as UserIcon, Ban, VolumeX, Palette, Sparkles, XCircle, LogOut } from 'lucide-react';
import { useAppStore } from '../../lib/store';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

const DECORATIONS = [
  { label: 'بدون', value: '' },
  { label: 'نجوم ★', value: '★ [name] ★' },
  { label: 'تيجان ♛', value: '♛ [name] ♛' },
  { label: 'زهور ✿', value: '✿ [name] ✿' },
  { label: 'دوائر 🌀', value: '🌀 [name] 🌀' },
  { label: 'قلوب ♥', value: '♥ [name] ♥' },
  { label: 'أقواس 【】', value: '【 [name] 】' },
  { label: 'مربعات ▣', value: '▣ [name] ▣' },
];

const GLOW_COLORS = [
  { label: 'أحمر متوهج', value: '#ff4d4d', glow: '0 0 8px #ff4d4d' },
  { label: 'أزرق ملكي', value: '#0070f3', glow: '0 0 8px #0070f3' },
  { label: 'أخضر ليزر', value: '#00dfd8', glow: '0 0 8px #00dfd8' },
  { label: 'بنفسجي صارخ', value: '#7928ca', glow: '0 0 8px #7928ca' },
  { label: 'ذهبي نقي', value: '#f5a623', glow: '0 0 8px #f5a623' },
  { label: 'وردي فسفوري', value: '#ff0080', glow: '0 0 8px #ff0080' },
  { label: 'برتقالي شمسي', value: '#f76116', glow: '0 0 8px #f76116' },
];

const RoleIcon = ({ role }: { role: string }) => {
  const r = role?.toLowerCase();
  if (r === 'admin') return <Shield className="w-3 h-3 text-red-500" />;
  if (r === 'super') return <Shield className="w-3 h-3 text-orange-500" />;
  if (r === 'vip') return <span className="text-[10px]">👑</span>;
  if (r === 'moderator') return <Shield className="w-3 h-3 text-blue-500" />;
  return null;
};

const RoleBadge = ({ role }: { role: string }) => {
  const r = role?.toLowerCase();
  const styles: Record<string, string> = {
    admin: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
    super: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
    vip: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    moderator: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    user: 'bg-gray-100 dark:bg-dark-700 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-dark-600',
  };
  return (
    <span className={clsx('text-[8px] font-black border rounded-full px-1.5 py-0.5 uppercase tracking-wider', styles[r] || styles.user)}>
      {role}
    </span>
  );
};

const getInitialColors = (name: string) => {
  const colors = [
    ['#6366f1','#a5b4fc'], ['#8b5cf6','#c4b5fd'], ['#ec4899','#fbcfe8'],
    ['#f59e0b','#fde68a'], ['#10b981','#a7f3d0'], ['#3b82f6','#bfdbfe'],
    ['#ef4444','#fecaca'], ['#14b8a6','#99f6e4'],
  ];
  const idx = name.charCodeAt(0) % colors.length;
  return colors[idx] || colors[0];
};

export default function OnlineUsers() {
  const { setActiveRoom, currentUser, activeRoom } = useAppStore();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; user: UserProfile } | null>(null);
  const [showRankMenu, setShowRankMenu] = useState(false);
  const [showColorMenu, setShowColorMenu] = useState(false);
  const [showDecorMenu, setShowDecorMenu] = useState(false);
  const [showMuteMenu, setShowMuteMenu] = useState(false);
  const [showBanMenu, setShowBanMenu] = useState(false);

  const [actualOnlineIds, setActualOnlineIds] = useState<string[]>((window as any).actualOnlineIds || []);

  useEffect(() => {
    supabase.from('user_profiles').select('*').limit(100).order('created_at', { ascending: false }).then(({ data }) => {
      if (data) setUsers(data as UserProfile[]);
    });

    const handlePresence = (e: any) => {
      setActualOnlineIds(e.detail || []);
    };
    window.addEventListener('presence-sync', handlePresence);

    const profileChannel = supabase.channel('profile-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_profiles' }, (payload) => {
        if (payload.eventType === 'UPDATE') {
          setUsers(current => current.map(u => u.id === payload.new.id ? { ...u, ...payload.new } : u));
        } else if (payload.eventType === 'INSERT') {
          setUsers(current => {
            if (current.find(u => u.id === payload.new.id)) return current;
            return [payload.new as UserProfile, ...current];
          });
        }
      })
      .subscribe();

    const handleClick = () => {
      setContextMenu(null);
      setShowRankMenu(false);
      setShowColorMenu(false);
      setShowDecorMenu(false);
      setShowMuteMenu(false); setShowBanMenu(false);
      setShowBanMenu(false);
    };
    document.addEventListener('click', handleClick);
    return () => {
      window.removeEventListener('presence-sync', handlePresence);
      supabase.removeChannel(profileChannel);
      document.removeEventListener('click', handleClick);
    };
  }, []);

  const handleContextMenu = (e: React.MouseEvent, user: UserProfile) => {
    e.preventDefault();
    // Smart Positioning to prevent menu from going off-screen
    const menuWidth = 210;
    const menuHeight = 350; // Estimated max height
    let x = e.clientX;
    let y = e.clientY;

    if (x + menuWidth > window.innerWidth) x -= menuWidth;
    if (y + menuHeight > window.innerHeight) y -= menuHeight;
    if (y < 0) y = 10;
    if (x < 0) x = 10;

    setContextMenu({ x, y, user });
  };

  const sendSystemMessage = async (content: string) => {
    if (!activeRoom) return;
    await supabase.from('messages').insert([{
      user_id: currentUser?.id,
      room_id: activeRoom.id,
      content: content,
      type: 'system'
    }]);
  };

  const updateProfile = async (targetUser: UserProfile, updates: any, actionName: string) => {
    if (!currentUser) return;
    
    // Optimistic Update
    setUsers(current => current.map(u => u.id === targetUser.id ? { ...u, ...updates } : u));
    
    const { error } = await supabase.from('user_profiles').update(updates).eq('id', targetUser.id);
    if (error) {
       toast.error(`فشل ${actionName}: ${error.message}`);
       // Revert optimistic update if needed? (optional for now)
    } else {
       toast.success(`تم ${actionName} بنجاح`);
       
       // Broadcast any admin action to everyone in the chat
       const isPenalAction = updates.role || updates.is_banned !== undefined || updates.is_muted !== undefined || updates.is_kicked !== undefined;
       const isAestheticAction = updates.name_color !== undefined || updates.name_decoration !== undefined || updates.name_glow !== undefined;
       
       if (isPenalAction || isAestheticAction) {
         sendSystemMessage(`👑 قام الـ ${currentUser.role} [${currentUser.username}] بـ (${actionName}) للعضو [${targetUser.username}]`);
       }
    }
    setContextMenu(null);
  };

  const displayUsers = users.filter(u => {
    // 1. Must be in actual online IDs (literally has the app open)
    const isOnline = actualOnlineIds.includes(u.id) || u.id === currentUser?.id;
    // 2. Must not be an Admin (hide admin from list)
    const isNotAdmin = u.role?.toLowerCase() !== 'admin';
    // 3. Search term filter
    const matchesSearch = u.username?.toLowerCase().includes(searchTerm.toLowerCase());
    // 4. Other flags
    const isVisible = !u.is_invisible && !u.is_kicked;

    return isOnline && isNotAdmin && matchesSearch && isVisible;
  });

  const onlineCount = displayUsers.length;
  const isAdmin = (currentUser?.role?.toLowerCase() === 'admin' || currentUser?.role?.toLowerCase() === 'super' || activeRoom?.creator_id === currentUser?.id);

  return (
    <aside className="hidden xl:flex flex-col w-64 bg-white dark:bg-dark-800 border-r border-gray-200 dark:border-dark-700 h-[calc(100vh-4rem)] relative shadow-lg">
      <div className="p-4 flex flex-col h-full">
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-gray-50 dark:bg-dark-900 border border-gray-100 dark:border-dark-700 rounded-2xl py-2 pr-10 pl-3 text-xs focus:ring-2 focus:ring-primary-500/50 font-bold transition-all"
            placeholder="ابحث عن أصدقائك..."
          />
        </div>

        {/* Header with count */}
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">المتواجدون الآن</h2>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block"></span>
            <span className="bg-green-500 text-white px-2 py-0.5 rounded-full text-[9px] font-black">{onlineCount}</span>
          </div>
        </div>

        {/* Users List */}
        <div className="flex-1 overflow-y-auto space-y-0.5 pr-1">
          {displayUsers.map((user) => {
            const [bgColor, textColor] = getInitialColors(user.username || 'A');
            const isCurrentUser = user.id === currentUser?.id;
            
            // Apply name decoration if exists
            let displayName = user.username;
            if (user.name_decoration && user.name_decoration.includes('[name]')) {
               displayName = user.name_decoration.replace('[name]', user.username);
            }

            return (
              <div
                key={user.id}
                onContextMenu={(e) => !isCurrentUser && handleContextMenu(e, user)}
                onClick={() => {
                  if (isCurrentUser) return;
                  setActiveRoom({
                    id: user.id,
                    name: user.username,
                    type: 'private',
                    icon: '💬',
                    description: 'محادثة خاصة',
                    created_at: new Date().toISOString()
                  } as ChatRoom);
                }}
                className={clsx(
                  "flex items-center gap-3 p-2.5 rounded-2xl transition-all",
                  isCurrentUser
                    ? "bg-primary-50 dark:bg-primary-900/10 cursor-default"
                    : "hover:bg-gray-50 dark:hover:bg-dark-900/60 cursor-pointer group",
                  user.is_banned && "opacity-40"
                )}
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm overflow-hidden border-2 border-white dark:border-dark-700 shadow-sm"
                    style={{ background: user.avatar ? 'transparent' : `linear-gradient(135deg, ${bgColor}, ${textColor})` }}
                  >
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        className="w-full h-full object-cover"
                        alt={user.username}
                      />
                    ) : (
                      <span className="text-white font-black text-base">
                        {user.username?.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  {/* Online indicator */}
                  <div className={clsx(
                    "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-dark-800",
                    isCurrentUser || user.status === 'online' ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"
                  )} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 leading-none mb-1">
                    <span
                      className="text-sm font-black truncate py-0.5"
                      style={{ 
                        color: user.name_color || 'inherit',
                        textShadow: user.name_glow || 'none',
                        filter: user.name_glow ? 'drop-shadow(0 0 2px rgba(255,255,255,0.5))' : 'none'
                      }}
                    >
                      {displayName}
                      {isCurrentUser && <span className="text-primary-500 text-[9px] mr-1">(أنت)</span>}
                    </span>
                    <RoleIcon role={user.role} />
                  </div>
                  <RoleBadge role={user.role} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Admin Context Menu - Reworked for "Full Admin Control" */}
      {contextMenu && (() => {
        const meRole = currentUser?.role?.toLowerCase() || 'user';
        const tgtRole = contextMenu.user.role?.toLowerCase() || 'user';
        const isCreator = activeRoom?.creator_id === currentUser?.id;
        
        const canPunish = meRole === 'admin' || isCreator || 
          ((meRole === 'moderator' || meRole === 'super') && (tgtRole === 'user' || tgtRole === 'vip'));
          
        const canDecorate = meRole === 'admin' || 
          ((meRole === 'moderator' || meRole === 'super') && (tgtRole === 'user' || tgtRole === 'vip' || tgtRole === 'super'));
          
        const canPromote = meRole === 'admin' || meRole === 'moderator' || meRole === 'super';
        
        const availableRanks: string[] = [];
        if (meRole === 'admin') availableRanks.push('Admin', 'Super', 'Moderator', 'VIP', 'User');
        else if (meRole === 'moderator') availableRanks.push('Super', 'VIP', 'User');
        else if (meRole === 'super') availableRanks.push('VIP', 'User');

        return (
          <div
            className="fixed z-[9999] bg-white/95 dark:bg-dark-800/95 backdrop-blur-md border border-gray-200 dark:border-dark-700 rounded-2xl shadow-2xl overflow-hidden min-w-[210px] py-1 animate-in zoom-in-95 duration-100"
            style={{ top: contextMenu.y, left: contextMenu.x }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-2 border-b border-gray-100 dark:border-dark-700 mb-1 flex items-center justify-between">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{contextMenu.user.username}</p>
              {contextMenu.user.is_banned && <Ban className="w-3 h-3 text-red-500" />}
            </div>

            <button onClick={() => setContextMenu(null)} className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-primary-500 hover:text-white transition-colors">
              <UserIcon className="w-4 h-4" /> عرض الملف
            </button>

            {(canPromote || canDecorate || canPunish) && (
              <>
                <div className="h-px bg-gray-100 dark:bg-dark-700 my-1"></div>
                
                {/* Promotion Submenu */}
                {canPromote && availableRanks.length > 0 && (
                  <>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setShowRankMenu(!showRankMenu); setShowColorMenu(false); setShowDecorMenu(false); }}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-amber-500 hover:text-white transition-colors"
                    >
                      <div className="flex items-center gap-3"><Shield className="w-4 h-4" /> تغيير الرتبة</div>
                      <span className="text-[8px] opacity-50">◀</span>
                    </button>
                    {showRankMenu && (
                      <div className="bg-gray-50 dark:bg-dark-900 border-y border-gray-100 dark:border-dark-700 py-1">
                         {availableRanks.map(r => (
                           <button key={r} onClick={() => updateProfile(contextMenu.user, { role: r }, `ترقية إلى ${r}`)} className="w-full text-right px-10 py-1.5 text-[10px] font-bold hover:text-primary-500">{r}</button>
                         ))}
                      </div>
                    )}
                  </>
                )}

                {/* Decoration & Colors */}
                {canDecorate && (
                  <>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setShowDecorMenu(!showDecorMenu); setShowRankMenu(false); setShowColorMenu(false); }}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-purple-500 hover:text-white transition-colors"
                    >
                      <div className="flex items-center gap-3"><Sparkles className="w-4 h-4" /> زخرفة فنية</div>
                      <span className="text-[8px] opacity-50">◀</span>
                    </button>
                    {showDecorMenu && (
                      <div className="bg-gray-50 dark:bg-dark-900 border-y border-gray-100 dark:border-dark-700 py-1 max-h-40 overflow-y-auto">
                         {DECORATIONS.map(d => (
                           <button key={d.label} onClick={() => updateProfile(contextMenu.user, { name_decoration: d.value }, `زخرفة الاسم`)} className="w-full text-right px-10 py-1.5 text-[10px] font-bold hover:text-primary-500">{d.label}</button>
                         ))}
                      </div>
                    )}

                    <button 
                      onClick={(e) => { e.stopPropagation(); setShowColorMenu(!showColorMenu); setShowRankMenu(false); setShowDecorMenu(false); }}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-blue-500 hover:text-white transition-colors"
                    >
                      <div className="flex items-center gap-3"><Palette className="w-4 h-4" /> تلوين (متوهج)</div>
                      <span className="text-[8px] opacity-50">◀</span>
                    </button>
                    {showColorMenu && (
                      <div className="bg-gray-50 dark:bg-dark-900 border-y border-gray-100 dark:border-dark-700 py-1">
                         {GLOW_COLORS.map(c => (
                           <button 
                             key={c.label} 
                             onClick={() => updateProfile(contextMenu.user, { name_color: c.value, name_glow: c.glow }, `تلوين الاسم`)} 
                             className="w-full text-right px-10 py-1.5 text-[10px] font-bold flex items-center justify-end gap-2 hover:bg-white dark:hover:bg-dark-800"
                           >
                             {c.label}
                             <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.value, boxShadow: c.glow }}></div>
                           </button>
                         ))}
                         <button onClick={() => updateProfile(contextMenu.user, { name_color: null, name_glow: null }, `إزالة اللون`)} className="w-full text-right px-10 py-1.5 text-[10px] font-bold text-red-400">إزالة التلوين</button>
                      </div>
                    )}
                  </>
                )}

                {/* Punishment */}
                {canPunish && (
                  <>
                    <div className="h-px bg-gray-100 dark:bg-dark-700 my-1"></div>
                    
                    <button 
                      onClick={(e) => { e.stopPropagation(); setShowMuteMenu(!showMuteMenu); setShowRankMenu(false); setShowColorMenu(false); setShowDecorMenu(false); }}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-500 hover:text-white transition-colors"
                    >
                      <div className="flex items-center gap-3"><VolumeX className="w-4 h-4" /> كتم العضو</div>
                      <span className="text-[8px] opacity-50">◀</span>
                    </button>
                    {showMuteMenu && (
                      <div className="bg-gray-50 dark:bg-dark-900 border-y border-gray-100 dark:border-dark-700 py-1">
                         {[
                           { l: 'كتم نهائي', v: true, d: null },
                           { l: '10 دقائق', v: true, d: 10 },
                           { l: 'ساعة واحدة', v: true, d: 60 },
                           { l: '12 ساعة', v: true, d: 720 },
                           { l: 'فك الكتم', v: false, d: null },
                         ].map(m => (
                           <button 
                             key={m.l} 
                             onClick={() => {
                               const until = m.d ? new Date(Date.now() + m.d * 60000).toISOString() : null;
                               updateProfile(contextMenu.user, { is_muted: m.v, muted_until: until }, m.v ? `كتم (${m.l})` : 'فك الكتم');
                             }} 
                             className="w-full text-right px-10 py-1.5 text-[10px] font-bold hover:text-amber-500"
                           >
                             {m.l}
                           </button>
                         ))}
                      </div>
                    )}

                    <button 
                      onClick={() => updateProfile(contextMenu.user, { is_kicked: true }, 'طرد العضو')} 
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-orange-600 hover:bg-orange-500 hover:text-white transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> طرد فوري (Kick)
                    </button>

                    <button onClick={(e) => { e.stopPropagation(); setShowBanMenu(!showBanMenu); setShowMuteMenu(false); setShowRankMenu(false); setShowColorMenu(false); setShowDecorMenu(false); }} className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-500 hover:text-white transition-colors">
                      <div className="flex items-center gap-3"><Ban className="w-4 h-4" /> بند (حظر) العضو</div>
                      <span className="text-[8px] opacity-50">◀</span>
                    </button>
                    {showBanMenu && (
                      <div className="bg-gray-50 dark:bg-dark-900 border-y border-gray-100 dark:border-dark-700 py-1">
                         {[
                           { l: 'باند نهائي', v: true, d: null },
                           { l: 'باند 6 ساعات', v: true, d: 360 },
                           { l: 'باند 24 ساعة', v: true, d: 1440 },
                           { l: 'باند 3 أيام', v: true, d: 4320 },
                           { l: 'فك الحظر', v: false, d: null },
                         ].map(m => (
                           <button 
                             key={m.l} 
                             onClick={() => {
                               const until = m.d ? new Date(Date.now() + m.d * 60000).toISOString() : null;
                               updateProfile(contextMenu.user, { is_banned: m.v, banned_until: until }, m.v ? `حظر (${m.l})` : 'فك الحظر');
                             }} 
                             className="w-full text-right px-10 py-1.5 text-[10px] font-bold hover:text-red-500"
                           >
                             {m.l}
                           </button>
                         ))}
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        );
      })()}
    </aside>
  );
}

