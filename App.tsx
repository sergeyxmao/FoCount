import React, { useState, useEffect } from 'react';
import { Icons, MOCK_NOTIFICATIONS } from './constants';
import { AppTab, Partner, User, Relationship, Notification, Chat, RelationshipType, Rank } from './types';
import PartnerList from './components/PartnerList';
import Assistant from './components/Assistant';
import PartnerDetail from './components/PartnerDetail';
import LoginScreen from './components/LoginScreen';
import Notifications from './components/Notifications';
import ChatScreen from './components/ChatScreen';
import { api } from './services/api';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Редактирование профиля
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState<User | null>(null);
 
  // CORE DATA STATE
  const [partners, setPartners] = useState<Partner[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [chats, setChats] = useState<Chat[]>([]);
  
  // UI STATE
  const [activeTab, setActiveTab] = useState<AppTab>('global');
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  
  // Broadcast State
  const [broadcastMode, setBroadcastMode] = useState<{ active: boolean, rank?: string, targets?: Partner[] }>({ active: false });

  // --------------------------------------------------------------------------
  // INITIALIZATION & EFFECTS
  // --------------------------------------------------------------------------
  useEffect(() => {
    const user = api.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      setIsAuthenticated(true);
      loadPartners();
      setActiveTab('global'); 
    } else {
      setIsLoading(false);
    }
  }, []);

  const loadPartners = async () => {
    try {
      setIsLoading(true);
      const [partnersData, relData, notifData, chatsData] = await Promise.all([
          api.getPartners(),
          api.getMyRelationships(),
          api.getNotifications(),
          api.getChats()
      ]);
      setPartners(partnersData);
      if (relData && relData.relationships) setRelationships(relData.relationships);
      if (notifData && notifData.notifications) setNotifications(notifData.notifications);
      if (chatsData && chatsData.chats) setChats(chatsData.chats.map((c: any) => ({ ...c, messages: [] })));
    } catch (e) {
      console.error("Failed to load data", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
      if (!activeChatId || activeChatId === 'broadcast') return;
      const loadMessages = async () => {
          try {
              const data = await api.getChatMessages(activeChatId);
              if (data.success) {
                  setChats(prev => prev.map(c => c.id === activeChatId ? { ...c, messages: data.messages } : c));
              }
          } catch (e) { console.error(e); }
      };
      loadMessages();
      const interval = setInterval(loadMessages, 5000);
      return () => clearInterval(interval);
  }, [activeChatId]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const syncProfile = async () => {
      try {
        const freshUser = await api.fetchUserProfile();
        if (!isEditingProfile) {
          setCurrentUser(freshUser);
          localStorage.setItem('fohow_user', JSON.stringify(freshUser));
        }
      } catch (e) { console.error(e); }
    };
    const intervalId = setInterval(syncProfile, 5000);
    return () => clearInterval(intervalId);
  }, [isAuthenticated, isEditingProfile]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const syncNotifications = async () => {
      try {
        const notifData = await api.getNotifications();
        if (notifData && notifData.notifications) setNotifications(notifData.notifications);
      } catch (e) { console.error(e); }
    };
    const intervalId = setInterval(syncNotifications, 10000);
    return () => clearInterval(intervalId);
  }, [isAuthenticated]);

  // --------------------------------------------------------------------------
  // LOGIC & ACTIONS
  // --------------------------------------------------------------------------
  const getRelationshipStatus = (targetId: string) => {
    if (!currentUser) return 'none';
    const rel = relationships.find(r => 
      (r.initiatorId === currentUser.id && r.targetId === targetId) ||
      (r.initiatorId === targetId && r.targetId === currentUser.id)
    );
    return rel ? rel.status : 'none';
  };

  const handleSendRequest = async (type: RelationshipType) => {
    if (!currentUser || !selectedPartner) return;
    try {
      const response = await api.createRelationship(selectedPartner.id, type);
      if (response.success && response.relationship) {
           const newRel = {
               ...response.relationship,
               id: String(response.relationship.id),
               initiatorId: String(response.relationship.initiatorId),
               targetId: String(response.relationship.targetId)
           };
           setRelationships(prev => [...prev, newRel]);
      }
    } catch (e) { console.error(e); alert('Ошибка при отправке запроса.'); }
  };

  const handleDeleteRelationship = async (targetId: string) => {
      if (!window.confirm('Вы уверены, что хотите удалить этого партнера?')) return;
      try {
          await api.deleteRelationship(targetId);
          setRelationships(prev => prev.filter(r => r.initiatorId !== targetId && r.targetId !== targetId));
          setSelectedPartner(null);
          alert('Связь удалена');
      } catch (e) { console.error(e); alert('Ошибка удаления'); }
  };

  const handleAcceptNotification = async (notif: Notification) => {
    if (notif.type === 'relationship_request' && notif.relationshipId) {
        try {
            await api.respondToRelationship(notif.relationshipId, 'confirmed');
            if (notif.fromUserId && currentUser) {
                 const newRel: Relationship = {
                     id: notif.relationshipId,
                     initiatorId: notif.fromUserId,
                     targetId: currentUser.id,
                     type: 'downline',
                     status: 'confirmed'
                 };
                 setRelationships(prev => [...prev, newRel]);
            }
        } catch (e) { console.error(e); return; }
    }
    try {
        await api.markNotificationRead(notif.id);
        setNotifications(prev => prev.filter(n => n.id !== notif.id));
    } catch (e) { console.error(e); }
  };

  const handleRejectNotification = async (notif: Notification) => {
    try {
      await api.markNotificationRead(notif.id);
      setNotifications(prev => prev.filter(n => n.id !== notif.id));
    } catch (e) { console.error(e); }
  };

  const handleStartChat = async () => {
    if (!currentUser || !selectedPartner) return;
    try {
        const res = await api.createChat(selectedPartner.id);
        if (res.success) {
            const chatId = res.chatId;
            if (!chats.find(c => c.id === chatId)) {
                const newChat: Chat = {
                    id: chatId,
                    participantIds: [currentUser.id, selectedPartner.id],
                    messages: [],
                    lastMessageTime: Date.now()
                };
                setChats(prev => [newChat, ...prev]);
            }
            setActiveChatId(chatId);
            setSelectedPartner(null);
        }
    } catch (e) { alert('Не удалось начать чат'); }
  };

  const handleBlockUser = (userId: string) => {
      if (!currentUser) return;
      const updatedUser = { ...currentUser, blockedUserIds: [...(currentUser.blockedUserIds || []), userId] };
      setCurrentUser(updatedUser);
      localStorage.setItem('fohow_user', JSON.stringify(updatedUser));
      alert("Пользователь заблокирован.");
  };

  const handleUnblockUser = (userId: string) => {
      if (!currentUser) return;
      const updatedUser = { ...currentUser, blockedUserIds: (currentUser.blockedUserIds || []).filter(id => id !== userId) };
      setCurrentUser(updatedUser);
      localStorage.setItem('fohow_user', JSON.stringify(updatedUser));
  };

  const toggleVisibility = async (field: string) => {
      if (!currentUser || !currentUser.visibilitySettings) return;
      const updatedVisibilitySettings = { ...currentUser.visibilitySettings, [field]: !currentUser.visibilitySettings[field as keyof typeof currentUser.visibilitySettings] };
      const updatedUser = { ...currentUser, visibilitySettings: updatedVisibilitySettings };
      setCurrentUser(updatedUser);
      try { await api.updateVisibilitySettings(updatedVisibilitySettings); } catch (error) { console.error(error); }
      localStorage.setItem('fohow_user', JSON.stringify(updatedUser));
  };

  const toggleSearchSetting = async (field: string) => {
      if (!currentUser || !currentUser.searchSettings) return;
      const updatedSearchSettings = { ...currentUser.searchSettings, [field]: !currentUser.searchSettings[field as keyof typeof currentUser.searchSettings] };
      const updatedUser = { ...currentUser, searchSettings: updatedSearchSettings };
      setCurrentUser(updatedUser);
      try { await api.updateSearchSettings(updatedSearchSettings); } catch (error) { console.error(error); }
      localStorage.setItem('fohow_user', JSON.stringify(updatedUser));
  };

  const handleBroadcastStart = (rank: Rank, targets: Partner[]) => {
    setBroadcastMode({ active: true, rank, targets });
  };

  const handleSendMessage = async (text: string) => {
    if (!currentUser) return;
    if (broadcastMode.active) {
        alert('Рассылка пока работает только визуально');
        setBroadcastMode({ active: false });
        return;
    }
    if (activeChatId) {
        try {
            const tempId = Date.now().toString();
            setChats(prev => prev.map(chat => {
                if (chat.id === activeChatId) {
                    return {
                        ...chat,
                        messages: [...chat.messages, { id: tempId, senderId: currentUser.id, text: text, timestamp: Date.now() }],
                        lastMessageTime: Date.now()
                    };
                }
                return chat;
            }));
            await api.sendMessage(activeChatId, text);
        } catch (e) { console.error(e); alert('Ошибка при отправке'); }
    }
  };
  
  const handleStartEdit = () => { setEditForm(currentUser); setIsEditingProfile(true); };

  const handleSaveProfile = async () => {
    if (!editForm) return;
    try {
        setIsLoading(true);
        const response = await api.updateProfile(editForm);
        // FULL FIELD MAPPING RESTORED
        const updatedUser = {
            ...currentUser!,
            name: response.user.full_name || response.user.name,
            city: response.user.city,
            country: response.user.country,
            phone: response.user.phone,
            office: response.user.office,
            bio: response.user.bio,
            telegram_user: response.user.telegram_user,
            telegram_channel: response.user.telegram_channel,
            whatsapp_contact: response.user.whatsapp_contact,
            vk_profile: response.user.vk_profile,
            instagram_profile: response.user.instagram_profile,
            ok_profile: response.user.ok_profile
        };
        setCurrentUser(updatedUser);
        localStorage.setItem('fohow_user', JSON.stringify(updatedUser));
        setIsEditingProfile(false);
        alert('Профиль обновлен!');
    } catch (e) { console.error(e); alert('Ошибка сохранения'); } finally { setIsLoading(false); }
  };

  // --------------------------------------------------------------------------
  // RENDER FLOW
  // --------------------------------------------------------------------------

  if (isLoading && !partners.length && isAuthenticated) {
    return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FDFBF7] to-[#E2D1A6]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37]"></div></div>;
  }

  if (!isAuthenticated) {
    return <LoginScreen onLoginSuccess={(user) => { setCurrentUser(user); setIsAuthenticated(true); loadPartners(); setActiveTab(user.role === 'client' ? 'global' : 'team'); }} />;
  }

  // EDIT PROFILE
  if (isEditingProfile && editForm) {
    return (
        <div className="p-6 bg-white min-h-screen pb-20">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold text-gray-800">Редактирование</h2>
                <button onClick={() => setIsEditingProfile(false)} className="text-gray-400 font-medium">Отмена</button>
            </div>
            
            <div className="space-y-5">
                {/* Inputs styled minimally */}
                {['name', 'country', 'city', 'phone'].map(field => (
                    <div key={field}>
                         <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{field}</label>
                         <input 
                            className="w-full border-b border-gray-200 py-2 focus:border-[#D4AF37] focus:outline-none transition-colors"
                            value={(editForm as any)[field] || ''}
                            onChange={e => setEditForm({...editForm, [field]: e.target.value})}
                         />
                    </div>
                ))}
                
                <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">О себе</label>
                    <textarea 
                        className="w-full border border-gray-200 rounded-xl p-3 h-24 focus:border-[#D4AF37] focus:outline-none"
                        value={editForm.bio || ''}
                        onChange={e => setEditForm({...editForm, bio: e.target.value})}
                    />
                </div>
                
                <h3 className="font-bold pt-4 text-[#D4AF37]">Соцсети</h3>
                {['telegram_user', 'vk_profile', 'instagram_profile', 'whatsapp_contact'].map(field => (
                    <div key={field}>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{field}</label>
                        <input 
                            className="w-full border-b border-gray-200 py-2 focus:border-[#D4AF37] focus:outline-none transition-colors"
                            value={(editForm as any)[field] || ''}
                            onChange={e => setEditForm({...editForm, [field]: e.target.value})}
                        />
                    </div>
                ))}

                <div className="pt-6">
                     <button onClick={handleSaveProfile} className="w-full bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-white font-bold py-3.5 rounded-full shadow-lg active:scale-95 transition-transform">
                        Сохранить
                     </button>
                </div>
            </div>
        </div>
    );
  }

  // CHAT
  if (broadcastMode.active) {
      return (
          <ChatScreen 
             chat={{ id: 'broadcast', participantIds: [], messages: [], lastMessageTime: 0 }}
             partner={null}
             currentUser={currentUser!}
             onSendMessage={handleSendMessage}
             onBack={() => setBroadcastMode({ active: false })}
             isBroadcast={true}
             broadcastRank={broadcastMode.rank}
          />
      );
  }

  if (activeChatId) {
      const chat = chats.find(c => c.id === activeChatId) || null;
      const partnerId = chat?.participantIds.find(id => id !== currentUser?.id);
      const partner = partners.find(p => p.id === partnerId) || null;

      return (
        <ChatScreen 
            chat={chat}
            partner={partner}
            currentUser={currentUser!}
            onSendMessage={handleSendMessage}
            onBack={() => setActiveChatId(null)}
            onBlockUser={handleBlockUser}
        />
      );
  }

  if (selectedPartner) {
    return (
      <PartnerDetail 
        partner={selectedPartner} 
        currentUserRole={currentUser!.role}
        onBack={() => setSelectedPartner(null)}
        isFavorite={favorites.includes(selectedPartner.id)}
        onToggleFavorite={(id) => setFavorites(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])}
        relationshipStatus={getRelationshipStatus(selectedPartner.id)}
        onSendRequest={handleSendRequest}
		onDeleteRelationship={handleDeleteRelationship}
        onStartChat={handleStartChat}
      />
    );
  }

  if (showNotifications) {
      return (
          <Notifications 
            notifications={notifications}
            partners={partners}
            onAccept={handleAcceptNotification}
            onReject={handleRejectNotification}
            onClose={() => setShowNotifications(false)}
          />
      );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'team':
      case 'global':
      case 'offices':
        return (
          <PartnerList 
            activeTab={activeTab}
            partners={partners} 
            relationships={relationships}
            onSelectPartner={(p) => setSelectedPartner(p)} 
            currentUser={currentUser}
            onBroadcast={handleBroadcastStart}
          />
        );
      case 'assistant':
        return <Assistant />;
      case 'chats':
         return (
             <div className="p-5 pt-4 space-y-4">
                 <div className="relative">
                     <Icons.Search className="absolute left-4 top-3.5 text-gray-400" size={18} />
                     <input type="text" placeholder="Найти чат или контакт" className="w-full pl-11 py-3 bg-white rounded-full shadow-sm border border-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30" />
                 </div>
                 
                 {chats.map(chat => {
                     const pid = chat.participantIds.find(id => id !== currentUser?.id);
                     if (currentUser?.blockedUserIds?.includes(pid!)) return null; 
                     const p = partners.find(x => x.id === pid);
                     if (!p) return null;
                     const lastMsg = chat.messages[chat.messages.length - 1];
                     const msgCount = chat.messages.length; 

                     return (
                         <div key={chat.id} onClick={() => setActiveChatId(chat.id)} className="bg-white p-4 rounded-[20px] shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-gray-50 flex items-center gap-4 active:scale-[0.98] transition-all">
                             <div className="relative">
                                <img src={p.avatar} className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm" alt=""/>
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                             </div>
                             <div className="flex-1 min-w-0">
                                 <div className="flex justify-between items-center mb-1">
                                    <span className="font-bold text-gray-800 text-[15px]">{p.name}</span>
                                    {msgCount > 0 && (
                                        <div className="w-5 h-5 bg-[#C5A028] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                            {msgCount > 9 ? '9+' : msgCount}
                                        </div>
                                    )}
                                 </div>
                                 <div className="flex justify-between items-end">
                                     <div className="text-sm text-gray-500 truncate pr-4">{lastMsg?.text || 'Нет сообщений'}</div>
                                     {lastMsg && <span className="text-[10px] text-gray-300 font-medium whitespace-nowrap">{new Date(lastMsg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>}
                                 </div>
                             </div>
                         </div>
                     );
                 })}
             </div>
         );
      case 'profile':
        return (
          <div className="p-6 pt-8 pb-24">
             {/* Profile Header */}
             <div className="flex flex-col items-center mb-8 relative">
                 {/* Gold Circle Effect */}
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-[#D4AF37] rounded-full opacity-30"></div>
                 
                <div className="w-28 h-28 p-1 bg-gradient-to-tr from-[#D4AF37] to-[#F3E5AB] rounded-full shadow-xl mb-4">
                    <img src={currentUser?.avatar} alt="Me" className="w-full h-full rounded-full object-cover border-4 border-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">{currentUser?.name}</h2>
                <div className="text-xs text-[#B8860B] font-medium tracking-widest uppercase mt-1">
                    {currentUser?.fohowId}
                </div>
                
                 <button 
                    onClick={handleStartEdit}
                    className="mt-6 px-6 py-2 border border-[#D4AF37] text-[#B8860B] rounded-full text-sm font-medium hover:bg-[#D4AF37] hover:text-white transition-colors"
                >
                    Редактировать профиль
                </button>
             </div>

             {currentUser?.bio && (
                 <div className="bg-white rounded-[24px] p-6 shadow-sm mb-6 text-center">
                     <p className="text-gray-600 text-sm italic">"{currentUser.bio}"</p>
                 </div>
             )}

             {/* Privacy Settings Card */}
             {currentUser?.visibilitySettings && (
                 <div className="bg-white rounded-[24px] p-6 shadow-sm mb-6">
                     <div className="flex items-center gap-2 mb-4">
                        <Icons.User size={18} className="text-[#D4AF37]" />
                        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">ПРИВАТНОСТЬ</h3>
                     </div>

                     <div className="space-y-4">
                         {[
                             { key: 'showPhone', label: 'Показывать телефон' },
                             { key: 'showEmail', label: 'Показывать Email' },
                             { key: 'allowCrossLineMessages', label: 'Сообщения от всех' },
                         ].map(item => (
                             <div key={item.key} className="flex items-center justify-between">
                                 <span className="text-gray-600 text-sm font-medium">{item.label}</span>
                                 <div 
                                    onClick={() => toggleVisibility(item.key)}
                                    className={`w-12 h-7 rounded-full flex items-center px-1 cursor-pointer transition-colors ${currentUser.visibilitySettings[item.key as keyof typeof currentUser.visibilitySettings] ? 'bg-[#D4AF37]' : 'bg-gray-200'}`}
                                 >
                                     <div className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform ${currentUser.visibilitySettings[item.key as keyof typeof currentUser.visibilitySettings] ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                 </div>
                             </div>
                         ))}
                     </div>
                 </div>
             )}
            
            {/* Contacts Visibility (ВОССТАНОВЛЕН ПОЛНЫЙ СПИСОК) */}
            {currentUser?.visibilitySettings && (
                 <div className="bg-white rounded-[24px] p-6 shadow-sm mb-6">
                     <div className="flex items-center gap-2 mb-4">
                        <Icons.Eye size={18} className="text-[#D4AF37]" />
                        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">ВИДИМОСТЬ КОНТАКТОВ</h3>
                     </div>

                     <div className="space-y-4">
                         {[
                             { key: 'showTelegram', label: 'Показывать Telegram' },
                             { key: 'showWhatsApp', label: 'Показывать WhatsApp' },
                             { key: 'showVK', label: 'Показывать VK' },         // Восстановлено
                             { key: 'showInstagram', label: 'Показывать Instagram' } // Восстановлено
                         ].map(item => (
                             <div key={item.key} className="flex items-center justify-between">
                                 <span className="text-gray-600 text-sm font-medium">{item.label}</span>
                                 <div 
                                    onClick={() => toggleVisibility(item.key)}
                                    className={`w-12 h-7 rounded-full flex items-center px-1 cursor-pointer transition-colors ${currentUser.visibilitySettings[item.key as keyof typeof currentUser.visibilitySettings] ? 'bg-[#D4AF37]' : 'bg-gray-200'}`}
                                 >
                                     <div className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform ${currentUser.visibilitySettings[item.key as keyof typeof currentUser.visibilitySettings] ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                 </div>
                             </div>
                         ))}
                     </div>
                 </div>
             )}

             {/* Search Permissions (ВОССТАНОВЛЕНО ПОЛНОСТЬЮ) */}
             {currentUser?.searchSettings && (
                 <div className="bg-white rounded-[24px] p-6 shadow-sm mb-6">
                     <div className="flex items-center gap-2 mb-4">
                        <Icons.Search size={18} className="text-[#D4AF37]" />
                        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">ПАРАМЕТРЫ ПОИСКА</h3>
                     </div>
                     
                     <div className="space-y-4">
                        {[
                            { key: 'searchByName', label: 'Искать по имени' },
                            { key: 'searchByCity', label: 'Искать по городу' },
                            { key: 'searchByCountry', label: 'Искать по стране' },
                            { key: 'searchByPersonalId', label: 'Искать по номеру FOHOW' },
                            { key: 'searchByOffice', label: 'Искать по представительству' }
                        ].map(item => (
                             <div key={item.key} className="flex items-center justify-between">
                                 <span className="text-gray-600 text-sm font-medium">{item.label}</span>
                                 <div 
                                    onClick={() => toggleSearchSetting(item.key)}
                                    className={`w-12 h-7 rounded-full flex items-center px-1 cursor-pointer transition-colors ${currentUser.searchSettings[item.key as keyof typeof currentUser.searchSettings] ? 'bg-[#D4AF37]' : 'bg-gray-200'}`}
                                 >
                                     <div className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform ${currentUser.searchSettings[item.key as keyof typeof currentUser.searchSettings] ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                 </div>
                             </div>
                        ))}
                     </div>
                 </div>
             )}

             {/* Blacklist (ВОССТАНОВЛЕНО) */}
             {currentUser?.blockedUserIds && currentUser.blockedUserIds.length > 0 && (
                 <div className="bg-white rounded-[24px] p-6 shadow-sm mb-6">
                     <div className="flex items-center gap-2 mb-4">
                        <Icons.X size={18} className="text-red-400" />
                        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">ЧЕРНЫЙ СПИСОК</h3>
                     </div>
                     {currentUser.blockedUserIds.map(blockedId => {
                         const blockedUser = partners.find(p => p.id === blockedId);
                         return (
                             <div key={blockedId} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                                 <span className="text-gray-700 text-sm font-medium">{blockedUser?.name || 'Пользователь'}</span>
                                 <button 
                                    onClick={() => handleUnblockUser(blockedId)}
                                    className="text-xs text-red-500 font-bold px-3 py-1 rounded-full bg-red-50 hover:bg-red-100 transition-colors"
                                 >
                                     Разблокировать
                                 </button>
                             </div>
                         );
                     })}
                 </div>
             )}

             <button onClick={() => { api.logout(); setIsAuthenticated(false); setCurrentUser(null); }} className="w-full text-red-400 font-medium py-4 rounded-2xl bg-white shadow-sm hover:bg-red-50 transition-colors">
                Выйти из аккаунта
             </button>
          </div>
        );
      default: return null;
    }
  };

  const isClient = currentUser?.role === 'client';

  return (
    <div className="max-w-md mx-auto h-screen flex flex-col bg-gradient-to-br from-[#FDFBF7] via-[#F4EBD0] to-[#E2D1A6] shadow-2xl overflow-hidden md:border-x md:border-[#D4AF37]/20">

      {/* Header */}
      <header className="px-6 py-5 flex items-center justify-between flex-shrink-0 z-20 bg-transparent">
        <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-b from-[#D4AF37] to-[#B8860B] rounded-lg flex items-center justify-center text-white font-serif font-bold text-lg shadow-md">F</div>
            <div className="flex flex-col">
                <h1 className="text-sm font-bold text-gray-800 leading-none">FOHOW</h1>
                <span className="text-[10px] text-gray-500 tracking-wider">Connect</span>
            </div>
        </div>
        <button onClick={() => setShowNotifications(true)} className="p-2 relative text-gray-500 hover:text-[#D4AF37] transition-colors">
            <Icons.Bell alert={notifications.length > 0} />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto no-scrollbar pb-4">
        {renderContent()}
      </main>

      {/* Navigation - Floating Sheet Style */}
      <nav className="bg-white rounded-t-[30px] shadow-[0_-5px_20px_rgba(212,175,55,0.15)] px-4 py-3 pb-safe flex-shrink-0 z-30">
        <div className="flex justify-around items-center">
          {!isClient && (
            <NavBtn icon={<Icons.Users size={22} />} label="Команда" active={activeTab === 'team'} onClick={() => setActiveTab('team')} />
          )}
          <NavBtn icon={<Icons.Briefcase size={22} />} label="Офисы" active={activeTab === 'offices'} onClick={() => setActiveTab('offices')} />
          <NavBtn icon={<Icons.Globe size={22} />} label="Мир" active={activeTab === 'global'} onClick={() => setActiveTab('global')} />
          {!isClient && (
             <NavBtn icon={<Icons.Message size={22} />} label="Чаты" active={activeTab === 'chats'} onClick={() => setActiveTab('chats')} />
          )}
          <NavBtn icon={<Icons.User size={22} />} label="Профиль" active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
        </div>
      </nav>
    </div>
  );
};

const NavBtn = ({ icon, label, active, onClick }: any) => (
    <button onClick={onClick} className={`flex flex-col items-center gap-1.5 p-2 w-16 transition-all ${active ? 'text-[#D4AF37] transform -translate-y-1' : 'text-gray-300 hover:text-gray-400'}`}>
        {icon}
        <span className={`text-[9px] font-medium ${active ? 'text-gray-800' : 'text-transparent'}`}>{label}</span>
    </button>
);

export default App;
