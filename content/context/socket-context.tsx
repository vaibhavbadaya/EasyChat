"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { io, type Socket } from "socket.io-client"
import { useAuth } from "./auth-context"

interface SocketContextType {
  socket: Socket | null
  connected: boolean
}

const SocketContext = createContext<SocketContextType | undefined>(undefined)

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    if (!user) {
      // Disconnect socket if user is not logged in
      if (socket) {
        socket.disconnect()
        setSocket(null)
        setConnected(false)
      }
      return
    }

    // Initialize socket connection
    const socketInstance = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000", {
      withCredentials: true,
    })

    socketInstance.on("connect", () => {
      console.log("Socket connected")
      setConnected(true)
    })

    socketInstance.on("disconnect", () => {
      console.log("Socket disconnected")
      setConnected(false)
    })

    socketInstance.on("error", (error) => {
      console.error("Socket error:", error)
    })

    setSocket(socketInstance)

    return () => {
      socketInstance.disconnect()
    }
  }, [user])

  return <SocketContext.Provider value={{ socket, connected }}>{children}</SocketContext.Provider>
}

export function useSocket() {
  const context = useContext(SocketContext)
  if (context === undefined) {
    throw new Error("useSocket must be used within a SocketProvider")
  }
  return context
}
