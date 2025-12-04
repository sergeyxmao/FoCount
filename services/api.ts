import { Partner, User, AuthResponse, Rank } from '../types';
import { MOCK_PARTNERS } from '../constants';

const API_BASE_URL = 'https://interactive.marketingfohow.ru/api';
const USE_MOCK_API = false;

export const api = {
  /**
   * Авторизация пользователя
   */
  login: async (loginId: string, password: string): Promise<User> => {
    if (USE_MOCK_API) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 1. Сценарий: Вход Партнера (по Компьютерному номеру)
      // Пример формата: RUY68241101111 (Буквы, Цифры региона, Дата, Порядковый номер)
      const isFohowId = /^[A-Z]{3}\d+/.test(loginId.toUpperCase());
      
      if (isFohowId) {
        // Симуляция проверки в базе
        if (loginId.toUpperCase().startsWith('RUY68') && password === '123456') {
           const mockPartner: User = {
            id: 'u1',
            fohowId: loginId.toUpperCase(),
            role: 'partner',
            isVerified: true,
            name: 'Администратор (Я)',
            email: 'admin@fohow.com',
            rank: Rank.DIAMOND_5,
            city: 'Тюмень',
            country: 'Россия',
            phone: '+7 999 000 00 00',
            avatar: 'https://ui-avatars.com/api/?name=Admin&background=D4AF37&color=fff',
            bio: 'Моя цель - Сапфир до конца года!',
            token: 'mock-jwt-token-partner',
            isPublic: true,
            isOffice: true,
            parentId: 'root',
            teamIds: ['1', '2', '5'] // Видит свою структуру
          };
          localStorage.setItem('fohow_token', mockPartner.token);
          localStorage.setItem('fohow_user', JSON.stringify(mockPartner));
          return mockPartner;
        }
      } 
      
      // 2. Сценарий: Вход Клиента (Email или Временный ID)
      if (loginId.includes('@') || loginId.toUpperCase().startsWith('RUY00')) {
          if (password === 'client') {
            const mockClient: User = {
              id: 'c1',
              fohowId: loginId.toUpperCase().startsWith('RUY00') ? loginId.toUpperCase() : 'RUY000000000001',
              role: 'client',
              isVerified: false,
              name: 'Гость / Клиент',
              email: loginId.includes('@') ? loginId : 'client@guest.com',
              rank: Rank.NOVICE,
              city: 'Москва',
              country: 'Россия',
              phone: '',
              avatar: 'https://ui-avatars.com/api/?name=Guest&background=gray&color=fff',
              bio: 'Интересуюсь продукцией',
              token: 'mock-jwt-token-client',
              isPublic: false,
              isOffice: false,
              teamIds: [] // У клиента нет структуры
            };
            localStorage.setItem('fohow_token', mockClient.token);
            localStorage.setItem('fohow_user', JSON.stringify(mockClient));
            return mockClient;
          }
      }

      throw new Error('Неверный ID или пароль.\nДля партнера: RUY68... / 123456\nДля клиента: client@test.com / client');
    }

    // Real API Call
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loginId, password }),
      });

      if (!response.ok) throw new Error('Ошибка авторизации');

      const data: AuthResponse = await response.json();
      localStorage.setItem('fohow_token', data.token);
      localStorage.setItem('fohow_user', JSON.stringify(data.user));
      return data.user;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Получение списка партнеров
   */
  getPartners: async (): Promise<Partner[]> => {
    if (USE_MOCK_API) {
      await new Promise(resolve => setTimeout(resolve, 800));
      return MOCK_PARTNERS;
    }

    try {
      const token = localStorage.getItem('fohow_token');
      const response = await fetch(`${API_BASE_URL}/partners`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Не удалось загрузить список');
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      return [];
    }
  },

  logout: () => {
    localStorage.removeItem('fohow_token');
    localStorage.removeItem('fohow_user');
  },

  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem('fohow_user');
    if (userStr) {
      return JSON.parse(userStr);
    }
    return null;
  }
};
