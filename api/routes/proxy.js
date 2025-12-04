import axios from 'axios';

const MAIN_API_URL = process.env.MAIN_API_URL || 'http://127.0.0.1:4000';

export function registerProxyRoutes(app, authenticateToken) {
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
}
