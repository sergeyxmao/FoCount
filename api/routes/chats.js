export function registerChatRoutes(app, pool, authenticateToken) {
  // GET /api/chats - Список чатов пользователя
  app.get('/api/chats', {
    preHandler: [authenticateToken]
  }, async (req, reply) => {
    try {
      const result = await pool.query(`
        SELECT
          c.id, c.updated_at,
          json_agg(json_build_object(
            'user_id', u.id,
            'full_name', u.full_name,
            'avatar_url', u.avatar_url
          )) as participants,
          (SELECT text FROM fogrup_messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message
        FROM fogrup_chats c
        JOIN fogrup_chat_participants cp ON cp.chat_id = c.id
        JOIN users u ON u.id = cp.user_id
        WHERE c.id IN (
          SELECT chat_id FROM fogrup_chat_participants WHERE user_id = $1
        )
        GROUP BY c.id
        ORDER BY c.updated_at DESC
      `, [req.user.id]);

      return reply.send({ success: true, chats: result.rows });
    } catch (err) {
      console.error('[CHATS] Error:', err);
      return reply.code(500).send({ error: 'Ошибка сервера' });
    }
  });

  // POST /api/chats - Создать/получить приватный чат
  app.post('/api/chats', {
    preHandler: [authenticateToken]
  }, async (req, reply) => {
    const { participant_id } = req.body;

    if (!participant_id) {
      return reply.code(400).send({ error: 'participant_id обязателен' });
    }

    try {
      const result = await pool.query(
        'SELECT get_or_create_private_chat($1, $2) as chat_id',
        [req.user.id, participant_id]
      );

      const chatId = result.rows[0].chat_id;

      return reply.send({ success: true, chat_id: chatId });
    } catch (err) {
      console.error('[CHATS] Create error:', err);
      return reply.code(500).send({ error: 'Ошибка сервера' });
    }
  });

  // GET /api/chats/:id/messages - Сообщения чата
  app.get('/api/chats/:id/messages', {
    preHandler: [authenticateToken]
  }, async (req, reply) => {
    const { id } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    try {
      // Проверка доступа
      const accessCheck = await pool.query(
        'SELECT 1 FROM fogrup_chat_participants WHERE chat_id = $1 AND user_id = $2',
        [id, req.user.id]
      );

      if (accessCheck.rows.length === 0) {
        return reply.code(403).send({ error: 'Нет доступа к чату' });
      }

      const result = await pool.query(`
        SELECT
          m.id, m.text, m.is_system, m.created_at,
          u.id as sender_id, u.full_name as sender_name, u.avatar_url as sender_avatar
        FROM fogrup_messages m
        LEFT JOIN users u ON u.id = m.sender_id
        WHERE m.chat_id = $1
        ORDER BY m.created_at ASC
        LIMIT $2 OFFSET $3
      `, [id, limit, offset]);

      return reply.send({ success: true, messages: result.rows });
    } catch (err) {
      console.error('[CHATS] Load messages error:', err);
      return reply.code(500).send({ error: 'Ошибка сервера' });
    }
  });

  // POST /api/chats/:id/messages - Отправить сообщение
  app.post('/api/chats/:id/messages', {
    preHandler: [authenticateToken]
  }, async (req, reply) => {
    const { id } = req.params;
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return reply.code(400).send({ error: 'Текст сообщения пустой' });
    }

    try {
      // Проверка доступа
      const accessCheck = await pool.query(
        'SELECT 1 FROM fogrup_chat_participants WHERE chat_id = $1 AND user_id = $2',
        [id, req.user.id]
      );

      if (accessCheck.rows.length === 0) {
        return reply.code(403).send({ error: 'Нет доступа к чату' });
      }

      // Получить участников (кроме отправителя)
      const participants = await pool.query(
        'SELECT user_id FROM fogrup_chat_participants WHERE chat_id = $1 AND user_id != $2',
        [id, req.user.id]
      );

      // Проверка "призрачного бана"
      for (const p of participants.rows) {
        const blockedCheck = await pool.query(
          'SELECT blocked_users FROM users WHERE id = $1',
          [p.user_id]
        );
        const blockedUsers = blockedCheck.rows[0]?.blocked_users || [];

        if (blockedUsers.includes(req.user.id)) {
          // Вернуть 200 OK, но не сохранять сообщение
          return reply.send({
            success: true,
            message: { id: -1, fake: true, text: text.trim(), created_at: new Date() }
          });
        }
      }

      // Сохранить сообщение
      const result = await pool.query(
        'INSERT INTO fogrup_messages (chat_id, sender_id, text) VALUES ($1, $2, $3) RETURNING *',
        [id, req.user.id, text.trim()]
      );

      // Создать уведомления
      const sender = await pool.query('SELECT full_name FROM users WHERE id = $1', [req.user.id]);
      const senderName = sender.rows[0]?.full_name || 'Пользователь';

      for (const p of participants.rows) {
        await pool.query(
          'INSERT INTO fogrup_notifications (user_id, type, from_user_id, text) VALUES ($1, $2, $3, $4)',
          [p.user_id, 'message', req.user.id, `Новое сообщение от ${senderName}`]
        );
      }

      // Обновить updated_at чата
      await pool.query('UPDATE fogrup_chats SET updated_at = NOW() WHERE id = $1', [id]);

      return reply.send({ success: true, message: result.rows[0] });
    } catch (err) {
      console.error('[CHATS] Send message error:', err);
      return reply.code(500).send({ error: 'Ошибка сервера' });
    }
  });
}
