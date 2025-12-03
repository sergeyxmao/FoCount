export function registerNotificationRoutes(app, pool, authenticateToken) {
  // GET /api/notifications
  app.get('/api/notifications', {
    preHandler: [authenticateToken]
  }, async (req, reply) => {
    const { limit = 20, offset = 0 } = req.query;

    try {
      const result = await pool.query(`
        SELECT
          n.id, n.type, n.text, n.is_read, n.created_at, n.relationship_id,
          u.id as from_user_id, u.full_name as from_user_name, u.avatar_url as from_user_avatar
        FROM fogrup_notifications n
        LEFT JOIN users u ON u.id = n.from_user_id
        WHERE n.user_id = $1
        ORDER BY n.created_at DESC
        LIMIT $2 OFFSET $3
      `, [req.user.id, limit, offset]);

      return reply.send({ success: true, notifications: result.rows });
    } catch (err) {
      console.error('[NOTIFICATIONS] Error:', err);
      return reply.code(500).send({ error: 'Ошибка сервера' });
    }
  });

  // PUT /api/notifications/:id/read
  app.put('/api/notifications/:id/read', {
    preHandler: [authenticateToken]
  }, async (req, reply) => {
    const { id } = req.params;

    try {
      await pool.query(
        'UPDATE fogrup_notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2',
        [id, req.user.id]
      );

      return reply.send({ success: true });
    } catch (err) {
      console.error('[NOTIFICATIONS] Mark read error:', err);
      return reply.code(500).send({ error: 'Ошибка сервера' });
    }
  });

  // GET /api/notifications/unread-count
  app.get('/api/notifications/unread-count', {
    preHandler: [authenticateToken]
  }, async (req, reply) => {
    try {
      const result = await pool.query(
        'SELECT COUNT(*) as count FROM fogrup_notifications WHERE user_id = $1 AND is_read = FALSE',
        [req.user.id]
      );

      return reply.send({ success: true, count: parseInt(result.rows[0].count) });
    } catch (err) {
      console.error('[NOTIFICATIONS] Count error:', err);
      return reply.code(500).send({ error: 'Ошибка сервера' });
    }
  });
}
