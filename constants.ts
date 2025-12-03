import React from 'react';
import { Partner, Rank, Relationship, Notification, Chat } from './types';

// MOCK DATA

export const MOCK_PARTNERS: Partner[] = [
  {
    id: 'u1', // Я (Ирина)
    fohowId: 'RUY68240115001',
    name: 'Ирина Васильева',
    rank: Rank.PHOENIX,
    country: 'Россия',
    city: 'Тюмень',
    phone: '+7 900 123 45 67',
    email: 'irina.fohow@example.com',
    avatar: 'https://ui-avatars.com/api/?name=Admin&background=D4AF37&color=fff',
    bio: 'В бизнесе более 10 лет.',
    whatsapp: '79001234567',
    role: 'partner',
    isVerified: true,
    isPublic: true,
    isOffice: true,
    privacySettings: {
      showPhone: true,
      showEmail: true,
      allowCrossLineMessages: true
    },
    blockedUserIds: []
  },
  {
    id: '2', // Мой партнер (Изумруд)
    fohowId: 'RUY68240220055',
    name: 'Алексей Петров',
    rank: Rank.EMERALD,
    country: 'Россия',
    city: 'Санкт-Петербург',
    phone: '+7 900 987 65 43',
    email: 'alex.p@example.com',
    avatar: 'https://picsum.photos/200/200?random=2',
    bio: 'Специалист по ТКМ.',
    telegram: 'alexpetrov',
    role: 'partner',
    isVerified: true,
    isPublic: true,
    isOffice: false,
    privacySettings: {
      showPhone: true,
      showEmail: false,
      allowCrossLineMessages: true
    },
    blockedUserIds: []
  },
  {
    id: '3', // Параллельная ветка (Офис)
    fohowId: 'RUM77230510888',
    name: 'Елена Смирнова',
    rank: Rank.EMERALD,
    country: 'Россия',
    city: 'Казань',
    phone: '+7 917 111 22 33',
    email: 'elena.s@example.com',
    avatar: 'https://picsum.photos/200/200?random=3',
    bio: 'Офис в центре Казани.',
    whatsapp: '79171112233',
    role: 'partner',
    isVerified: true,
    isPublic: true,
    isOffice: true,
    privacySettings: {
      showPhone: true,
      showEmail: true,
      allowCrossLineMessages: true
    },
    blockedUserIds: []
  },
  {
    id: '4', // Параллельная ветка (Закрытый профиль)
    fohowId: 'KZ105221101999',
    name: 'Дмитрий Соколов',
    rank: Rank.SAPPHIRE,
    country: 'Россия',
    city: 'Новосибирск',
    phone: '+7 954 333 44 55',
    email: 'd.sokolov@example.com',
    avatar: 'https://picsum.photos/200/200?random=4',
    bio: 'Лидер молодежной команды.',
    role: 'partner',
    isVerified: true,
    isPublic: true, // Он виден в поиске
    isOffice: false,
    privacySettings: {
      showPhone: false, // Но телефон скрыт
      showEmail: false, // Email скрыт
      allowCrossLineMessages: false // Писать ему нельзя
    },
    blockedUserIds: []
  },
  {
    id: '5', // Мой наставник
    fohowId: 'RUY68240301002',
    name: 'Мария Ким',
    rank: Rank.AMBASSADOR,
    country: 'Казахстан',
    city: 'Алматы',
    phone: '+7 777 888 99 00',
    email: 'maria.kim@example.com',
    avatar: 'https://picsum.photos/200/200?random=5',
    bio: 'Топ-лидер компании.',
    role: 'partner',
    isVerified: true,
    isPublic: true,
    isOffice: true,
    privacySettings: {
      showPhone: true,
      showEmail: true,
      allowCrossLineMessages: true
    },
    blockedUserIds: []
  },
  {
    id: '6', // Мой партнер (Изумруд 2)
    fohowId: 'RUY68240505005',
    name: 'Ольга Иванова',
    rank: Rank.EMERALD,
    country: 'Россия',
    city: 'Тюмень',
    phone: '+7 922 000 11 22',
    email: 'olga@test.com',
    avatar: 'https://picsum.photos/200/200?random=6',
    bio: 'Только начала активно работать.',
    role: 'partner',
    isVerified: true,
    isPublic: true,
    isOffice: false,
    privacySettings: {
      showPhone: true,
      showEmail: true,
      allowCrossLineMessages: true
    },
    blockedUserIds: []
  },
  {
    id: 'c1', // Клиент
    fohowId: 'RUY000000000005',
    name: 'Новый Клиент',
    rank: Rank.DISTRIBUTOR,
    country: 'Россия',
    city: 'Омск',
    phone: '',
    email: 'client@test.com',
    avatar: '',
    bio: '',
    role: 'client',
    isVerified: false,
    isPublic: false,
    isOffice: false,
    privacySettings: {
      showPhone: false,
      showEmail: false,
      allowCrossLineMessages: false
    },
    blockedUserIds: []
  }
];

export const MOCK_RELATIONSHIPS: Relationship[] = [
  { id: 'r1', initiatorId: 'u1', targetId: '5', type: 'mentor', status: 'confirmed' },
  { id: 'r2', initiatorId: 'u1', targetId: '2', type: 'downline', status: 'confirmed' },
  { id: 'r3', initiatorId: '6', targetId: 'u1', type: 'mentor', status: 'confirmed' }
];

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'n1',
    type: 'relationship_request',
    fromUserId: '4', 
    relationshipId: 'req_1',
    text: 'Дмитрий Соколов хочет добавить вас как Наставника',
    timestamp: Date.now() - 100000,
    read: false
  }
];

export const MOCK_CHATS: Chat[] = [
  {
    id: 'chat_1',
    participantIds: ['u1', '2'], // Чат с Алексеем
    messages: [
      { id: 'm1', senderId: '2', text: 'Добрый день! Когда у нас планерка?', timestamp: Date.now() - 3600000 },
      { id: 'm2', senderId: 'u1', text: 'Привет, в пятницу в 18:00', timestamp: Date.now() - 1800000 }
    ],
    lastMessageTime: Date.now() - 1800000
  }
];

// Simple SVG Icons
export const Icons = {
  Users: () => React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, 
    React.createElement("path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" }),
    React.createElement("circle", { cx: "9", cy: "7", r: "4" }),
    React.createElement("path", { d: "M22 21v-2a4 4 0 0 0-3-3.87" }),
    React.createElement("path", { d: "M16 3.13a4 4 0 0 1 0 7.75" })
  ),
  Bot: () => React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("path", { d: "M12 8V4H8" }), React.createElement("rect", { width: "16", height: "12", x: "4", y: "8", rx: "2" }), React.createElement("path", { d: "M2 14h2" }), React.createElement("path", { d: "M20 14h2" }), React.createElement("path", { d: "M15 13v2" }), React.createElement("path", { d: "M9 13v2" })
  ),
  Heart: ({ filled }: { filled?: boolean }) => React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 24 24", fill: filled ? "currentColor" : "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: filled ? "text-red-500" : "" },
    React.createElement("path", { d: "M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5 4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" })
  ),
  User: () => React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("path", { d: "M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" }), React.createElement("circle", { cx: "12", cy: "7", r: "4" })
  ),
  Search: () => React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("circle", { cx: "11", cy: "11", r: "8" }), React.createElement("path", { d: "m21 21-4.3-4.3" })
  ),
  Phone: () => React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("path", { d: "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" })
  ),
  Message: () => React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("path", { d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" })
  ),
  Send: () => React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("path", { d: "m22 2-7 20-4-9-9-4Z" }), React.createElement("path", { d: "M22 2 11 13" })
  ),
  ChevronLeft: () => React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("path", { d: "m15 18-6-6 6-6" })
  ),
  Badge: () => React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("path", { d: "M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.78 4.78 4 4 0 0 1-6.74 0 4 4 0 0 1-4.78-4.77 2 2 0 0 1 0-2.36Z" })
  ),
  Briefcase: () => React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
     React.createElement("rect", { width: "20", height: "14", x: "2", y: "7", rx: "2", ry: "2" }), React.createElement("path", { d: "M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" })
   ),
   Globe: () => React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("circle", { cx: "12", cy: "12", r: "10" }), React.createElement("path", { d: "M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" }), React.createElement("path", { d: "M2 12h20" })
  ),
  Lock: () => React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("rect", { width: "18", height: "11", x: "3", y: "11", rx: "2", ry: "2" }), React.createElement("path", { d: "M7 11V7a5 5 0 0 1 10 0v4" })
  ),
  Card: () => React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("rect", { width: "20", height: "14", x: "2", y: "5", rx: "2" }), React.createElement("line", { x1: "2", x2: "22", y1: "10", y2: "10" })
  ),
  Bell: ({ alert }: { alert?: boolean }) => React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("path", { d: "M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" }), React.createElement("path", { d: "M10.3 21a1.94 1.94 0 0 0 3.4 0" }),
    alert && React.createElement("circle", { cx: "18", cy: "6", r: "3", fill: "red", stroke: "none" })
  ),
  Check: () => React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("polyline", { points: "20 6 9 17 4 12" })
  ),
  X: () => React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("line", { x1: "18", y1: "6", x2: "6", y2: "18" }), React.createElement("line", { x1: "6", y1: "6", x2: "18", y2: "18" })
  ),
  Mail: () => React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("rect", { width: "20", height: "16", x: "2", y: "4", rx: "2" }), React.createElement("path", { d: "m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" })
  ),
  MoreVertical: () => React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("circle", { cx: "12", cy: "12", r: "1" }), React.createElement("circle", { cx: "12", cy: "5", r: "1" }), React.createElement("circle", { cx: "12", cy: "19", r: "1" })
  ),
  Slash: () => React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("circle", { cx: "12", cy: "12", r: "10" }), React.createElement("line", { x1: "4.93", y1: "4.93", x2: "19.07", y2: "19.07" })
  ),
  Eye: () => React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("path", { d: "M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" }), React.createElement("circle", { cx: "12", cy: "12", r: "3" })
  ),
  EyeOff: () => React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("path", { d: "M9.88 9.88a3 3 0 1 0 4.24 4.24" }), React.createElement("path", { d: "M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" }), React.createElement("path", { d: "M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" }), React.createElement("line", { x1: "2", y1: "2", x2: "22", y2: "22" })
  ),
};
