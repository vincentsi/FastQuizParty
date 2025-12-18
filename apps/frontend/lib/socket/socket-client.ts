import { io, Socket } from 'socket.io-client'

const SOCKET_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001'

class SocketClient {
  private socket: Socket | null = null
  private accessToken: string | null = null

  private getOrCreateGuestId(): string {
    if (typeof window === 'undefined') return ''
    
    let guestId = localStorage.getItem('guestId')
    if (!guestId) {
      guestId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
      localStorage.setItem('guestId', guestId)
    }
    return guestId
  }

  connect(token: string): Socket {
    if (this.socket?.connected) {
      return this.socket
    }

    this.accessToken = token

    // Get or create guest ID for persistent identification
    // Check for empty string OR undefined/null to properly identify guests
    const isGuest = !token || token.trim() === ''
    const guestId = isGuest ? this.getOrCreateGuestId() : undefined

    this.socket = io(SOCKET_URL, {
      auth: {
        token: token || undefined, // Send undefined instead of empty string for guests
        guestId, // Send guestId for guests
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
