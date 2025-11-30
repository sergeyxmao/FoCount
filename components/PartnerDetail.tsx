import React from 'react';
import { Partner, UserRole } from '../types';
import { Icons } from '../constants';

interface PartnerDetailProps {
  partner: Partner;
  currentUserRole: UserRole;
  onBack: () => void;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  relationshipStatus: 'none' | 'pending' | 'confirmed' | 'rejected';
  onSendRequest: (type: 'mentor' | 'downline') => void;
  onStartChat: () => void;
}

const PartnerDetail: React.FC<PartnerDetailProps> = ({ 
  partner, 
  currentUserRole,
  onBack, 
  isFavorite, 
  onToggleFavorite, 
  relationshipStatus,
  onSendRequest,
  onStartChat
}) => {
  const isClient = currentUserRole === 'client';
  
  // LOGIC: Visibility based on Relations & Privacy Settings
  const isConnected = relationshipStatus === 'confirmed';
  
  // 1. Phone Visibility
  // Visible if: Connected OR (Public AND privacy.showPhone is true)
  const isPhoneVisible = isConnected || partner.isOffice || (partner.isPublic && partner.privacySettings?.showPhone);
  
  // 2. Email Visibility
  const isEmailVisible = isConnected || partner.isOffice || (partner.isPublic && partner.privacySettings?.showEmail);
  
  // 3. Chat Permission
  // Allowed if: Connected OR (Public AND privacy.allowCrossLineMessages is true)
  const canChat = isConnected || (partner.isPublic && partner.privacySettings?.allowCrossLineMessages);

  // General Access (at least something is visible)
  const hasAccess = isConnected || partner.isPublic || partner.isOffice;

  return (
    <div className="min-h-screen bg-white z-50 animate-fade-in pb-20">
      {/* Header Image Area */}
      <div className={`relative h-60 ${hasAccess ? 'bg-emerald-800' : 'bg-gray-700'}`}>
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
        </div>

        {/* CONNECTION REQUEST BUTTONS (Only if not connected) */}
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
                            className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-2 rounded-xl text-sm font-bold active:bg-emerald-100"
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

        {/* CHAT BUTTON (If permission allows) */}
        {canChat && !isClient && (
             <div className="flex gap-2 justify-center mb-6">
                 <button 
                    onClick={onStartChat}
                    className="bg-emerald-600 text-white px-8 py-3 rounded-full text-sm font-bold shadow-lg shadow-emerald-200 active:scale-95 transition-transform flex items-center gap-2"
                 >
                    <Icons.Message /> Написать сообщение
                 </button>
             </div>
        )}
        
        {/* Contact Icons Row */}
        {hasAccess ? (
          <div className="flex justify-center gap-6 pb-6 border-b border-gray-100">
            {isPhoneVisible ? (
                <a href={`tel:${partner.phone}`} className="flex flex-col items-center gap-1 group text-gray-500 hover:text-emerald-600">
                  <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center border border-gray-200">
                    <Icons.Phone />
                  </div>
                  <span className="text-[10px]">Звонок</span>
                </a>
            ) : (
                <div className="flex flex-col items-center gap-1 group text-gray-300">
                  <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100">
                    <Icons.Lock />
                  </div>
                  <span className="text-[10px]">Скрыто</span>
                </div>
            )}
            
            <button onClick={() => onToggleFavorite(partner.id)} className={`flex flex-col items-center gap-1 group ${isFavorite ? 'text-red-500' : 'text-gray-500'}`}>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center border ${isFavorite ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-200'}`}>
                <Icons.Heart filled={isFavorite} />
              </div>
              <span className="text-[10px]">Избранное</span>
            </button>
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
               
               <div className="flex items-center justify-between py-1">
                   <span className="text-gray-500 text-sm">Телефон</span>
                   {isPhoneVisible ? (
                       <span className="text-gray-900 font-medium">{partner.phone}</span>
                   ) : (
                       <span className="text-gray-400 text-xs flex items-center gap-1"><Icons.Lock /> Скрыт владельцем</span>
                   )}
               </div>

               <div className="flex items-center justify-between py-1">
                   <span className="text-gray-500 text-sm">Email</span>
                   {isEmailVisible ? (
                       <span className="text-gray-900 font-medium">{partner.email}</span>
                   ) : (
                       <span className="text-gray-400 text-xs flex items-center gap-1"><Icons.Lock /> Скрыт владельцем</span>
                   )}
               </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default PartnerDetail;