'use client'

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { Socket } from 'socket.io-client'
import { socketClient } from './socket-client'

interface SocketContextType {
  socket: Socket | null
  isConnected: boolean
  connect: (token: string) => void
  disconnect: () => void
}

const SocketContext = createContext<SocketContextType | undefined>(undefined)

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  const connect = useCallback((token: string) => {
    // Don't reconnect if already connected
    if (socketClient.isConnected()) {
      const existingSocket = socketClient.getSocket()
      if (existingSocket) {
        setSocket(existingSocket)
        setIsConnected(true)
        return
      }
    }

    const newSocket = socketClient.connect(token)
    setSocket(newSocket)

    newSocket.on('connect', () => {
      setIsConnected(true)
    })

    newSocket.on('disconnect', () => {
      setIsConnected(false)
    })

    newSocket.on('connect_error', () => {
      setIsConnected(false)
    })
  }, [])

  const disconnect = useCallback(() => {
    socketClient.disconnect()
    setSocket(null)
    setIsConnected(false)
  }, [])

  // Sync existing socket connection state
  useEffect(() => {
    const existingSocket = socketClient.getSocket()
    if (existingSocket && !socket) {
      setSocket(existingSocket)
      setIsConnected(existingSocket.connected)

      existingSocket.on('connect', () => {
        setIsConnected(true)
      })

      existingSocket.on('disconnect', () => {
        setIsConnected(false)
      })

      existingSocket.on('connect_error', () => {
        setIsConnected(false)
      })
    }
  }, [socket])

  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  return (
    <SocketContext.Provider value={{ socket, isConnected, connect, disconnect }}>
      {children}
    </SocketContext.Provider>
  )
}

export function useSocket() {
  const context = useContext(SocketContext)
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}
