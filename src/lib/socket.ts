import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(userId?: string, displayName?: string): Socket {
  if (typeof window === 'undefined') {
    // SSR stub
    return {} as Socket;
  }

  if (!socket || !socket.connected) {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin;

    socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      query: {
        userId: userId || 'anonymous',
        displayName: displayName || 'Stranger'
      }
    });

    socket.on('connect', () => {
      console.log('⚡ Socket connected successfully:', socket?.id);
    });

    socket.on('connect_error', (err) => {
      console.warn('⚠️ Socket connection warning:', err.message);
    });
  }

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
