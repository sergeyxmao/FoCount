import React from 'react';
import { Partner, UserRole } from '../types';
import { Icons } from '../constants';

// --- ВСТРОЕННАЯ ИКОНКА (чтобы не требовалась библиотека lucide-react) ---
const UserMinusIcon = ({ size = 24 }: { size?: number }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <line x1="22" x2="16" y1="11" y2="11" />
  </svg>
);
// -----------------------------------------------------------------------

interface PartnerDetailProps {
  partner: Partner;
  currentUserRole: UserRole;
  onBack: () => void;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  relationshipStatus: 'none' | 'pending' | 'confirmed' | 'rejected';
  onSendRequest: (type: 'mentor' | 'downline') => void;
  onStartChat: () => void;
  onDeleteRelationship: (id: string) => void;
}

const PartnerDetail: React.FC<PartnerDetailProps> = ({ 
  partner, 
  currentUserRole,
  onBack, 
  isFavorite, 
  onToggleFavorite, 
  relationshipStatus,
  onSendRequest,
  onStartChat,
  onDeleteRelationship, 
}) => {
  const isClient = currentUserRole === 'client';
  
  // LOGIC: Visibility based on Relations & Privacy Settings
  const isConnected = relationshipStatus === 'confirmed';
  const relationshipBadge = (() => {
    if (relationshipStatus === 'confirmed') {
      return { text: 'Связь уже существует', className: 'bg-green-100 text-green-700 border-green-200' };
    }
    if (relationshipStatus === 'pending') {
      return { text: 'Запрос отправлен', className: 'bg-amber-100 text-amber-700 border-amber-200' };
    }
    return null;
  })();

  // 1. Phone Visibility
  const isPhoneVisible = isConnected || partner.isOffice || (partner.isPublic && partner.visibilitySettings?.showPhone);

  // 2. Email Visibility
  const isEmailVisible = isConnected || partner.isOffice || (partner.isPublic && partner.visibilitySettings?.showEmail);

  // 3. Telegram Visibility
  const isTelegramVisible = isConnected || partner.isOffice || (partner.isPublic && partner.visibilitySettings?.showTelegram);

  // 4. VK Visibility
  const isVKVisible = isConnected || partner.isOffice || (partner.isPublic && partner.visibilitySettings?.showVK);

  // 5. Instagram Visibility
  const isInstagramVisible = isConnected || partner.isOffice || (partner.isPublic && partner.visibilitySettings?.showInstagram);

  // 6. WhatsApp Visibility
  const isWhatsAppVisible = isConnected || partner.isOffice || (partner.isPublic && partner.visibilitySettings?.showWhatsApp);

  // 7. Chat Permission
  const canChat = isConnected || (partner.isPublic && partner.visibilitySettings?.allowCrossLineMessages);

  // General Access (at least something is visible)
  const hasAccess = isConnected || partner.isPublic || partner.isOffice;

  return (
    <div className="h-screen bg-white z-50 animate-fade-in overflow-y-auto fixed inset-0 flex flex-col">
      {/* Header Image Area */}
      <div className={`relative h-60 ${hasAccess ? 'bg-amber-800' : 'bg-gray-700'}`}>
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <button 
          onClick={onBack}
          className="absolute top-4 left-4 p-2 bg-black/20 text-white rounded-full backdrop-blur-sm z-10 active:bg-black/40"
        >
          <Icons.ChevronLeft />
        </button>
        
        <div className="absolute -bottom-14 left-1/2 transform -translate-x-1/2">
           <img 
            src={partner.avatar || `https://ui-avatars.com/api/?name=${partner.name}&background=random`} 
            alt={partner.name}
            className={`w-28 h-28 rounded-full border-4 border-white shadow-xl object-cover ${!hasAccess ? 'grayscale' : ''}`}
          />
        </div>
      </div>

      <div className="mt-16 px-6 text-center">
        <h2 className="text-2xl font-bold text-gray-900 leading-tight">{partner.name}</h2>
        
        <div className="text-xs font-mono text-gray-400 mt-1 mb-2 tracking-widest bg-gray-50 inline-block px-3 py-1 rounded-md border border-gray-100">
          {partner.fohowId}
        </div>

        <div className="flex items-center justify-center gap-2 flex-wrap mb-4">
          <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold uppercase tracking-wider rounded-full">
            {partner.rank}
          </span>
          {partner.isOffice && (
             <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider rounded-full border border-blue-200">
               Представительство
             </span>
          )}
          {relationshipBadge && (
            <span
              className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full border ${relationshipBadge.className}`}
            >
              {relationshipBadge.text}
            </span>
          )}          
        </div>

       {/* CONNECTION REQUEST BUTTONS */}
       {!isClient && !isConnected && (
            <div className="flex gap-2 justify-center mb-6">
                {relationshipStatus === 'pending' ? (
                    <button disabled className="bg-gray-100 text-gray-500 px-6 py-2 rounded-full text-sm font-medium">
                        Запрос отправлен...
                    </button>
                ) : (
                    <>
                        <button 
                            onClick={() => onSendRequest('mentor')}
                            className="bg-amber-50 text-amber-700 border border-amber-200 px-4 py-2 rounded-xl text-sm font-bold active:bg-amber-100"
                        >
                            + В Наставники
                        </button>
                        <button 
                            onClick={() => onSendRequest('downline')}
                            className="bg-gray-50 text-gray-700 border border-gray-200 px-4 py-2 rounded-xl text-sm font-bold active:bg-gray-100"
                        >
                            + В Партнеры
                        </button>
                    </>
                )}
            </div>
       )}

        {/* --- ПАНЕЛЬ ИКОНОК (Звонок, Сообщение, Избранное, Удалить) --- */}
        {hasAccess ? (
          <div className="flex justify-center gap-6 pb-6 border-b border-gray-100 mt-6">
            
            {/* 1. ЗВОНОК */}
            {isPhoneVisible ? (
                <a href={`tel:${partner.phone}`} className="flex flex-col items-center gap-1 group text-gray-500 hover:text-amber-600">
                  <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center border border-gray-200 transition-colors group-hover:bg-amber-50 group-hover:border-amber-200">
                    <Icons.Phone />
                  </div>
                  <span className="text-[10px] font-medium">Звонок</span>
                </a>
            ) : (
                <div className="flex flex-col items-center gap-1 group text-gray-300">
                  <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100">
                    <Icons.Lock />
                  </div>
                  <span className="text-[10px] font-medium">Скрыто</span>
                </div>
            )}
            
            {/* 2. НАПИСАТЬ СООБЩЕНИЕ (Новая иконка) */}
            {canChat && !isClient && (
                <button 
                    onClick={onStartChat}
                    className="flex flex-col items-center gap-1 group text-gray-500 hover:text-amber-600"
                >
                  <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center border border-gray-200 transition-colors group-hover:bg-amber-50 group-hover:border-amber-200">
                    <Icons.Message />
                  </div>
                  <span className="text-[10px] font-medium">Написать</span>
                </button>
            )}

            {/* 3. ИЗБРАННОЕ */}
            <button onClick={() => onToggleFavorite(partner.id)} className={`flex flex-col items-center gap-1 group ${isFavorite ? 'text-red-500' : 'text-gray-500'}`}>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center border transition-colors ${isFavorite ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-200 group-hover:border-red-200 group-hover:bg-red-50 group-hover:text-red-500'}`}>
                <Icons.Heart filled={isFavorite} />
              </div>
              <span className="text-[10px] font-medium">Избранное</span>
            </button>

            {/* 4. УДАЛИТЬ ИЗ КОМАНДЫ (Новая иконка - Красный человечек) */}
            {!isClient && isConnected && (
                <button 
                    onClick={() => onDeleteRelationship(partner.id)}
                    className="flex flex-col items-center gap-1 group text-red-500 hover:text-red-600"
                >
                  <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center border border-red-100 transition-colors group-hover:bg-red-100 group-hover:border-red-200">
                    <UserMinusIcon size={20} />
                  </div>
                  <span className="text-[10px] font-medium">Удалить</span>
                </button>
            )}

          </div>
        ) : (
            <div className="text-gray-400 text-sm italic mb-6">
                Информация скрыта пользователем.
            </div>
        )}

        <div className="mt-6 text-left space-y-4">
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">О партнера</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
                {partner.bio || "Информация не указана."}
            </p>
          </div>
          
          <div className="pt-2">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Регион</h3>
            <p className="text-gray-900 font-medium">{partner.city}, {partner.country}</p>
          </div>

          {hasAccess && (
            <div className="pt-2">
               <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Контакты</h3>

               <div className="flex items-center justify-between py-1 border-b border-gray-50">
                   <span className="text-gray-500 text-sm">Телефон</span>
                   {isPhoneVisible && partner.phone ? (
                       <a href={`tel:${partner.phone}`} className="text-gray-900 font-medium hover:text-amber-600">{partner.phone}</a>
                   ) : (
                       <span className="text-gray-400 text-xs flex items-center gap-1"><Icons.Lock /> Скрыто</span>
                   )}
               </div>

               <div className="flex items-center justify-between py-1 border-b border-gray-50">
                   <span className="text-gray-500 text-sm">Email</span>
                   {isEmailVisible && partner.email ? (
                       <a href={`mailto:${partner.email}`} className="text-gray-900 font-medium hover:text-amber-600">{partner.email}</a>
                   ) : (
                       <span className="text-gray-400 text-xs flex items-center gap-1"><Icons.Lock /> Скрыто</span>
                   )}
               </div>

               {/* TELEGRAM */}
               {(!isTelegramVisible || partner.telegram_user) && (
                 <div className="flex items-center justify-between py-1 border-b border-gray-50">
                     <span className="text-gray-500 text-sm">Telegram</span>
                     {!isTelegramVisible ? (
                         <span className="text-gray-400 text-xs flex items-center gap-1"><Icons.Lock /> Скрыто</span>
                     ) : partner.telegram_user ? (
                         <a href={`https://t.me/${partner.telegram_user.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="text-gray-900 font-medium hover:text-amber-600">
                           @{partner.telegram_user.replace('@', '')}
                         </a>
                     ) : null}
                 </div>
               )}

               {/* WHATSAPP */}
               {(() => {
                   const whatsappValue = partner.whatsapp_contact || partner.phone;
                   if (!whatsappValue) return null;
                   
                   return (
                     <div className="flex items-center justify-between py-1 border-b border-gray-50">
                         <span className="text-gray-500 text-sm">WhatsApp</span>
                         {!isWhatsAppVisible ? (
                             <span className="text-gray-400 text-xs flex items-center gap-1"><Icons.Lock /> Скрыто</span>
                         ) : (
                             <a href={`https://wa.me/${whatsappValue.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-gray-900 font-medium hover:text-amber-600">
                               {whatsappValue}
                             </a>
                         )}
                     </div>
                   );
               })()}

               {/* VK */}
               {(!isVKVisible || partner.vk_profile) && (
                 <div className="flex items-center justify-between py-1 border-b border-gray-50">
                     <span className="text-gray-500 text-sm">VK</span>
                     {!isVKVisible ? (
                         <span className="text-gray-400 text-xs flex items-center gap-1"><Icons.Lock /> Скрыто</span>
                     ) : partner.vk_profile ? (
                         <a href={partner.vk_profile} target="_blank" rel="noopener noreferrer" className="text-gray-900 font-medium hover:text-amber-600">
                           Профиль
                         </a>
                     ) : null}
                 </div>
               )}

               {/* INSTAGRAM */}
               {(!isInstagramVisible || partner.instagram_profile) && (
                 <div className="flex items-center justify-between py-1 border-b border-gray-50">
                     <span className="text-gray-500 text-sm">Instagram</span>
                     {!isInstagramVisible ? (
                         <span className="text-gray-400 text-xs flex items-center gap-1"><Icons.Lock /> Скрыто</span>
                     ) : partner.instagram_profile ? (
                         <a href={partner.instagram_profile} target="_blank" rel="noopener noreferrer" className="text-gray-900 font-medium hover:text-amber-600">
                           Профиль
                         </a>
                     ) : null}
                 </div>
               )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default PartnerDetail;
