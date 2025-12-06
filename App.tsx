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
    
    const [partnersData, relData, notifData, chatsData] = await Promise.all([
        api.getPartners(),
        api.getMyRelationships(),
        api.getNotifications(),
        api.getChats() // <--- ДОБАВЛЕНО
    ]);
    
    setPartners(partnersData);
    
    if (relData && relData.relationships) setRelationships(relData.relationships);
    if (notifData && notifData.notifications) setNotifications(notifData.notifications);
    // <--- ДОБАВЛЕНО
    if (chatsData && chatsData.chats) setChats(chatsData.chats.map((c: any) => ({
         ...c, 
         messages: [] // Изначально сообщений нет, подгрузим при открытии
    })));

  } catch (e) {
    console.error("Failed to load data", e);
  } finally {
    setIsLoading(false);
  }
};

// Подгрузка сообщений при открытии чата
useEffect(() => {
    if (!activeChatId || activeChatId === 'broadcast') return;

    const loadMessages = async () => {
        try {
            const data = await api.getChatMessages(activeChatId);
            if (data.success) {
                setChats(prev => prev.map(c => 
                    c.id === activeChatId ? { ...c, messages: data.messages } : c
                ));
            }
        } catch (e) {
            console.error("Failed to load messages", e);
        }
    };

    loadMessages();
    // Можно добавить интервал для поллинга сообщений, если нужно
    const interval = setInterval(loadMessages, 5000); // Обновление каждые 5 сек
    return () => clearInterval(interval);
}, [activeChatId]);

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

const handleStartChat = async () => {
  if (!currentUser || !selectedPartner) return;
  
  try {
      const res = await api.createChat(selectedPartner.id);
      if (res.success) {
          const chatId = res.chatId;
          
          // Если чата нет в списке, добавим его
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
  } catch (e) {
      alert('Не удалось начать чат');
  }
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

const handleSendMessage = async (text: string) => {
  if (!currentUser) return;

  // Broadcast (без изменений)
  if (broadcastMode.active && broadcastMode.targets) {
      // ... старый код broadcast ...
      alert('Рассылка пока работает только визуально');
      setBroadcastMode({ active: false });
      return;
  }

  // Direct Message
  if (activeChatId) {
      try {
          // Оптимистичное обновление (показываем сообщение сразу)
          const tempId = Date.now().toString();
          setChats(prev => prev.map(chat => {
              if (chat.id === activeChatId) {
                  return {
                      ...chat,
                      messages: [...chat.messages, {
                          id: tempId,
                          senderId: currentUser.id,
                          text: text,
                          timestamp: Date.now()
                      }],
                      lastMessageTime: Date.now()
                  };
              }
              return chat;
          }));

          // Отправка на сервер
          const res = await api.sendMessage(activeChatId, text);
          
          // Если успешно, можно обновить ID сообщения, но при поллинге оно и так обновится
          
      } catch (e) {
          console.error(e);
          alert('Ошибка при отправке');
      }
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
             <div className="p-4">
                 <h2 className="text-xl font-bold text-gray-900 mb-4">Чать и собощание</h2>

                 {/* Search Bar */}
                 <div className="relative mb-4">
                   <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                     <Icons.Search />
                   </div>
                   <input
                     type="text"
                     className="block w-full pl-11 pr-4 py-3 border border-gray-200 rounded-full bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                     placeholder="Наити чат или контакт"
                   />
                 </div>

                 <div className="space-y-3">
                   {chats.map(chat => {
                       const pid = chat.participantIds.find(id => id !== currentUser?.id);
                       if (currentUser?.blockedUserIds?.includes(pid!)) return null;
                       const p = partners.find(x => x.id === pid);
                       if (!p) return null;
                       const lastMsg = chat.messages[chat.messages.length - 1];
                       const unreadCount = Math.floor(Math.random() * 5); // Mock unread count

                       const formatDate = (timestamp: number) => {
                         const date = new Date(timestamp);
                         const now = new Date();
                         const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
                         if (diffDays === 0) {
                           return date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                         } else if (diffDays === 1) {
                           return 'Встеря';
                         } else {
                           return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
                         }
                       };

                       return (
                           <div key={chat.id} onClick={() => setActiveChatId(chat.id)} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3 active:scale-[0.99] transition-transform">
                               <img src={p.avatar} className="w-14 h-14 rounded-full object-cover avatar-gold-ring" alt=""/>
                               <div className="flex-1 min-w-0">
                                   <div className="flex justify-between items-start">
                                      <span className="font-bold text-gray-900">{p.name}</span>
                                      {unreadCount > 0 && (
                                        <span className="badge-gold w-6 h-6 rounded-full flex items-center justify-center text-xs">{unreadCount}</span>
                                      )}
                                   </div>
                                   <div className="text-xs text-gray-400 font-mono mb-1">{p.fohowId}</div>
                                   <div className="flex justify-between items-center">
                                     <div className="text-sm text-gray-500 truncate flex-1">{lastMsg?.text || 'Привет, как дела?'}</div>
                                     <span className="text-xs text-gray-400 ml-2 whitespace-nowrap">{lastMsg ? formatDate(lastMsg.timestamp) : '14:30'}</span>
                                   </div>
                               </div>
                           </div>
                       );
                   })}

                   {chats.length === 0 && (
                     <div className="text-center py-10 text-gray-400">
                       <p>Нет активных чатов</p>
                     </div>
                   )}
                 </div>
             </div>
         );
      case 'profile':
        return (
          <div className="p-6">
             {/* Profile Header */}
             <div className="text-center mb-6">
                <div className="w-28 h-28 rounded-full mx-auto mb-4 overflow-hidden avatar-gold-ring">
                    <img src={currentUser?.avatar} alt="Me" className="w-full h-full object-cover" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">{currentUser?.name}</h2>
                <div className="text-sm text-gray-400 mt-1">
                    {currentUser?.fohowId}
                </div>
             </div>

             {/* Edit Profile Button */}
             <div className="flex justify-center mb-6">
                <button
                    onClick={handleStartEdit}
                    className="px-6 py-2.5 rounded-full border-2 border-amber-500 text-amber-600 text-sm font-medium active:bg-amber-50"
                >
                    Редакитровать профиль
                </button>
             </div>

             {/* About Section */}
             <div className="bg-gray-50 rounded-2xl p-4 mb-4">
                 <div className="flex items-center gap-3 mb-2">
                     <div className="text-gray-500"><Icons.User /></div>
                     <h3 className="text-sm font-bold text-gray-700 uppercase">О СЕБЕ</h3>
                 </div>
                 <p className="text-sm text-gray-500 ml-9">{currentUser?.bio || 'Привет'}</p>
             </div>

             {/* Privacy Section */}
             {currentUser?.visibilitySettings && (
                 <div className="bg-gray-50 rounded-2xl p-4 mb-4">
                     <div className="flex items-center gap-3 mb-4">
                         <div className="text-gray-500"><Icons.User /></div>
                         <h3 className="text-sm font-bold text-gray-700 uppercase">ПРИВАТІНОСТЬ</h3>
                     </div>

                     <div className="flex items-center justify-between py-3 border-b border-gray-200">
                         <div className="flex items-center gap-3">
                             <div className="text-amber-600"><Icons.Check /></div>
                             <span className="text-gray-700 text-sm">Показылать телефоон</span>
                         </div>
                         <div
                           onClick={() => toggleVisibility('showPhone')}
                           className={`toggle-switch ${currentUser.visibilitySettings.showPhone ? 'active' : ''}`}
                         />
                     </div>

                     <div className="flex items-center justify-between py-3">
                         <div className="flex items-center gap-3">
                             <div className="text-amber-600"><Icons.Check /></div>
                             <span className="text-gray-700 text-sm">Показылать от Email</span>
                         </div>
                         <div
                           onClick={() => toggleVisibility('showEmail')}
                           className={`toggle-switch ${currentUser.visibilitySettings.showEmail ? 'active' : ''}`}
                         />
                     </div>
                 </div>
             )}

             {/* Contact Visibility Section */}
             {currentUser?.visibilitySettings && (
                 <div className="bg-gray-50 rounded-2xl p-4 mb-4">
                     <div className="flex items-center gap-3 mb-4">
                         <div className="text-gray-500">
                           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                             <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                             <circle cx="9" cy="7" r="4"/>
                             <line x1="17" y1="11" x2="22" y2="11"/>
                           </svg>
                         </div>
                         <h3 className="text-sm font-bold text-gray-700 uppercase">ВИДИЗМОСТИ КОНТАКТОВ</h3>
                     </div>

                     <div className="flex items-center justify-between py-3">
                         <div className="flex items-center gap-3">
                             <div className="text-gray-400 text-lg">+</div>
                             <span className="text-gray-700 text-sm">Показыьать Telegram</span>
                         </div>
                         <div
                           onClick={() => toggleVisibility('showTelegram')}
                           className={`toggle-switch ${currentUser.visibilitySettings.showTelegram ? 'active' : ''}`}
                         />
                     </div>
                 </div>
             )}

             {/* Logout Button */}
             <button onClick={() => { api.logout(); setIsAuthenticated(false); setCurrentUser(null); }} className="block w-full text-red-500 font-medium bg-gray-50 py-3 rounded-2xl mt-4">
                Выйти
             </button>
          </div>
        );
      default: return null;
    }
  };

  const isClient = currentUser?.role === 'client';

  return (
    <div className="min-h-screen bg-gradient-gold p-4 flex flex-col">
      {/* Star decoration */}
      <div className="star-decoration"></div>

      {/* Main White Card Container */}
      <div className="max-w-md mx-auto w-full flex-1 flex flex-col bg-white rounded-3xl shadow-2xl overflow-hidden">

        {/* Header */}
        <header className="px-4 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-amber-600 rounded-xl flex items-center justify-center text-white shadow-md">
              <span className="text-xl font-bold" style={{ fontFamily: 'serif' }}>F</span>
            </div>
            <span className="text-sm text-gray-600 font-medium">FOHOW Connect</span>
          </div>
          <button onClick={() => setShowNotifications(true)} className="p-2 relative text-gray-500">
            <Icons.Bell alert={notifications.length > 0} />
          </button>
        </header>

        {/* Main Content - Scrollable */}
        <main className="flex-1 overflow-y-auto">
          {renderContent()}
        </main>

        {/* Navigation */}
        <nav className="px-2 py-3 pb-4 flex-shrink-0 border-t border-gray-100">
          <div className="flex justify-around items-center max-w-md mx-auto">
            {!isClient && (
              <NavBtn icon={<Icons.Users />} label="Команда" active={activeTab === 'team'} onClick={() => setActiveTab('team')} />
            )}
            <NavBtn icon={<Icons.Briefcase />} label="Офисы" active={activeTab === 'offices'} onClick={() => setActiveTab('offices')} />
            <NavBtn icon={<Icons.Globe />} label="Весь мир" active={activeTab === 'global'} onClick={() => setActiveTab('global')} isCenter={true} />
            {!isClient && (
              <NavBtn icon={<Icons.Message />} label="Чаты" active={activeTab === 'chats'} onClick={() => setActiveTab('chats')} />
            )}
            <NavBtn icon={<Icons.User />} label="Профиль" active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
          </div>
        </nav>
      </div>
    </div>
  );
};

const NavBtn = ({ icon, label, active, onClick, isCenter }: any) => (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition-all ${
        active
          ? 'btn-gold-gradient text-white'
          : isCenter
            ? 'text-amber-600'
            : 'text-gray-400'
      }`}
    >
        <div className={active ? 'text-white' : ''}>
          {icon}
        </div>
        <span className={`text-[10px] font-medium ${active ? 'text-white' : ''}`}>{label}</span>
    </button>
);

export default App;
