import React from 'react';
import { Notification, Partner } from '../types';
import { Icons } from '../constants';

interface NotificationsProps {
  notifications: Notification[];
  partners: Partner[]; // To resolve names
  onAccept: (notification: Notification) => void;
  onReject: (notification: Notification) => void;
  onClose: () => void;
}

const Notifications: React.FC<NotificationsProps> = ({ notifications, partners, onAccept, onReject, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col animate-fade-in h-screen">
      <div className="bg-white px-4 py-3 shadow-sm flex items-center gap-3 border-b border-gray-200">
        <button onClick={onClose} className="p-2 -ml-2">
          <Icons.ChevronLeft />
        </button>
        <h2 className="text-xl font-bold">Уведомления</h2>
      </div>

      <div className="p-4 space-y-3 overflow-y-auto flex-1">
        {notifications.length === 0 ? (
          <div className="text-center text-gray-500 mt-10">
            Нет новых уведомлений
          </div>
        ) : (
          notifications.map(notif => {
            const sender = partners.find(p => p.id === notif.fromUserId);
            
            return (
              <div key={notif.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                        {sender ? <img src={sender.avatar} alt="" /> : <Icons.User />}
                    </div>
                    <div>
                        <div className="font-bold text-gray-900">{sender?.name || 'Пользователь'}</div>
                        <p className="text-sm text-gray-600">{notif.text}</p>
                        <div className="text-xs text-gray-400 mt-1">{new Date(notif.timestamp).toLocaleDateString()}</div>
                    </div>
                </div>
                
                {notif.type === 'relationship_request' && (
                  <div className="flex gap-2 mt-2">
                    <button 
                      onClick={() => onAccept(notif)}
                      className="flex-1 bg-amber-600 text-white py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
                    >
                      <Icons.Check /> Подтвердить
                    </button>
                    <button 
                      onClick={() => onReject(notif)}
                      className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
                    >
                      <Icons.X /> Отклонить
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Notifications;
