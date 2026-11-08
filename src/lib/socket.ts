import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(userId?: string, displayName?: string): Socket {
  if (typeof window === 'undefined') {
    // SSR stub
    return {} as Socket;
  }

  if (!socket || !socket.connected) {
    // Auto-detect production vs local environment so Vercel deployments connect cleanly
    const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    const socketUrl = !isLocalhost && typeof window !== 'undefined' 
      ? window.location.origin 
      : (process.env.NEXT_PUBLIC_SOCKET_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'));

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
