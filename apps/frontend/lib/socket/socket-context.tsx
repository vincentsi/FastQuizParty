'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
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

  const connect = (token: string) => {
    const newSocket = socketClient.connect(token)
    setSocket(newSocket)

    newSocket.on('connect', () => {
      setIsConnected(true)
    })

    newSocket.on('disconnect', () => {
      setIsConnected(false)
    })
  }

  const disconnect = () => {
    socketClient.disconnect()
    setSocket(null)
    setIsConnected(false)
  }

  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [])

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
