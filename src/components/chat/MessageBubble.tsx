import type { Message } from '../../lib/types';
import { clsx } from 'clsx';
import { CheckCheck } from 'lucide-react';
import { useAppStore } from '../../lib/store';

interface Props {
  message: Message;
}

export default function MessageBubble({ message }: Props) {
  const { currentUser } = useAppStore();
  const isMe = message.user_id === currentUser?.id;
  const roleColors: Record<string, string> = {
    Admin: 'text-red-500',
    Super: 'text-purple-500',
    VIP: 'text-yellow-500',
    Moderator: 'text-blue-500',
    User: 'text-primary-600 dark:text-primary-400'
  };

  if (message.type === 'system') {
    return (
      <div className="w-full flex justify-center my-4 animate-in fade-in zoom-in duration-500">
        <div className="bg-primary-500/10 dark:bg-primary-500/5 border border-primary-500/20 px-6 py-2 rounded-full shadow-sm backdrop-blur-sm">
           <p className="text-[13px] font-black text-primary-600 dark:text-primary-400 text-center flex items-center gap-2">
             <span className="animate-pulse">📢</span>
             {message.content}
           </p>
        </div>
      </div>
    );
  }

  return (
    <div className={clsx("flex w-full gap-3 max-w-2xl", isMe ? "ml-auto flex-row-reverse" : "mr-auto")}>
      {!isMe && (
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-200 dark:bg-dark-700 flex items-center justify-center font-bold text-gray-500 overflow-hidden mt-auto">
          {message.profiles?.avatar ? (
            <img src={message.profiles.avatar} alt="" className="w-full h-full object-cover" />
          ) : (
             message.profiles?.username?.charAt(0).toUpperCase()
          )}
        </div>
      )}
      
      <div className={clsx("flex flex-col gap-1 min-w-[120px]", isMe ? "items-end" : "items-start")}>
        {!isMe && (
          <div className="flex items-center gap-2 px-1 mb-1">
             <span 
               className={clsx("text-xs font-black flex items-center gap-1", !message.profiles?.name_color && roleColors[message.profiles?.role || 'User'])}
               style={{ 
                 color: message.profiles?.name_color || undefined,
                 textShadow: message.profiles?.name_glow || 'none'
               }}
             >
               {message.profiles?.name_decoration?.replace('[name]', message.profiles?.username || '') || message.profiles?.username}
               {message.profiles?.role === 'Super' && <span className="text-[10px]" title="سوبر">🌟</span>}
               {message.profiles?.role === 'VIP' && <span className="text-[10px]" title="VIP">👑</span>}
             </span>
             {message.profiles?.role === 'Admin' && <span className="bg-red-100 text-red-600 text-[10px] px-1.5 py-0.5 rounded font-bold border border-red-200 shadow-sm">الإدارة</span>}
          </div>
        )}
        <div className={clsx(
          "px-4 py-2.5 rounded-2xl relative group",
          isMe 
            ? "bg-primary-500 text-white shadow-md shadow-primary-500/20" 
            : "bg-white dark:bg-dark-800 border border-gray-100 dark:border-dark-700 text-gray-800 dark:text-gray-100 shadow-sm",
          message.type === 'text' ? (isMe ? 'rounded-br-sm' : 'rounded-bl-sm') : 'p-2'
        )}>
          {message.type === 'image' ? (
            <img src={message.content} alt="مرفق" className="max-w-xs rounded-xl" />
          ) : message.type === 'file' ? (
            <div className="flex bg-black/10 dark:bg-white/10 p-2 rounded-xl items-center gap-2 text-sm font-semibold">
              <span className="text-xl">📄</span> 
              <span className="break-all">{message.content}</span>
            </div>
          ) : (
            <p 
              className="text-[15px] leading-relaxed break-words"
              style={{
                color: message.profiles?.font_color || undefined,
                fontSize: message.profiles?.font_size === 'large' ? '1.25rem' : message.profiles?.font_size === 'small' ? '0.875rem' : '1rem',
                fontWeight: message.profiles?.font_weight === 'bold' ? 'bold' : 'normal'
              }}
            >
              {message.content}
            </p>
          )}
          <div className={clsx(
            "flex items-center gap-1 mt-1 text-[10px]",
            isMe ? "text-primary-100 justify-end" : "text-gray-400 justify-start"
          )}>
            <span>{new Date(message.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
            {isMe && <CheckCheck className="w-3 h-3 text-white" />}
          </div>
        </div>
      </div>
    </div>
  );
}
