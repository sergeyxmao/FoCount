const SOCKET_URL = 'http://localhost:4001';
const SOCKET_URL = window.location.origin.replace(/:\d+/, ':4001');

type EventCallback = (...args: any[]) => void;

type SocketClient = {
  connected: boolean;
  on: (event: string, callback: EventCallback) => void;
  off: (event: string, callback?: EventCallback) => void;
  emit: (event: string, payload?: any) => void;
  disconnect: () => void;
};

type SocketIoModule = {
  io: (url: string, options?: Record<string, unknown>) => SocketClient;
};
class SocketService {
  private socket: SocketClient | null = null;
  private token: string | null = null;
  private modulePromise: Promise<SocketIoModule | null> | null = null;

  private loadSocketModule() {
    if (!this.modulePromise) {
      this.modulePromise = import(/* @vite-ignore */ SOCKET_MODULE_URL)
        .then((module) => {
          if (module && 'io' in module) {
            return module as SocketIoModule;
          }

          console.error('[WebSocket] socket.io-client module did not provide io()');
          return null;
        })
        .catch((error) => {
          console.error('[WebSocket] Failed to load socket.io-client from CDN:', error);
          return null;
        });
    }

    return this.modulePromise;
  }

  connect(token: string) {
    if (this.socket?.connected) {
      return;
    }

    this.token = token;

    this.loadSocketModule().then((module) => {
      if (!module) {
        return;
      }

      this.socket = module.io(SOCKET_URL, {
        auth: { token }
      });

      this.socket.on('connect', () => {
        console.log('[WebSocket] Connected');
      });

      this.socket.on('disconnect', () => {
        console.log('[WebSocket] Disconnected');
      });

      this.socket.on('connect_error', (err) => {
        console.error('[WebSocket] Connection error:', (err as Error).message ?? err);
      });
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
