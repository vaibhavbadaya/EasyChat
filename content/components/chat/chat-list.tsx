"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Search, Plus, Users, UserIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import type { Chat, User } from "@/types"
import { cn } from "@/lib/utils"

interface ChatListProps {
  chats: Chat[]
  selectedChat: Chat | null
  onChatSelect: (chat: Chat) => void
  currentUser: User | null
}

export default function ChatList({ chats, selectedChat, onChatSelect, currentUser }: ChatListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const router = useRouter()

  const filteredChats = chats.filter((chat) => {
    if (!searchTerm) return true

    // For group chats, search by name
    if (chat.isGroupChat && chat.name) {
      return chat.name.toLowerCase().includes(searchTerm.toLowerCase())
    }

    // For 1-on-1 chats, search by other user's name
    const otherUsers = chat.users.filter((u) => u.id !== currentUser?.id)
    return otherUsers.some(
      (user) =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.firstName && user.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.lastName && user.lastName.toLowerCase().includes(searchTerm.toLowerCase())),
    )
  })

  // Helper to get chat name or other user's name for 1-on-1 chats
  const getChatName = (chat: Chat) => {
    if (chat.isGroupChat) return chat.name

    const otherUser = chat.users.find((u) => u.id !== currentUser?.id)
    return otherUser
      ? `${otherUser.firstName || ""} ${otherUser.lastName || ""} (${otherUser.username})`.trim()
      : "Chat"
  }

  // Helper to get avatar for chat
  const getChatAvatar = (chat: Chat) => {
    if (chat.isGroupChat) {
      return (
        <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-gray-200">
          <Users className="h-6 w-6 text-gray-500" />
        </div>
      )
    }

    const otherUser = chat.users.find((u) => u.id !== currentUser?.id)
    if (!otherUser) {
      return (
        <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-gray-200">
          <UserIcon className="h-6 w-6 text-gray-500" />
        </div>
      )
    }

    return (
      <div className="relative flex-shrink-0">
        <img
          src={otherUser.avatar || `https://ui-avatars.com/api/?name=${otherUser.username}&background=random`}
          alt={otherUser.username}
          className="h-12 w-12 rounded-full"
        />
        <span
          className={cn(
            "absolute bottom-0 right-0 block h-3 w-3 rounded-full ring-2 ring-white",
            otherUser.status === "online"
              ? "bg-green-400"
              : otherUser.status === "away"
                ? "bg-yellow-400"
                : "bg-gray-400",
          )}
        ></span>
      </div>
    )
  }

  // Check if a chat has unread messages
  const hasUnreadMessages = (chat: Chat) => {
    if (!chat.lastMessage || !currentUser) return false
    return !chat.lastMessage.readBy.some((r) => r.id === currentUser.id)
  }

  const handleNewChat = () => {
    router.push("/new-chat")
  }

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Chats</h2>
        <div className="mt-2 flex">
          <div className="relative flex-grow">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search chats..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button size="icon" className="ml-2" onClick={handleNewChat}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredChats.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            {searchTerm ? "No chats found" : "No chats yet. Start a new conversation!"}
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredChats.map((chat) => {
              const chatName = getChatName(chat)
              const lastMessage = chat.lastMessage?.content || "No messages yet"
              const lastMessageTime = chat.lastMessage?.createdAt
                ? format(new Date(chat.lastMessage.createdAt), "h:mm a")
                : ""
              const unread = hasUnreadMessages(chat)

              return (
                <li
                  key={chat.id}
                  className={cn(
                    "p-4 hover:bg-gray-50 cursor-pointer",
                    selectedChat?.id === chat.id ? "bg-primary-50" : "",
                    unread ? "bg-blue-50" : "",
                  )}
                  onClick={() => onChatSelect(chat)}
                >
                  <div className="flex items-center space-x-4">
                    {getChatAvatar(chat)}
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          "text-sm font-medium truncate",
                          unread ? "text-blue-600 font-semibold" : "text-gray-900",
                        )}
                      >
                        {chatName}
                      </p>
                      <p className={cn("text-sm truncate", unread ? "text-blue-600" : "text-gray-500")}>
                        {lastMessage}
                      </p>
                    </div>
                    <div className="flex flex-col items-end">
                      {lastMessageTime && (
                        <div className={cn("text-xs", unread ? "text-blue-600 font-semibold" : "text-gray-500")}>
                          {lastMessageTime}
                        </div>
                      )}
                      {unread && (
                        <div className="mt-1 bg-blue-500 text-white text-xs font-medium rounded-full w-5 h-5 flex items-center justify-center">
                          !
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
