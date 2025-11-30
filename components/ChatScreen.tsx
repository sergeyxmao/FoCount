import React, { useState, useEffect, useRef } from 'react';
import { Chat, Partner, User } from '../types';
import { Icons } from '../constants';

interface ChatScreenProps {
  chat: Chat | null;
  partner: Partner | null; // For 1-on-1
  currentUser: User;
  onSendMessage: (text: string) => void;
  onBack: () => void;
  onBlockUser?: (userId: string) => void; // New prop for blocking
  isBroadcast?: boolean;
  broadcastRank?: string;
}

const ChatScreen: React.FC<ChatScreenProps> = ({ 
  chat, 
  partner, 
  currentUser, 
  onSendMessage, 
  onBack,
  onBlockUser,
  isBroadcast,
  broadcastRank
}) => {
  const [input, setInput] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chat?.messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSendMessage(input);
    setInput('');
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 fixed inset-0 z-50">
      {/* Header */}
      <div className="bg-white px-4 py-3 shadow-sm flex items-center justify-between border-b border-gray-200 z-10">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 text-gray-600">
            <Icons.ChevronLeft />
          </button>
          
          {isBroadcast ? (
            <div className="flex flex-col">
              <h3 className="font-bold text-gray-900">Рассылка: {broadcastRank}</h3>
              <span className="text-xs text-emerald-600">Сообщение получат все партнёры ранга</span>
            </div>
          ) : (
             <div className="flex items-center gap-3">
              <img 
                src={partner?.avatar} 
                className="w-10 h-10 rounded-full object-cover border border-gray-100" 
                alt={partner?.name} 
              />
              <div className="flex flex-col">
                <h3 className="font-bold text-gray-900">{partner?.name}</h3>
                <span className="text-xs text-emerald-600">{partner?.rank}</span>
              </div>
            </div>
          )}
        </div>

        {/* Menu for Blocking */}
        {!isBroadcast && partner && onBlockUser && (
            <div className="relative">
                <button onClick={() => setShowMenu(!showMenu)} className="p-2 text-gray-400">
                    <Icons.MoreVertical />
                </button>
                {showMenu && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
                        <button 
                            onClick={() => {
                                if (confirm('Заблокировать пользователя? Вы не будете получать от него сообщения.')) {
                                    onBlockUser(partner.id);
                                    onBack();
                                }
                            }}
                            className="w-full text-left px-4 py-3 text-red-500 hover:bg-red-50 text-sm font-medium flex items-center gap-2"
                        >
                            <Icons.Slash /> Заблокировать
                        </button>
                    </div>
                )}
            </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" onClick={() => setShowMenu(false)}>
        {chat?.messages.map((msg) => {
          const isMe = msg.senderId === currentUser.id;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${
                  isMe
                    ? 'bg-emerald-600 text-white rounded-br-none'
                    : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none shadow-sm'
                }`}
              >
                {msg.text}
                <div className={`text-[10px] mt-1 text-right ${isMe ? 'text-emerald-200' : 'text-gray-400'}`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}
        {(!chat?.messages.length && !isBroadcast) && (
          <div className="text-center text-gray-400 text-sm mt-10">
            Начните общение с {partner?.name}
          </div>
        )}
        {isBroadcast && (
            <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl text-amber-800 text-sm mb-4">
                Это режим рассылки. Ваше сообщение будет отправлено каждому партнёру данного ранга в вашей структуре индивидуально.
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isBroadcast ? "Текст рассылки..." : "Сообщение..."}
            className="flex-1 bg-gray-100 rounded-full px-5 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-md disabled:opacity-50 disabled:shadow-none"
          >
            <Icons.Send />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatScreen;