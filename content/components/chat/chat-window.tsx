"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { format } from "date-fns"
import { Send, Info, Paperclip, Smile } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Chat, User } from "@/types"
import { cn } from "@/lib/utils"
import ChatInfo from "./chat-info"

interface ChatWindowProps {
  chat: Chat | null
  currentUser: User | null
  onSendMessage: (content: string) => void
}

export default function ChatWindow({ chat, currentUser, onSendMessage }: ChatWindowProps) {
  const [newMessage, setNewMessage] = useState("")
  const [showChatInfo, setShowChatInfo] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chat?.messages])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()

    if (!newMessage.trim() || !chat) return

    onSendMessage(newMessage)
    setNewMessage("")
  }

  const handleFileUpload = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    // In a real app, you would upload the file to a server
    // and then send a message with the file URL
    console.log("File selected:", files[0].name)

    // Reset the input
    e.target.value = ""
  }

  // Helper to get sender name
  const getSenderName = (senderId: string) => {
    if (!chat) return ""

    const sender = chat.users.find((u) => u.id === senderId)
    return sender ? sender.username : ""
  }

  // Helper to check if message is from current user
  const isOwnMessage = (senderId: string) => {
    return senderId === currentUser?.id
  }

  if (!chat) {
    return (
      <div className="h-full flex items-center justify-center bg-white">
        <div className="text-center p-6">
          <h3 className="text-lg font-medium text-gray-900">Select a chat to start messaging</h3>
          <p className="mt-2 text-sm text-gray-500">Choose an existing conversation or start a new one</p>
        </div>
      </div>
    )
  }

  // Get chat name
  const getChatName = () => {
    if (chat.isGroupChat) return chat.name

    const otherUser = chat.users.find((u) => u.id !== currentUser?.id)
    return otherUser
      ? `${otherUser.firstName || ""} ${otherUser.lastName || ""} (${otherUser.username})`.trim()
      : "Chat"
  }

  return (
    <div className="h-full flex flex-col bg-white relative">
      {/* Chat header */}
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-lg font-semibold">{getChatName()}</h2>
        <Button variant="ghost" size="icon" onClick={() => setShowChatInfo(!showChatInfo)}>
          <Info className="h-5 w-5" />
        </Button>
      </div>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {!chat.messages || chat.messages.length === 0 ? (
          <div className="text-center text-gray-500 my-8">No messages yet. Start the conversation!</div>
        ) : (
          <div className="space-y-4">
            {chat.messages.map((message) => {
              const own = isOwnMessage(message.sender.id)

              return (
                <div key={message.id} className={cn("flex", own ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-xs md:max-w-md lg:max-w-lg rounded-lg px-4 py-2",
                      own ? "bg-primary-100 text-primary-900" : "bg-white border border-gray-200",
                    )}
                  >
                    {!own && (
                      <div className="font-medium text-xs text-gray-500 mb-1">{getSenderName(message.sender.id)}</div>
                    )}
                    <div>{message.content}</div>
                    <div className="text-right text-xs text-gray-500 mt-1">
                      {format(new Date(message.createdAt), "h:mm a")}
                      {own && message.readBy.length > 1 && <span className="ml-1 text-primary-600">✓</span>}
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message input */}
      <div className="p-4 border-t">
        <form onSubmit={handleSendMessage} className="flex items-center">
          <Button type="button" variant="ghost" size="icon" className="mr-2" onClick={handleFileUpload}>
            <Paperclip className="h-5 w-5 text-gray-500" />
          </Button>
          <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
          <Button type="button" variant="ghost" size="icon" className="mr-2">
            <Smile className="h-5 w-5 text-gray-500" />
          </Button>
          <Input
            type="text"
            placeholder="Type a message..."
            className="flex-grow"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <Button type="submit" size="icon" className="ml-2" disabled={!newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>

      {/* Chat info sidebar */}
      {showChatInfo && <ChatInfo chat={chat} currentUser={currentUser} onClose={() => setShowChatInfo(false)} />}
    </div>
  )
}
