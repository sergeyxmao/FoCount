# FOgrup (FoCount) — Справочник партнёров FOHOW

## Структура проекта

- `/api` — Backend API (Node.js + Fastify, порт 4001)
- `/frontend` — Фронтенд (Next.js) — *в разработке*

## Установка и запуск Backend 

```bash
cd api
cp .env.example .env
# Настроить переменные в .env
npm install
npm start
```

## API Endpoints

### Прокси к FOHOW-proekt-v3:
- `GET /api/partners` — список партнёров
- `GET /api/partners/:id` — профиль партнёра
- `POST /api/relationships` — создать запрос на связь
- `PUT /api/relationships/:id` — ответить на запрос
- `GET /api/relationships/my` — мои связи
- `POST /api/users/block` — заблокировать пользователя
- `DELETE /api/users/block/:id` — разблокировать

### Собственные эндпоинты:
- `GET /api/chats` — список чатов
- `POST /api/chats` — создать чат
- `GET /api/chats/:id/messages` — сообщения
- `POST /api/chats/:id/messages` — отправить сообщение
- `GET /api/notifications` — уведомления
- `PUT /api/notifications/:id/read` — отметить прочитанным
- `GET /api/notifications/unread-count` — количество непрочитанных

## Архитектура

FOgrup работает в связке с FOHOW-proekt-v3:
- FOHOW-proekt-v3 (порт 4000) — основной API
- FOgrup API (порт 4001) — дополнительный функционал

## Деплой

Сервер: `217.114.5.69`
- Backend: systemd сервис `fogrup-api.service`
- Nginx: `/fogrup-api/` → `http://localhost:4001`
