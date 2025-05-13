"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import ChatList from "./chat-list"
import ChatWindow from "./chat-window"
import { useAuth } from "@/context/auth-context"
import { useSocket } from "@/context/socket-context"
import type { Chat, Message } from "@/types"

export default function ChatInterface() {
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null)
  const [chats, setChats] = useState<Chat[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const { socket } = useSocket()
  const router = useRouter()

  useEffect(() => {
    // Redirect if not authenticated
    if (!user) {
      router.push("/login")
      return
    }

    // Fetch chats from API
    const fetchChats = async () => {
      try {
        const response = await fetch("/api/chats")
        if (!response.ok) throw new Error("Failed to fetch chats")

        const data = await response.json()
        setChats(data)
        setLoading(false)
      } catch (error) {
        console.error("Error fetching chats:", error)
        setLoading(false)
      }
    }

    fetchChats()
  }, [user, router])

  useEffect(() => {
    if (!socket) return

    // Listen for new messages
    socket.on("message:new", (newMessage: Message) => {
      // Update chats with new message
      setChats((prevChats) =>
        prevChats.map((chat) => {
          if (chat.id === newMessage.chatId) {
            const updatedMessages = [...(chat.messages || []), newMessage]
            return {
              ...chat,
              messages: updatedMessages,
              lastMessage: newMessage,
            }
          }
          return chat
        }),
      )

      // If this message belongs to the selected chat, update it
      if (selectedChat && newMessage.chatId === selectedChat.id) {
        setSelectedChat((prev) => {
          if (!prev) return prev
          return {
            ...prev,
            messages: [...(prev.messages || []), newMessage],
            lastMessage: newMessage,
          }
        })

        // Mark message as read if it's not from current user
        if (newMessage.sender.id !== user?.id) {
          socket.emit("message:read", {
            messageId: newMessage.id,
            chatId: newMessage.chatId,
            userId: user?.id,
          })
        }
      }
    })

    // Listen for message read events
    socket.on("message:read", ({ messageId, userId, chatId }) => {
      // Update read status for the message
      setChats((prevChats) =>
        prevChats.map((chat) => {
          if (chat.id === chatId) {
            const updatedMessages = chat.messages?.map((msg) => {
              if (msg.id === messageId) {
                return {
                  ...msg,
                  readBy: [...msg.readBy, { id: userId, username: "", readAt: new Date().toISOString() }],
                }
              }
              return msg
            })
            return { ...chat, messages: updatedMessages }
          }
          return chat
        }),
      )

      // Update selected chat if needed
      if (selectedChat && selectedChat.id === chatId) {
        setSelectedChat((prev) => {
          if (!prev) return prev
          const updatedMessages = prev.messages?.map((msg) => {
            if (msg.id === messageId) {
              return {
                ...msg,
                readBy: [...msg.readBy, { id: userId, username: "", readAt: new Date().toISOString() }],
              }
            }
            return msg
          })
          return { ...prev, messages: updatedMessages }
        })
      }
    })

    // Listen for user status changes
    socket.on("user:status", ({ userId, status }) => {
      // Update user status in chats
      setChats((prevChats) =>
        prevChats.map((chat) => {
          const updatedUsers = chat.users.map((u) => {
            if (u.id === userId) {
              return { ...u, status }
            }
            return u
          })
          return { ...chat, users: updatedUsers }
        }),
      )

      // Update selected chat if needed
      if (selectedChat) {
        setSelectedChat((prev) => {
          if (!prev) return prev
          const updatedUsers = prev.users.map((u) => {
            if (u.id === userId) {
              return { ...u, status }
            }
            return u
          })
          return { ...prev, users: updatedUsers }
        })
      }
    })

    return () => {
      socket.off("message:new")
      socket.off("message:read")
      socket.off("user:status")
    }
  }, [socket, selectedChat, user])

  const handleChatSelect = async (chat: Chat) => {
    try {
      // If chat doesn't have messages, fetch them
      if (!chat.messages || chat.messages.length === 0) {
        const response = await fetch(`/api/chats/${chat.id}/messages`)
        if (!response.ok) throw new Error("Failed to fetch messages")

        const messages = await response.json()
        chat.messages = messages
      }

      setSelectedChat(chat)

      // Mark unread messages as read
      if (chat.lastMessage && user && !chat.lastMessage.readBy.some((r) => r.id === user.id)) {
        socket.emit("message:read", {
          messageId: chat.lastMessage.id,
          chatId: chat.id,
          userId: user.id,
        })
      }
    } catch (error) {
      console.error("Error selecting chat:", error)
    }
  }

  const handleSendMessage = async (content: string) => {
    if (!selectedChat || !user || !socket) return

    try {
      // Optimistically add message to UI
      const tempId = `temp-${Date.now()}`
      const newMessage: Message = {
        id: tempId,
        content,
        sender: user,
        chatId: selectedChat.id,
        readBy: [{ id: user.id, username: user.username, readAt: new Date().toISOString() }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      // Update selected chat with new message
      setSelectedChat({
        ...selectedChat,
        messages: [...(selectedChat.messages || []), newMessage],
        lastMessage: newMessage,
      })

      // Update chats list
      setChats(chats.map((chat) => (chat.id === selectedChat.id ? { ...chat, lastMessage: newMessage } : chat)))

      // Send message to server
      socket.emit("message:send", {
        content,
        chatId: selectedChat.id,
        tempId,
      })
    } catch (error) {
      console.error("Error sending message:", error)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-100">
      <div className="w-full md:w-1/3 lg:w-1/4 md:h-screen overflow-hidden border-r border-gray-200">
        <ChatList chats={chats} selectedChat={selectedChat} onChatSelect={handleChatSelect} currentUser={user} />
      </div>
      <div className="w-full md:w-2/3 lg:w-3/4 md:h-screen overflow-hidden">
        <ChatWindow chat={selectedChat} currentUser={user} onSendMessage={handleSendMessage} />
      </div>
    </div>
  )
}
