export function registerFavoriteRoutes(app, pool, authenticateToken) {
  // Получить список избранных пользователей
  app.get('/api/favorites', {
    preHandler: [authenticateToken]
  }, async (req, reply) => {
    try {
      const result = await pool.query(
        'SELECT favorite_user_id FROM favorites WHERE user_id = $1',
        [req.user.id]
      );

      return reply.send({
        success: true,
        favorites: result.rows.map((row) => String(row.favorite_user_id))
      });
    } catch (err) {
      req.log.error('[FAVORITES] Load error:', err);
      return reply.code(500).send({ error: 'Failed to load favorites' });
    }
  });

  // Добавить пользователя в избранное
  app.post('/api/favorites', {
    preHandler: [authenticateToken]
  }, async (req, reply) => {
    const { favoriteUserId } = req.body || {};

    if (!favoriteUserId) {
      return reply.code(400).send({ error: 'favoriteUserId is required' });
    }

    try {
      await pool.query(
        'INSERT INTO favorites (user_id, favorite_user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [req.user.id, favoriteUserId]
      );

      return reply.send({ success: true });
    } catch (err) {
      req.log.error('[FAVORITES] Add error:', err);
      return reply.code(500).send({ error: 'Failed to add favorite' });
    }
  });

  // Удалить пользователя из избранного
  app.delete('/api/favorites/:favoriteUserId', {
    preHandler: [authenticateToken]
  }, async (req, reply) => {
    const { favoriteUserId } = req.params;

    try {
      await pool.query(
        'DELETE FROM favorites WHERE user_id = $1 AND favorite_user_id = $2',
        [req.user.id, favoriteUserId]
      );

      return reply.send({ success: true });
    } catch (err) {
      req.log.error('[FAVORITES] Remove error:', err);
      return reply.code(500).send({ error: 'Failed to remove favorite' });
    }
  });
}
