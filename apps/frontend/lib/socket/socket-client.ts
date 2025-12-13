import { io, Socket } from 'socket.io-client'

const SOCKET_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001'

class SocketClient {
  private socket: Socket | null = null
  private accessToken: string | null = null

  connect(token: string): Socket {
    if (this.socket?.connected) {
      return this.socket
    }

    this.accessToken = token

    this.socket = io(SOCKET_URL, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      timeout: 10000,
    })

    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket?.id)
    })

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason)
    })

    this.socket.on('connect_error', (error) => {
      console.error('🔴 Socket connection error:', error.message)
    })

    this.socket.on('error', (error: { code: string; message: string }) => {
      console.error('🔴 Socket error:', error)
    })

    return this.socket
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  getSocket(): Socket | null {
    return this.socket
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false
  }
}

export const socketClient = new SocketClient()
