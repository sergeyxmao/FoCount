import { io, Socket } from 'socket.io-client';

const SOCKET_URL = 'https://interactive.marketingfohow.ru:4001';

class SocketService {
  private socket: Socket | null = null;
  private token: string | null = null;

  connect(token: string) {
    if (this.socket?.connected) {
      return;
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

    this.socket.on('connect_error', (err) => {
      console.error('[WebSocket] Connection error:', err.message);
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
