export interface User {
  id: string
  username: string
  email: string
  firstName?: string
  lastName?: string
  avatar?: string
  status: "online" | "offline" | "away"
  lastSeen: string
  bio?: string
  phoneNumber?: string
  createdAt: string
  updatedAt: string
}

export interface Message {
  id: string
  content: string
  sender: User
  chatId: string
  readBy: { id: string; username: string; readAt: string }[]
  createdAt: string
  updatedAt: string
}

export interface Chat {
  id: string
  name?: string
  isGroupChat: boolean
  users: User[]
  messages?: Message[]
  lastMessage?: Message
  groupAdmin?: User
  createdAt: string
  updatedAt: string
}
