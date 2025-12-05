import { Partner, User, AuthResponse, Rank } from '../types';
import { MOCK_PARTNERS } from '../constants';

const API_BASE_URL = 'https://interactive.marketingfohow.ru/api';
const USE_MOCK_API = false;

// Конвертер формата search_settings из БД в формат фронтенда
// Исправленная функция: если в БД уже лежат новые ключи, берем их.
function convertSearchSettings(dbSettings: any) {
  if (!dbSettings) {
    return {
      searchByName: true,
      searchByCity: true,
      searchByCountry: true,
      searchByPersonalId: true,
      searchByOffice: true
    };
  }

  // Приоритет: если есть searchByName, берем его. Если нет — пытаемся взять старое поле username.
  return {
    searchByName: dbSettings.searchByName ?? dbSettings.username ?? dbSettings.full_name ?? true,
    searchByCity: dbSettings.searchByCity ?? dbSettings.city ?? true,
    searchByCountry: dbSettings.searchByCountry ?? dbSettings.country ?? true,
    searchByPersonalId: dbSettings.searchByPersonalId ?? dbSettings.personal_id ?? true,
    searchByOffice: dbSettings.searchByOffice ?? dbSettings.office ?? true
  };
}

// Конвертер формата search_settings из фронтенда в формат БД
function convertSearchSettingsToDb(settings: any) {
  if (!settings) {
    return {
      username: true,
      full_name: true,
      city: true,
      country: true,
      personal_id: true,
      office: true
    };
  }

  return {
    username: settings.searchByName ?? true,
    full_name: settings.searchByName ?? true,
    city: settings.searchByCity ?? true,
    country: settings.searchByCountry ?? true,
    personal_id: settings.searchByPersonalId ?? true,
    office: settings.searchByOffice ?? true
  };
}

export const api = {
  /**
   * Авторизация пользователя
   */
 login: async (loginId: string, password: string): Promise<User> => {
    try {
      // Определяем тип входа: email или personal_id
      const isEmail = loginId.includes('@');
      
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(isEmail ? { email: loginId } : { personal_id: loginId }),
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

        // Social contacts
        office: data.user.office || '',
        telegram_user: data.user.telegram_user || '',
        telegram_channel: data.user.telegram_channel || '',
        vk_profile: data.user.vk_profile || '',
        ok_profile: data.user.ok_profile || '',
        instagram_profile: data.user.instagram_profile || '',
        whatsapp_contact: data.user.whatsapp_contact || '',

        token: data.token,
        isPublic: true,
        isOffice: data.user.office ? true : false,
        visibilitySettings: data.user.visibility_settings || {
          showPhone: true,
          showEmail: true,
          showTelegram: true,
          showVK: true,
          showInstagram: true,
          showWhatsApp: true,
          allowCrossLineMessages: true
        },
        searchSettings: convertSearchSettings(data.user.search_settings),
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
   * Получение текущего пользователя из localStorage
   */
  getCurrentUser: (): User | null => {
    try {
      const userJson = localStorage.getItem('fohow_user');
      if (!userJson) return null;
      
      const user = JSON.parse(userJson);
      const token = localStorage.getItem('fohow_token');
      
      if (!token) return null;
      
      return { ...user, token };
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },

  /**
   * Выход из системы
   */
  logout: (): void => {
    localStorage.removeItem('fohow_token');
    localStorage.removeItem('fohow_user');
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

const result = await response.json();

// Обрабатываем структуру ответа API
const partnersData = result.success ? result.data : (result.partners || []);

// Проверяем что есть массив
if (!Array.isArray(partnersData)) {
  console.error('API вернул не массив:', result);
  return [];
}

      return partnersData.map((p: any) => ({
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
        bio: p.bio || '',

        // Social contacts
        office: p.office || '',
        telegram_user: p.telegram_user || '',
        telegram_channel: p.telegram_channel || '',
        vk_profile: p.vk_profile || '',
        ok_profile: p.ok_profile || '',
        instagram_profile: p.instagram_profile || '',
        whatsapp_contact: p.whatsapp_contact || '',

        role: p.fohow_role || 'client',
        isVerified: p.is_verified || false,
        isPublic: true,
        isOffice: p.office ? true : false,

        visibilitySettings: p.visibility_settings,
        searchSettings: convertSearchSettings(p.search_settings),
        blockedUserIds: p.blocked_users || []
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

  /**
   * Обновление настроек видимости и поиска пользователя
   */
  updateUserSettings: async (settings: {
    visibilitySettings?: any;
    searchSettings?: any;
  }) => {
    const token = localStorage.getItem('fohow_token');
    const response = await fetch(`${API_BASE_URL}/users/me/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(settings),
    });

    if (!response.ok) throw new Error('Не удалось обновить настройки');
    return response.json();
  },

/**
   * Обновление настроек видимости
   */
  updateVisibilitySettings: async (settings: any) => {
    const token = localStorage.getItem('fohow_token');
    // Исправлено: отправляем на /users/visibility (без /me/settings)
    const response = await fetch(`${API_BASE_URL}/users/visibility`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(settings), // Отправляем чистый объект { showPhone: true }
    });

    if (!response.ok) {
       const err = await response.json();
       throw new Error(err.error || 'Не удалось обновить настройки видимости');
    }
    return response.json();
  },

  /**
   * Обновление настроек поиска
   */
  updateSearchSettings: async (settings: any) => {
    const token = localStorage.getItem('fohow_token');
    // Исправлено: отправляем на /users/search и НЕ конвертируем ключи обратно в старые
    const response = await fetch(`${API_BASE_URL}/users/search`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(settings),
    });

    if (!response.ok) throw new Error('Не удалось обновить настройки поиска');
    return response.json();
  },
  
  /**
   * Обновление данных профиля (Имя, Город, Био и т.д.)
   */
  updateProfile: async (data: Partial<User>) => {
    const token = localStorage.getItem('fohow_token');
    
    // Маппинг полей фронтенда на поля бэкенда (если они отличаются)
    // В User у нас camelCase, а бэкенд ждет snake_case для некоторых полей
    const payload = {
      full_name: data.name,
      city: data.city,
      country: data.country,
      phone: data.phone,
      office: data.office,
      bio: data.bio,
      telegram_user: data.telegram_user,
      telegram_channel: data.telegram_channel,
      whatsapp_contact: data.whatsapp_contact,
      vk_profile: data.vk_profile,
      instagram_profile: data.instagram_profile,
      ok_profile: data.ok_profile
    };

    const response = await fetch(`${API_BASE_URL}/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
       const err = await response.json();
       throw new Error(err.error || 'Не удалось обновить профиль');
    }
    
    return response.json();
  },

/**
   * Получение уведомлений
   */
  getNotifications: async () => {
    const token = localStorage.getItem('fohow_token');
    const response = await fetch(`${API_BASE_URL}/fogrup/notifications`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) return { notifications: [] };
    return response.json();
  },

  /**
   * Отметить уведомление прочитанным (или удалить)
   */
  markNotificationRead: async (id: string) => {
    const token = localStorage.getItem('fohow_token');
    await fetch(`${API_BASE_URL}/fogrup/notifications/${id}/read`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` },
    });
  },

  /**
   * Удаление связи
   */
  deleteRelationship: async (targetId: string) => {
    const token = localStorage.getItem('fohow_token');
    const response = await fetch(`${API_BASE_URL}/relationships/${targetId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Не удалось удалить связь');
    return response.json();
  },

  /**
   * Получение свежего профиля (для синхронизации)
   */
  fetchUserProfile: async (): Promise<User> => {
    const token = localStorage.getItem('fohow_token');
    const response = await fetch(`${API_BASE_URL}/profile`, { // Эндпоинт есть в server.js
      headers: { 'Authorization': `Bearer ${token}` },
    });
    
    if (!response.ok) throw new Error('Failed to fetch profile');
    const data = await response.json();
    
    // Маппим данные с сервера в формат фронтенда (User)
    const u = data.user;
    return {
        id: u.id.toString(),
        fohowId: u.personal_id || u.email,
        role: 'partner', // или логика определения
        isVerified: u.is_verified,
        name: u.full_name || u.username,
        email: u.email,
        rank: u.rank || Rank.NOVICE,
        city: u.city || '',
        country: u.country || '',
        phone: u.phone || '',
        avatar: u.avatar_url 
            ? `https://interactive.marketingfohow.ru${u.avatar_url}` 
            : `https://ui-avatars.com/api/?name=${u.full_name}&background=D4AF37&color=fff`,
        bio: u.bio || '',
        office: u.office || '',
        telegram_user: u.telegram_user,
        vk_profile: u.vk_profile,
        instagram_profile: u.instagram_profile,
        whatsapp_contact: u.whatsapp_contact,
        visibilitySettings: u.visibility_settings || {},
        searchSettings: convertSearchSettings(u.search_settings),
        blockedUserIds: u.blocked_users || [],
        token: token! 
    };
  },
};
