import { Partner, User, AuthResponse, Rank } from '../types';
import { MOCK_PARTNERS } from '../constants';

const API_BASE_URL = 'https://interactive.marketingfohow.ru/api';
const USE_MOCK_API = false;

export const api = {
  /**
   * Авторизация пользователя
   */
  login: async (loginId: string, password: string): Promise<User> => {
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginId,  // API принимает поле "email" (но туда можно отправить и personal_id)
          password: password
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка авторизации');
      }

      const data = await response.json();

      if (!data.success || !data.user) {
        throw new Error('Неверный ответ сервера');
      }

      // Маппинг данных с API на локальную структуру User
      const user: User = {
        id: data.user.id.toString(),
        fohowId: data.user.personal_id || data.user.email,
        role: data.user.fohow_role || 'client',
        isVerified: data.user.is_verified || false,
        name: data.user.full_name || data.user.username,
        email: data.user.email,
        rank: data.user.rank || Rank.NOVICE,
        city: data.user.city || '',
        country: data.user.country || '',
        phone: data.user.phone || '',
        avatar: data.user.avatar_url
          ? `https://interactive.marketingfohow.ru${data.user.avatar_url}`
          : `https://ui-avatars.com/api/?name=${encodeURIComponent(data.user.full_name || 'User')}&background=D4AF37&color=fff`,
        bio: '',
        token: data.token,
        isPublic: true,
        isOffice: data.user.office ? true : false,
        privacySettings: {
          showPhone: true,
          showEmail: true,
          allowCrossLineMessages: true
        },
        blockedUserIds: data.user.blocked_users || []
      };

      localStorage.setItem('fohow_token', user.token);
      localStorage.setItem('fohow_user', JSON.stringify(user));

      return user;
    } catch (error: any) {
      throw new Error(error.message || 'Произошла ошибка входа');
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
