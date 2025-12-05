import axios from 'axios';

const MAIN_API_URL = process.env.MAIN_API_URL || 'http://127.0.0.1:4000';

export function registerProxyRoutes(app, pool, authenticateToken) {
  // Прокси GET /api/partners
  app.get('/api/partners', {
    preHandler: [authenticateToken]
  }, async (req, reply) => {
    try {
      const response = await axios.get(`${MAIN_API_URL}/api/partners`, {
        headers: { 'Authorization': req.headers.authorization },
        params: req.query
      });
      return reply.send(response.data);
    } catch (err) {
      console.error('[PROXY] /api/partners error:', err.message);
      return reply.code(err.response?.status || 500).send(err.response?.data || { error: 'Proxy error' });
    }
  });

  // Прокси GET /api/partners/:id
  app.get('/api/partners/:id', {
    preHandler: [authenticateToken]
  }, async (req, reply) => {
    try {
      const response = await axios.get(`${MAIN_API_URL}/api/partners/${req.params.id}`, {
        headers: { 'Authorization': req.headers.authorization }
      });
      return reply.send(response.data);
    } catch (err) {
      console.error('[PROXY] /api/partners/:id error:', err.message);
      return reply.code(err.response?.status || 500).send(err.response?.data || { error: 'Proxy error' });
    }
  });

  // Прокси POST /api/relationships
  app.post('/api/relationships', {
    preHandler: [authenticateToken]
  }, async (req, reply) => {
    try {
      const response = await axios.post(`${MAIN_API_URL}/api/relationships`, req.body, {
        headers: {
          'Authorization': req.headers.authorization,
          'Content-Type': 'application/json'
        }
      });

      // Создать уведомление для целевого пользователя
      const { targetId, type } = req.body;
      const relationshipId = response.data?.relationship?.id || response.data?.id;

      if (targetId) {
        try {
          // Получить имя отправителя
          const sender = await pool.query('SELECT full_name FROM users WHERE id = $1', [req.user.id]);
          const senderName = sender.rows[0]?.full_name || 'Пользователь';

          // Текст уведомления зависит от типа связи
          const relationshipTypeText = type === 'mentor' ? 'Наставника' : 'Партнера';
          const notificationText = `${senderName} хочет добавить вас как ${relationshipTypeText}`;

          await pool.query(
            'INSERT INTO fogrup_notifications (user_id, type, from_user_id, relationship_id, text) VALUES ($1, $2, $3, $4, $5)',
            [targetId, 'relationship_request', req.user.id, relationshipId, notificationText]
          );
        } catch (notifErr) {
          console.error('[PROXY] Failed to create notification:', notifErr.message);
          // Не блокируем основной запрос при ошибке создания уведомления
        }
      }

      return reply.send(response.data);
    } catch (err) {
      console.error('[PROXY] POST /api/relationships error:', err.message);
      return reply.code(err.response?.status || 500).send(err.response?.data || { error: 'Proxy error' });
    }
  });

  // Прокси PUT /api/relationships/:id
  app.put('/api/relationships/:id', {
    preHandler: [authenticateToken]
  }, async (req, reply) => {
    try {
      const response = await axios.put(`${MAIN_API_URL}/api/relationships/${req.params.id}`, req.body, {
        headers: {
          'Authorization': req.headers.authorization,
          'Content-Type': 'application/json'
        }
      });
      return reply.send(response.data);
    } catch (err) {
      console.error('[PROXY] PUT /api/relationships/:id error:', err.message);
      return reply.code(err.response?.status || 500).send(err.response?.data || { error: 'Proxy error' });
    }
  });

  // Прокси GET /api/relationships/my
  app.get('/api/relationships/my', {
    preHandler: [authenticateToken]
  }, async (req, reply) => {
    try {
      const response = await axios.get(`${MAIN_API_URL}/api/relationships/my`, {
        headers: { 'Authorization': req.headers.authorization },
        params: req.query
      });
      return reply.send(response.data);
    } catch (err) {
      console.error('[PROXY] GET /api/relationships/my error:', err.message);
      return reply.code(err.response?.status || 500).send(err.response?.data || { error: 'Proxy error' });
    }
  });

  // Прокси POST /api/users/block
  app.post('/api/users/block', {
    preHandler: [authenticateToken]
  }, async (req, reply) => {
    try {
      const response = await axios.post(`${MAIN_API_URL}/api/users/block`, req.body, {
        headers: {
          'Authorization': req.headers.authorization,
          'Content-Type': 'application/json'
        }
      });
      return reply.send(response.data);
    } catch (err) {
      console.error('[PROXY] POST /api/users/block error:', err.message);
      return reply.code(err.response?.status || 500).send(err.response?.data || { error: 'Proxy error' });
    }
  });

  // Прокси DELETE /api/users/block/:id
  app.delete('/api/users/block/:id', {
    preHandler: [authenticateToken]
  }, async (req, reply) => {
    try {
      const response = await axios.delete(`${MAIN_API_URL}/api/users/block/${req.params.id}`, {
        headers: { 'Authorization': req.headers.authorization }
      });
      return reply.send(response.data);
    } catch (err) {
      console.error('[PROXY] DELETE /api/users/block/:id error:', err.message);
      return reply.code(err.response?.status || 500).send(err.response?.data || { error: 'Proxy error' });
    }
  });

  // Прокси PUT /api/users/me/settings (обновление настроек видимости и поиска)
  app.put('/api/users/me/settings', {
    preHandler: [authenticateToken]
  }, async (req, reply) => {
    try {
      const response = await axios.put(`${MAIN_API_URL}/api/users/me/settings`, req.body, {
        headers: {
          'Authorization': req.headers.authorization,
          'Content-Type': 'application/json'
        }
      });
      return reply.send(response.data);
    } catch (err) {
      console.error('[PROXY] PUT /api/users/me/settings error:', err.message);
      return reply.code(err.response?.status || 500).send(err.response?.data || { error: 'Proxy error' });
    }
  });

  // Прокси PUT /api/users/visibility (обновление настроек видимости)
  app.put('/api/users/visibility', {
    preHandler: [authenticateToken]
  }, async (req, reply) => {
    try {
      const response = await axios.put(`${MAIN_API_URL}/api/users/visibility`, req.body, {
        headers: {
          'Authorization': req.headers.authorization,
          'Content-Type': 'application/json'
        }
      });
      return reply.send(response.data);
    } catch (err) {
      console.error('[PROXY] PUT /api/users/visibility error:', err.message);
      return reply.code(err.response?.status || 500).send(err.response?.data || { error: 'Proxy error' });
    }
  });

  // Прокси PUT /api/users/search (обновление настроек поиска)
  app.put('/api/users/search', {
    preHandler: [authenticateToken]
  }, async (req, reply) => {
    try {
      const response = await axios.put(`${MAIN_API_URL}/api/users/search`, req.body, {
        headers: {
          'Authorization': req.headers.authorization,
          'Content-Type': 'application/json'
        }
      });
      return reply.send(response.data);
    } catch (err) {
      console.error('[PROXY] PUT /api/users/search error:', err.message);
      return reply.code(err.response?.status || 500).send(err.response?.data || { error: 'Proxy error' });
    }
  });
}
