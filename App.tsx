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
  
  // CORE DATA STATE
  const [partners, setPartners] = useState<Partner[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>(MOCK_RELATIONSHIPS);
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
      setActiveTab('global'); // Всегда показываем "Весь мир" после входа
    } else {
      setIsLoading(false);
    }
  }, []);

  const loadPartners = async () => {
    try {
      setIsLoading(true);
      const data = await api.getPartners();
      console.log('✅ loadPartners получил:', data.length, 'партнёров', data);
      setPartners(data);
    } catch (e) {
      console.error("Failed to load partners", e);
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleSendRequest = (type: RelationshipType) => {
    if (!currentUser || !selectedPartner) return;
    const newRel: Relationship = {
      id: Date.now().toString(),
      initiatorId: currentUser.id,
      targetId: selectedPartner.id,
      type: type,
      status: 'pending'
    };
    setRelationships(prev => [...prev, newRel]);
    alert(`Запрос отправлен пользователю ${selectedPartner.name}`);
  };

  const handleAcceptNotification = (notif: Notification) => {
    if (notif.fromUserId && currentUser) {
       const newRel: Relationship = {
           id: Date.now().toString(),
           initiatorId: notif.fromUserId,
           targetId: currentUser.id,
           type: 'downline',
           status: 'confirmed'
       };
       setRelationships(prev => [...prev, newRel]);
    }
    setNotifications(prev => prev.filter(n => n.id !== notif.id));
  };

  const handleRejectNotification = (notif: Notification) => {
    setNotifications(prev => prev.filter(n => n.id !== notif.id));
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

    // Broadcast
    if (broadcastMode.active && broadcastMode.targets) {
        const newChats = [...chats];
        broadcastMode.targets.forEach(target => {
            let chat = newChats.find(c => c.participantIds.includes(currentUser.id) && c.participantIds.includes(target.id));
            if (!chat) {
                chat = {
                    id: `chat_${currentUser.id}_${target.id}_${Date.now()}`,
                    participantIds: [currentUser.id, target.id],
                    messages: [],
                    lastMessageTime: Date.now()
                };
                newChats.push(chat);
            }
            chat.messages.push({
                id: Date.now().toString() + Math.random(),
                senderId: currentUser.id,
                text: text,
                timestamp: Date.now()
            });
            chat.lastMessageTime = Date.now();
        });
        setChats(newChats);
        alert(`Сообщение отправлено ${broadcastMode.targets.length} партнерам.`);
        setBroadcastMode({ active: false });
        return;
    }

    // Direct Message
    if (activeChatId) {
        setChats(prev => prev.map(chat => {
            if (chat.id === activeChatId) {
                // Determine Recipient
                const recipientId = chat.participantIds.find(id => id !== currentUser.id);
                const recipient = partners.find(p => p.id === recipientId);

                // GHOST BAN LOGIC
                // Check if recipient has blocked current user
                // In a real app, backend would handle this. 
                // Here we simulate: if recipient has me in blockedUserIds, message sends but is effectively "lost" for them.
                // Since this is single-client mock, we can just pretend it's sent.
                
                // However, to satisfy "Partner does not see that he is blocked", 
                // we just add the message to the chat history as usual. 
                // The 'reading' logic would be on the receiver side (filtering out blocked messages).
                
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

  // --------------------------------------------------------------------------
  // RENDER FLOW
  // --------------------------------------------------------------------------

  if (isLoading && !partners.length && isAuthenticated) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div></div>;
  }

  if (!isAuthenticated) {
    return <LoginScreen onLoginSuccess={(user) => { setCurrentUser(user); setIsAuthenticated(true); loadPartners(); setActiveTab(user.role === 'client' ? 'global' : 'team'); }} />;
  }

  // 1. Chat Screens
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

  // 2. Details & Overlays
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

  // 3. Main Logic
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
                     // Ghost Ban Check: If I blocked this user, hide the chat or messages?
                     // Usually chats remain, but new messages don't notify.
                     if (currentUser?.blockedUserIds?.includes(pid!)) return null; // Hide chat if blocked? Or just show blocked mark. Let's hide for now.

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
             <div className="text-center mb-6">
                <div className="w-24 h-24 bg-amber-100 rounded-full mx-auto mb-4 flex items-center justify-center text-amber-600 border-4 border-white shadow-lg overflow-hidden">
                    <img src={currentUser?.avatar} alt="Me" className="w-full h-full object-cover" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">{currentUser?.name}</h2>
                <div className="font-mono text-sm text-gray-400 bg-gray-100 px-3 py-1 rounded-md inline-block mt-2 tracking-wider">
                    {currentUser?.fohowId}
                </div>
             </div>

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

             <button onClick={() => { setIsAuthenticated(false); setCurrentUser(null); }} className="block w-full text-red-500 font-bold bg-white py-3 rounded-xl border border-gray-200">
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
