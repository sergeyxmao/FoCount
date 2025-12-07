const SOCKET_URL = 'https://interactive.marketingfohow.ru:4001';

let io: any = null;

class SocketService {
  private socket: any = null;
  private token: string | null = null;

  async connect(token: string) {
    if (this.socket?.connected) {
      return;
    }

    // Загружаем socket.io-client из CDN
    if (!io) {
      try {
        const module = await import('https://cdn.socket.io/4.5.4/socket.io.esm.min.js');
        io = module.io;
      } catch (err) {
        console.error('[WebSocket] Failed to load socket.io-client:', err);
        return;
      }
    }

    this.token = token;
    this.socket = io(SOCKET_URL, {
      auth: { token }
    });

    this.socket.on('connect', () => {
      console.log('[WebSocket] Connected');
    });

    this.socket.on('disconnect', () => {
      console.log('[WebSocket] Disconnected');
    });

    this.socket.on('connect_error', (err: any) => {
      console.error('[WebSocket] Connection error:', err.message || err);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinChat(chatId: string) {
    this.socket?.emit('join_chat', { chatId });
  }

  leaveChat(chatId: string) {
    this.socket?.emit('leave_chat', { chatId });
  }

  onNewMessage(callback: (data: any) => void) {
    this.socket?.on('new_message', callback);
  }

  onChatsUpdated(callback: () => void) {
    this.socket?.on('chats_updated', callback);
  }

  offNewMessage() {
    this.socket?.off('new_message');
  }

  offChatsUpdated() {
    this.socket?.off('chats_updated');
  }
}

export const socketService = new SocketService();
