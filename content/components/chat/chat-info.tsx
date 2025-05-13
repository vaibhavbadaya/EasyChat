"use client"

import { useState } from "react"
import { X, Pencil, UserPlus, UserMinus, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Chat, User } from "@/types"
import { cn } from "@/lib/utils"
import { useSocket } from "@/context/socket-context"

interface ChatInfoProps {
  chat: Chat
  currentUser: User | null
  onClose: () => void
}

export default function ChatInfo({ chat, currentUser, onClose }: ChatInfoProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [newGroupName, setNewGroupName] = useState(chat?.name || "")
  const { socket } = useSocket()

  const isAdmin = chat.groupAdmin?.id === currentUser?.id

  const handleRenameGroup = () => {
    if (!chat.isGroupChat || !newGroupName.trim() || !socket) return

    socket.emit("group:rename", {
      chatId: chat.id,
      name: newGroupName,
    })

    setIsEditing(false)
  }

  const handleAddMember = () => {
    if (!chat.isGroupChat || !isAdmin) return
    // In a real app, this would open a modal to select users
    console.log("Add member to group:", chat.id)
  }

  const handleRemoveMember = (userId: string) => {
    if (!chat.isGroupChat || !isAdmin || !socket) return

    socket.emit("group:removeMember", {
      chatId: chat.id,
      userId,
    })
  }

  return (
    <div className="absolute inset-y-0 right-0 w-80 bg-white shadow-lg z-10 overflow-y-auto">
      <div className="p-4 border-b flex justify-between items-center">
        <h3 className="text-lg font-semibold">Chat Information</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="p-4">
        {chat.isGroupChat ? (
          <>
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Group Name</h4>
              {isEditing ? (
                <div className="flex items-center">
                  <Input
                    type="text"
                    className="flex-grow"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                  />
                  <Button size="sm" className="ml-2" onClick={handleRenameGroup}>
                    <Check className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="text-lg font-medium">{chat.name}</p>
                  {isAdmin && (
                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-500">Members ({chat.users.length})</h4>
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary-600 hover:text-primary-700"
                    onClick={handleAddMember}
                  >
                    <UserPlus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                )}
              </div>

              <ul className="space-y-3">
                {chat.users.map((member) => (
                  <li key={member.id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <img
                        src={member.avatar || `https://ui-avatars.com/api/?name=${member.username}&background=random`}
                        alt={member.username}
                        className="h-8 w-8 rounded-full mr-3"
                      />
                      <div>
                        <p className="text-sm font-medium">{member.username}</p>
                        <p className="text-xs text-gray-500">
                          {member.id === chat.groupAdmin?.id ? "Admin" : "Member"}
                        </p>
                      </div>
                    </div>
                    {isAdmin && member.id !== currentUser?.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleRemoveMember(member.id)}
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : (
          // 1-on-1 chat info
          <div>
            {chat.users
              .filter((u) => u.id !== currentUser?.id)
              .map((otherUser) => (
                <div key={otherUser.id} className="text-center">
                  <img
                    src={otherUser.avatar || `https://ui-avatars.com/api/?name=${otherUser.username}&background=random`}
                    alt={otherUser.username}
                    className="h-24 w-24 rounded-full mx-auto mb-4"
                  />
                  <h3 className="text-xl font-medium">
                    {otherUser.firstName} {otherUser.lastName}
                  </h3>
                  <p className="text-gray-600 mb-2">@{otherUser.username}</p>
                  <p className="text-sm text-gray-500 mb-4">{otherUser.email}</p>

                  <div className="flex items-center justify-center mb-4">
                    <span
                      className={cn(
                        "inline-block h-3 w-3 rounded-full mr-2",
                        otherUser.status === "online"
                          ? "bg-green-400"
                          : otherUser.status === "away"
                            ? "bg-yellow-400"
                            : "bg-gray-400",
                      )}
                    ></span>
                    <span className="text-sm">
                      {otherUser.status === "online" ? "Online" : otherUser.status === "away" ? "Away" : "Offline"}
                    </span>
                  </div>

                  {otherUser.bio && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Bio</h4>
                      <p className="text-sm">{otherUser.bio}</p>
                    </div>
                  )}

                  {otherUser.phoneNumber && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Phone</h4>
                      <p className="text-sm">•••••••{otherUser.phoneNumber.slice(-4)}</p>
                      <p className="text-xs text-gray-500">(Phone number is encrypted)</p>
                    </div>
                  )}
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  )
}
