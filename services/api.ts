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
          email: loginId,
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
  getPartners: async (filters?: {
    country?: string;
    city?: string;
    rank?: Rank;
    search?: string;
  }): Promise<Partner[]> => {
    try {
      const token = localStorage.getItem('fohow_token');
      if (!token) {
        throw new Error('Требуется авторизация');
      }

      const params = new URLSearchParams();
      if (filters?.country) params.append('country', filters.country);
      if (filters?.city) params.append('city', filters.city);
      if (filters?.rank) params.append('rank', filters.rank);
      if (filters?.search) params.append('search', filters.search);

      const response = await fetch(`${API_BASE_URL}/partners?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!Array.isArray(data.partners)) {
        console.error('API вернул не массив:', data);
        return [];
      }

      return data.partners.map((p: any) => ({
        id: p.id.toString(),
        fohowId: p.personal_id || p.email,
        name: p.full_name || p.username,
        rank: p.rank || Rank.NOVICE,
        country: p.country || '',
        city: p.city || '',
        phone: p.phone || '',
        email: p.email,
        avatar: p.avatar_url 
          ? `https://interactive.marketingfohow.ru${p.avatar_url}` 
          : `https://ui-avatars.com/api/?name=${encodeURIComponent(p.full_name || 'User')}&background=D4AF37&color=fff`,
        role: p.fohow_role || 'client',
        isVerified: p.is_verified || false,
        isPublic: true,
        isOffice: p.office ? true : false,
      }));

    } catch (error: any) {
      console.error('API Error:', error);
      throw new Error(error.message || 'Не удалось загрузить список');
    }
  },

  /**
   * Получение профиля партнера по ID
   */
  getPartnerById: async (id: string): Promise<Partner> => {
    if (USE_MOCK_API) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          const partner = MOCK_PARTNERS.find(p => p.id === id);
          if (partner) {
            resolve(partner);
          } else {
            reject(new Error('Партнер не найден'));
          }
        }, 500);
      });
    }
    
    const token = localStorage.getItem('fohow_token');
    const response = await fetch(`${API_BASE_URL}/partners/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) throw new Error('Не удалось загрузить профиль');
    const data = await response.json();
    return data.partner;
  },

  /**
   * Поиск партнеров
   */
  searchPartners: async (query: string): Promise<Partner[]> => {
    if (USE_MOCK_API) {
      return new Promise((resolve) => {
        setTimeout(() => {
          const results = MOCK_PARTNERS.filter(p =>
            p.name.toLowerCase().includes(query.toLowerCase()) ||
            p.fohowId.toLowerCase().includes(query.toLowerCase())
          );
          resolve(results);
        }, 300);
      });
    }
    
    const token = localStorage.getItem('fohow_token');
    const response = await fetch(`${API_BASE_URL}/partners/search?q=${encodeURIComponent(query)}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) throw new Error('Ошибка поиска');
    const data = await response.json();
    return data.partners;
  },

  /**
   * Создание запроса на связь
   */
  createRelationship: async (targetId: string, type: 'mentor' | 'downline') => {
    const token = localStorage.getItem('fohow_token');
    const response = await fetch(`${API_BASE_URL}/relationships`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ targetId, type }),
    });
    
    if (!response.ok) throw new Error('Не удалось создать запрос');
    return response.json();
  },

  /**
   * Ответ на запрос связи
   */
  respondToRelationship: async (relationshipId: string, status: 'confirmed' | 'rejected') => {
    const token = localStorage.getItem('fohow_token');
    const response = await fetch(`${API_BASE_URL}/relationships/${relationshipId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });
    
    if (!response.ok) throw new Error('Не удалось обновить статус');
    return response.json();
  },

  /**
   * Получение моих связей
   */
  getMyRelationships: async () => {
    const token = localStorage.getItem('fohow_token');
    const response = await fetch(`${API_BASE_URL}/relationships/my`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) throw new Error('Не удалось загрузить связи');
    return response.json();
  },

  /**
   * Блокировка пользователя
   */
  blockUser: async (userId: string) => {
    const token = localStorage.getItem('fohow_token');
    const response = await fetch(`${API_BASE_URL}/users/block`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ userId }),
    });
    
    if (!response.ok) throw new Error('Не удалось заблокировать');
    return response.json();
  },

  /**
   * Разблокировка пользователя
   */
  unblockUser: async (userId: string) => {
    const token = localStorage.getItem('fohow_token');
    const response = await fetch(`${API_BASE_URL}/users/block/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) throw new Error('Не удалось разблокировать');
    return response.json();
  },
};
