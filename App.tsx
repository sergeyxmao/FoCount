import React, { useState, useEffect } from 'react';
import { Icons, MOCK_NOTIFICATIONS, MOCK_RELATIONSHIPS, MOCK_CHATS } from './constants';
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
  const [chats, setChats] = useState<Chat[]>(MOCK_CHATS);
  
  // UI STATE
  const [activeTab, setActiveTab] = useState<AppTab>('global');
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  
  // Broadcast State
  const [broadcastMode, setBroadcastMode] = useState<{ active: boolean, rank?: string, targets?: Partner[] }>({ active: false });

  // --------------------------------------------------------------------------
  // INITIALIZATION
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

    const [partnersData, relData, notifData] = await Promise.all([
        api.getPartners(),
        api.getMyRelationships(),
        api.getNotifications() // <--- ДОБАВЛЕНО
    ]);

    setPartners(partnersData);

    if (relData && relData.relationships) {
         setRelationships(relData.relationships);
    }

    // <--- ДОБАВЛЕНО
    if (notifData && notifData.notifications) {
        setNotifications(notifData.notifications);
    }

  } catch (e) {
    console.error("Failed to load data", e);
  } finally {
    setIsLoading(false);
  }
};

// Синхронизация профиля пользователя каждые 5 секунд
useEffect(() => {
  if (!isAuthenticated) return;

  const syncProfile = async () => {
    try {
      const freshUser = await api.fetchUserProfile();
      // Обновляем только если пользователь не редактирует профиль
      if (!isEditingProfile) {
        setCurrentUser(freshUser);
        localStorage.setItem('fohow_user', JSON.stringify(freshUser));
      }
    } catch (e) {
      console.error("Sync error", e);
    }
  };

  // Запускаем синхронизацию каждые 5 секунд
  const intervalId = setInterval(syncProfile, 5000);

  return () => clearInterval(intervalId);
}, [isAuthenticated, isEditingProfile]);

// Синхронизация уведомлений каждые 10 секунд
useEffect(() => {
  if (!isAuthenticated) return;

  const syncNotifications = async () => {
    try {
      const notifData = await api.getNotifications();
      if (notifData && notifData.notifications) {
        setNotifications(notifData.notifications);
      }
    } catch (e) {
      console.error("Notification sync error", e);
    }
  };

  // Запускаем синхронизацию каждые 10 секунд
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
         // ВАЖНО: Приводим ID к строкам, чтобы React увидел изменения
         const newRel = {
             ...response.relationship,
             id: String(response.relationship.id),
             initiatorId: String(response.relationship.initiatorId),
             targetId: String(response.relationship.targetId)
         };
         
         setRelationships(prev => [...prev, newRel]);
         // alert можно убрать для плавности, кнопка сама изменится
    }
  } catch (e) {
    console.error(e);
    alert('Ошибка при отправке запроса.');
  }
};

const handleDeleteRelationship = async (targetId: string) => {
    if (!window.confirm('Вы уверены, что хотите удалить этого партнера из структуры/наставников?')) return;
    
    try {
        await api.deleteRelationship(targetId);
        // Удаляем из локального стейта
        setRelationships(prev => prev.filter(r => 
            r.initiatorId !== targetId && r.targetId !== targetId
        ));
        setSelectedPartner(null); // Закрываем окно деталей
        alert('Связь удалена');
    } catch (e) {
        console.error(e);
        alert('Ошибка удаления');
    }
};

const handleAcceptNotification = async (notif: Notification) => {
  // Если это запрос на связь
  if (notif.type === 'relationship_request' && notif.relationshipId) {
      try {
          // 1. Отправляем подтверждение на сервер
          await api.respondToRelationship(notif.relationshipId, 'confirmed');

          // 2. Обновляем локально список связей (чтобы сразу появился в Команде)
          // Нам нужно знать ID инициатора. Он есть в notif.fromUserId
          if (notif.fromUserId && currentUser) {
               const newRel: Relationship = {
                   id: notif.relationshipId, // ID из уведомления
                   initiatorId: notif.fromUserId,
                   targetId: currentUser.id,
                   type: 'downline', // Тут упрощение, в идеале брать из ответа сервера
                   status: 'confirmed'
               };
               setRelationships(prev => [...prev, newRel]);
          }
      } catch (e) {
          console.error("Ошибка подтверждения", e);
          return;
      }
  }

  // Сначала помечаем прочитанным на сервере, потом убираем из UI
  try {
      await api.markNotificationRead(notif.id);
      setNotifications(prev => prev.filter(n => n.id !== notif.id));
  } catch (e) {
      console.error("Ошибка отметки уведомления", e);
  }
};

  const handleRejectNotification = async (notif: Notification) => {
    // Отмечаем уведомление как прочитанное перед удалением
    try {
      await api.markNotificationRead(notif.id);
      setNotifications(prev => prev.filter(n => n.id !== notif.id));
    } catch (e) {
      console.error("Ошибка отметки уведомления", e);
    }
  };

  const handleStartChat = () => {
    if (!currentUser || !selectedPartner) return;
    const existingChat = chats.find(c => 
      c.participantIds.includes(currentUser.id) && c.participantIds.includes(selectedPartner.id)
    );
    if (existingChat) {
      setActiveChatId(existingChat.id);
    } else {
      const newChat: Chat = {
        id: Date.now().toString(),
        participantIds: [currentUser.id, selectedPartner.id],
        messages: [],
        lastMessageTime: Date.now()
      };
      setChats(prev => [...prev, newChat]);
      setActiveChatId(newChat.id);
    }
    setSelectedPartner(null);
  };

  // BLACKLIST & PRIVACY
  const handleBlockUser = (userId: string) => {
      if (!currentUser) return;
      const updatedUser = {
          ...currentUser,
          blockedUserIds: [...(currentUser.blockedUserIds || []), userId]
      };
      setCurrentUser(updatedUser);
      localStorage.setItem('fohow_user', JSON.stringify(updatedUser));
      alert("Пользователь заблокирован. Вы больше не будете видеть сообщения от него.");
  };

  const handleUnblockUser = (userId: string) => {
      if (!currentUser) return;
      const updatedUser = {
          ...currentUser,
          blockedUserIds: (currentUser.blockedUserIds || []).filter(id => id !== userId)
      };
      setCurrentUser(updatedUser);
      localStorage.setItem('fohow_user', JSON.stringify(updatedUser));
  };

  const toggleVisibility = async (field: 'showPhone' | 'showEmail' | 'showTelegram' | 'showVK' | 'showInstagram' | 'showWhatsApp' | 'allowCrossLineMessages') => {
      if (!currentUser || !currentUser.visibilitySettings) return;

      // 1. Обновить состояние локально
      const updatedVisibilitySettings = {
          ...currentUser.visibilitySettings,
          [field]: !currentUser.visibilitySettings[field]
      };
      const updatedUser = {
          ...currentUser,
          visibilitySettings: updatedVisibilitySettings
      };
      setCurrentUser(updatedUser);

      // 2. Вызвать API для сохранения в БД
      try {
        await api.updateVisibilitySettings(updatedVisibilitySettings);
      } catch (error) {
        console.error('Ошибка при сохранении настроек видимости:', error);
      }

      // 3. Обновить localStorage
      localStorage.setItem('fohow_user', JSON.stringify(updatedUser));
  };

  const toggleSearchSetting = async (field: 'searchByName' | 'searchByCity' | 'searchByCountry' | 'searchByPersonalId' | 'searchByOffice') => {
      if (!currentUser || !currentUser.searchSettings) return;

      // 1. Обновить состояние локально
      const updatedSearchSettings = {
          ...currentUser.searchSettings,
          [field]: !currentUser.searchSettings[field]
      };
      const updatedUser = {
          ...currentUser,
          searchSettings: updatedSearchSettings
      };
      setCurrentUser(updatedUser);

      // 2. Вызвать API для сохранения в БД
      try {
        await api.updateSearchSettings(updatedSearchSettings);
      } catch (error) {
        console.error('Ошибка при сохранении настроек поиска:', error);
      }

      // 3. Обновить localStorage
      localStorage.setItem('fohow_user', JSON.stringify(updatedUser));
  };

  const handleBroadcastStart = (rank: Rank, targets: Partner[]) => {
    setBroadcastMode({ active: true, rank, targets });
  };

  const handleSendMessage = (text: string) => {
    if (!currentUser) return;

    if (broadcastMode.active && broadcastMode.targets) {
        // Broadcast Logic (Mocked)
        alert(`Сообщение отправлено ${broadcastMode.targets.length} партнерам.`);
        setBroadcastMode({ active: false });
        return;
    }

    if (activeChatId) {
        setChats(prev => prev.map(chat => {
            if (chat.id === activeChatId) {
                return {
                    ...chat,
                    messages: [...chat.messages, {
                        id: Date.now().toString(),
                        senderId: currentUser.id,
                        text: text,
                        timestamp: Date.now()
                    }],
                    lastMessageTime: Date.now()
                };
            }
            return chat;
        }));
    }
  };
  
  // EDIT PROFILE LOGIC
  const handleStartEdit = () => {
    setEditForm(currentUser);
    setIsEditingProfile(true);
  };

  const handleSaveProfile = async () => {
    if (!editForm) return;
    try {
        setIsLoading(true);
        const response = await api.updateProfile(editForm);
        
        const updatedUser = {
            ...currentUser!,
            name: response.user.full_name,
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
        alert('Профиль успешно обновлен!');
    } catch (e) {
        console.error(e);
        alert('Ошибка при сохранении профиля');
    } finally {
        setIsLoading(false);
    }
  };

  // --------------------------------------------------------------------------
  // RENDER FLOW
  // --------------------------------------------------------------------------

  if (isLoading && !partners.length && isAuthenticated) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div></div>;
  }

  if (!isAuthenticated) {
    return <LoginScreen onLoginSuccess={(user) => { setCurrentUser(user); setIsAuthenticated(true); loadPartners(); setActiveTab(user.role === 'client' ? 'global' : 'team'); }} />;
  }

  // EDIT PROFILE SCREEN
  if (isEditingProfile && editForm) {
    return (
        <div className="p-6 bg-white min-h-screen pb-20">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Редактирование</h2>
                <button onClick={() => setIsEditingProfile(false)} className="text-gray-500">Отмена</button>
            </div>
            
            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1">Имя Фамилия</label>
                    <input 
                        className="w-full border border-gray-300 rounded-lg p-3"
                        value={editForm.name}
                        onChange={e => setEditForm({...editForm, name: e.target.value})}
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 mb-1">Страна</label>
                        <input 
                            className="w-full border border-gray-300 rounded-lg p-3"
                            value={editForm.country}
                            onChange={e => setEditForm({...editForm, country: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 mb-1">Город</label>
                        <input 
                            className="w-full border border-gray-300 rounded-lg p-3"
                            value={editForm.city}
                            onChange={e => setEditForm({...editForm, city: e.target.value})}
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1">О себе (Bio)</label>
                    <textarea 
                        className="w-full border border-gray-300 rounded-lg p-3 h-24"
                        value={editForm.bio || ''}
                        onChange={e => setEditForm({...editForm, bio: e.target.value})}
                        placeholder="Расскажите о себе и своем опыте..."
                    />
                </div>
                
                <h3 className="font-bold pt-4">Контакты</h3>
                <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1">Телефон (он же WhatsApp)</label>
                    <input 
                        className="w-full border border-gray-300 rounded-lg p-3" 
                        value={editForm.phone} 
                        onChange={e => setEditForm({...editForm, phone: e.target.value})} 
                        placeholder="+7..."
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1">Telegram (username)</label>
                    <input 
                        className="w-full border border-gray-300 rounded-lg p-3" 
                        value={editForm.telegram_user || ''} 
                        onChange={e => setEditForm({...editForm, telegram_user: e.target.value})} 
                        placeholder="@username" 
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1">ВКонтакте (ссылка на профиль)</label>
                    <input 
                        className="w-full border border-gray-300 rounded-lg p-3" 
                        value={editForm.vk_profile || ''} 
                        onChange={e => setEditForm({...editForm, vk_profile: e.target.value})} 
                        placeholder="https://vk.com/..."
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1">Instagram (ссылка на профиль)</label>
                    <input 
                        className="w-full border border-gray-300 rounded-lg p-3" 
                        value={editForm.instagram_profile || ''} 
                        onChange={e => setEditForm({...editForm, instagram_profile: e.target.value})} 
                        placeholder="https://instagram.com/..."
                    />
                </div>

                <div className="pt-4">
                     <button 
                        onClick={handleSaveProfile}
                        className="w-full bg-amber-600 text-white font-bold py-3 rounded-xl shadow-lg active:scale-95 transition-transform"
                     >
                        Сохранить изменения
                     </button>
                </div>
            </div>
        </div>
    );
  }

  // CHAT SCREENS
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
		onDeleteRelationship={handleDeleteRelationship} // <--- ДОБАВЛЕНО
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

  // MAIN RENDER SWITCH
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
             <div className="p-4 space-y-2">
                 <h2 className="text-xl font-bold mb-4">Сообщения</h2>
                 {chats.map(chat => {
                     const pid = chat.participantIds.find(id => id !== currentUser?.id);
                     if (currentUser?.blockedUserIds?.includes(pid!)) return null; 
                     const p = partners.find(x => x.id === pid);
                     if (!p) return null;
                     const lastMsg = chat.messages[chat.messages.length - 1];
                     return (
                         <div key={chat.id} onClick={() => setActiveChatId(chat.id)} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
                             <img src={p.avatar} className="w-12 h-12 rounded-full object-cover" alt=""/>
                             <div className="flex-1">
                                 <div className="flex justify-between">
                                    <span className="font-bold text-gray-900">{p.name}</span>
                                    {lastMsg && <span className="text-xs text-gray-400">{new Date(lastMsg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>}
                                 </div>
                                 <div className="text-sm text-gray-500 truncate">{lastMsg?.text || 'Нет сообщений'}</div>
                             </div>
                         </div>
                     );
                 })}
             </div>
         );
      case 'profile':
        return (
          <div className="p-6">
             {/* Кнопка редактирования теперь внутри контейнера */}
             <div className="flex justify-center mb-6">
                <button 
                    onClick={handleStartEdit}
                    className="flex items-center gap-2 text-amber-600 border border-amber-600 px-4 py-2 rounded-full text-sm font-medium active:bg-amber-50"
                >
                    <Icons.User /> Редактировать профиль
                </button>
             </div>

             <div className="text-center mb-6">
                <div className="w-24 h-24 bg-amber-100 rounded-full mx-auto mb-4 flex items-center justify-center text-amber-600 border-4 border-white shadow-lg overflow-hidden">
                    <img src={currentUser?.avatar} alt="Me" className="w-full h-full object-cover" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">{currentUser?.name}</h2>
                <div className="font-mono text-sm text-gray-400 bg-gray-100 px-3 py-1 rounded-md inline-block mt-2 tracking-wider">
                    {currentUser?.fohowId}
                </div>
             </div>

             {currentUser?.bio && (
                 <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6">
                     <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">О себе</h3>
                     <p className="text-sm text-gray-600">{currentUser.bio}</p>
                 </div>
             )}

             {currentUser?.visibilitySettings && (
                 <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6">
                     <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Приватность</h3>

                     <div className="flex items-center justify-between py-2 border-b border-gray-50">
                         <div className="flex items-center gap-3">
                             <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><Icons.Phone /></div>
                             <span className="text-gray-700 font-medium text-sm">Показывать телефон</span>
                         </div>
                         <button onClick={() => toggleVisibility('showPhone')} className="text-2xl text-amber-600 focus:outline-none">
                             {currentUser.visibilitySettings.showPhone ? <Icons.Eye /> : <Icons.EyeOff />}
                         </button>
                     </div>

                     <div className="flex items-center justify-between py-2 border-b border-gray-50">
                         <div className="flex items-center gap-3">
                             <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><Icons.Mail /></div>
                             <span className="text-gray-700 font-medium text-sm">Показывать Email</span>
                         </div>
                         <button onClick={() => toggleVisibility('showEmail')} className="text-2xl text-amber-600 focus:outline-none">
                             {currentUser.visibilitySettings.showEmail ? <Icons.Eye /> : <Icons.EyeOff />}
                         </button>
                     </div>

                     <div className="flex items-center justify-between py-2 pt-3">
                         <div className="flex items-center gap-3">
                             <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><Icons.Message /></div>
                             <div className="flex flex-col">
                                 <span className="text-gray-700 font-medium text-sm">Сообщения от всех</span>
                                 <span className="text-[10px] text-gray-400">Разрешить писать "не партнерам"</span>
                             </div>
                         </div>
                         <button onClick={() => toggleVisibility('allowCrossLineMessages')} className="text-2xl text-amber-600 focus:outline-none">
                             {currentUser.visibilitySettings.allowCrossLineMessages ? <Icons.Check /> : <Icons.X />}
                         </button>
                     </div>
                 </div>
             )}

             {currentUser?.visibilitySettings && (
                 <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6">
                     <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">👁️ Видимость контактов</h3>

                     <div className="flex items-center justify-between py-2 border-b border-gray-50">
                         <span className="text-gray-700 text-sm">Показывать Telegram</span>
                         <button onClick={() => toggleVisibility('showTelegram')} className="text-2xl text-amber-600 focus:outline-none">
                             {currentUser.visibilitySettings.showTelegram ? <Icons.Eye /> : <Icons.EyeOff />}
                         </button>
                     </div>

                     <div className="flex items-center justify-between py-2 border-b border-gray-50">
                         <span className="text-gray-700 text-sm">Показывать VK</span>
                         <button onClick={() => toggleVisibility('showVK')} className="text-2xl text-amber-600 focus:outline-none">
                             {currentUser.visibilitySettings.showVK ? <Icons.Eye /> : <Icons.EyeOff />}
                         </button>
                     </div>

                     <div className="flex items-center justify-between py-2 border-b border-gray-50">
                         <span className="text-gray-700 text-sm">Показывать Instagram</span>
                         <button onClick={() => toggleVisibility('showInstagram')} className="text-2xl text-amber-600 focus:outline-none">
                             {currentUser.visibilitySettings.showInstagram ? <Icons.Eye /> : <Icons.EyeOff />}
                         </button>
                     </div>

                     <div className="flex items-center justify-between py-2">
                         <span className="text-gray-700 text-sm">Показывать WhatsApp</span>
                         <button onClick={() => toggleVisibility('showWhatsApp')} className="text-2xl text-amber-600 focus:outline-none">
                             {currentUser.visibilitySettings.showWhatsApp ? <Icons.Eye /> : <Icons.EyeOff />}
                         </button>
                     </div>
                 </div>
             )}

             {currentUser?.searchSettings && (
                 <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6">
                     <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">🔍 Разрешения на поиск</h3>
                     
                      <div className="flex items-center justify-between py-2 border-b border-gray-50">
                         <span className="text-gray-700 text-sm">Искать по имени</span>
                         <button onClick={() => toggleSearchSetting('searchByName')} className="text-2xl text-amber-600 focus:outline-none">
                             {currentUser.searchSettings.searchByName ? <Icons.Check /> : <Icons.X />}
                         </button>
                     </div>
                     
                     <div className="flex items-center justify-between py-2 border-b border-gray-50">
                         <span className="text-gray-700 text-sm">Искать по городу</span>
                         <button onClick={() => toggleSearchSetting('searchByCity')} className="text-2xl text-amber-600 focus:outline-none">
                             {currentUser.searchSettings.searchByCity ? <Icons.Check /> : <Icons.X />}
                         </button>
                     </div>

                     <div className="flex items-center justify-between py-2 border-b border-gray-50">
                         <span className="text-gray-700 text-sm">Искать по стране</span>
                         <button onClick={() => toggleSearchSetting('searchByCountry')} className="text-2xl text-amber-600 focus:outline-none">
                             {currentUser.searchSettings.searchByCountry ? <Icons.Check /> : <Icons.X />}
                         </button>
                     </div>

                     <div className="flex items-center justify-between py-2 border-b border-gray-50">
                         <span className="text-gray-700 text-sm">Искать по номеру FOHOW</span>
                         <button onClick={() => toggleSearchSetting('searchByPersonalId')} className="text-2xl text-amber-600 focus:outline-none">
                             {currentUser.searchSettings.searchByPersonalId ? <Icons.Check /> : <Icons.X />}
                         </button>
                     </div>

                     <div className="flex items-center justify-between py-2">
                         <span className="text-gray-700 text-sm">Искать по представительству</span>
                         <button onClick={() => toggleSearchSetting('searchByOffice')} className="text-2xl text-amber-600 focus:outline-none">
                             {currentUser.searchSettings.searchByOffice ? <Icons.Check /> : <Icons.X />}
                         </button>
                     </div>
                 </div>
             )}

             {currentUser?.blockedUserIds && currentUser.blockedUserIds.length > 0 && (
                 <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6">
                     <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Черный список</h3>
                     {currentUser.blockedUserIds.map(blockedId => {
                         const blockedUser = partners.find(p => p.id === blockedId);
                         return (
                             <div key={blockedId} className="flex justify-between items-center py-2">
                                 <span className="text-gray-700 text-sm font-bold">{blockedUser?.name || 'Пользователь'}</span>
                                 <button 
                                    onClick={() => handleUnblockUser(blockedId)}
                                    className="text-xs text-red-500 border border-red-200 px-2 py-1 rounded-md"
                                 >
                                     Разблокировать
                                 </button>
                             </div>
                         );
                     })}
                 </div>
             )}

             <button onClick={() => { api.logout(); setIsAuthenticated(false); setCurrentUser(null); }} className="block w-full text-red-500 font-bold bg-white py-3 rounded-xl border border-gray-200">
                Выйти
             </button>
          </div>
        );
      default: return null;
    }
  };

  const isClient = currentUser?.role === 'client';

  return (
    <div className="max-w-md mx-auto h-screen flex flex-col bg-gray-50 shadow-2xl overflow-hidden md:border-x md:border-gray-200">

      {/* Header - Fixed */}
      <header className="bg-white px-4 py-3 shadow-sm flex items-center justify-between flex-shrink-0 z-20">
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">F</div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">FOHOW <span className="text-amber-600">Connect</span></h1>
        </div>
        <div className="flex items-center gap-3">
             <button onClick={() => setShowNotifications(true)} className="p-2 relative text-gray-600">
                <Icons.Bell alert={notifications.length > 0} />
             </button>
        </div>
      </header>

      {/* Main Content - Scrollable */}
      <main className="flex-1 overflow-y-auto">
        {renderContent()}
      </main>

      {/* Navigation - Fixed */}
      <nav className="bg-white border-t border-gray-200 px-2 py-2 pb-safe flex-shrink-0 z-30">
        <div className="flex justify-around items-center max-w-md mx-auto">
          {!isClient && (
            <NavBtn icon={<Icons.Users />} label="Команда" active={activeTab === 'team'} onClick={() => setActiveTab('team')} />
          )}
          <NavBtn icon={<Icons.Briefcase />} label="Офисы" active={activeTab === 'offices'} onClick={() => setActiveTab('offices')} />
          <NavBtn icon={<Icons.Globe />} label="Весь мир" active={activeTab === 'global'} onClick={() => setActiveTab('global')} />
          {!isClient && (
             <NavBtn icon={<Icons.Message />} label="Чаты" active={activeTab === 'chats'} onClick={() => setActiveTab('chats')} />
          )}
          <NavBtn icon={<Icons.User />} label="Профиль" active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
        </div>
      </nav>
    </div>
  );
};

const NavBtn = ({ icon, label, active, onClick }: any) => (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 p-2 w-16 transition-colors ${active ? 'text-amber-600' : 'text-gray-400'}`}>
        {icon}
        <span className="text-[9px] font-medium">{label}</span>
    </button>
);

export default App;
