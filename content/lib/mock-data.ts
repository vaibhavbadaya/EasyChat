import type { User, Chat, Message } from "@/types"

export function generateMockData() {
  // Create mock users
  const mockUsers: User[] = [
    {
      id: "user1",
      username: "johndoe",
      email: "john@example.com",
      firstName: "John",
      lastName: "Doe",
      avatar: "/placeholder.svg?height=200&width=200",
      status: "online",
      lastSeen: new Date().toISOString(),
      bio: "Software developer passionate about building great products.",
    },
    {
      id: "user2",
      username: "janedoe",
      email: "jane@example.com",
      firstName: "Jane",
      lastName: "Doe",
      avatar: "/placeholder.svg?height=200&width=200",
      status: "online",
      lastSeen: new Date().toISOString(),
      bio: "UX designer with a focus on user-centered design.",
    },
    {
      id: "user3",
      username: "bobsmith",
      email: "bob@example.com",
      firstName: "Bob",
      lastName: "Smith",
      avatar: "/placeholder.svg?height=200&width=200",
      status: "offline",
      lastSeen: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      bio: "Product manager with 5 years of experience.",
    },
    {
      id: "user4",
      username: "alicejones",
      email: "alice@example.com",
      firstName: "Alice",
      lastName: "Jones",
      avatar: "/placeholder.svg?height=200&width=200",
      status: "away",
      lastSeen: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
      bio: "Frontend developer specializing in React.",
    },
    {
      id: "user5",
      username: "mikebrown",
      email: "mike@example.com",
      firstName: "Mike",
      lastName: "Brown",
      avatar: "/placeholder.svg?height=200&width=200",
      status: "online",
      lastSeen: new Date().toISOString(),
      bio: "Backend developer with expertise in Node.js and databases.",
    },
  ]

  // Set current user
  const mockCurrentUser = mockUsers[0]

  // Create mock messages
  const createMockMessages = (chatId: string, users: User[]): Message[] => {
    const messages: Message[] = []
    const now = new Date()

    // Create 5 messages for each chat
    for (let i = 0; i < 5; i++) {
      const sender = users[i % users.length]
      const timeOffset = (5 - i) * 10 * 60000 // 10 minutes apart, starting from oldest
      const createdAt = new Date(now.getTime() - timeOffset).toISOString()

      messages.push({
        id: `msg-${chatId}-${i}`,
        content: `This is message ${i + 1} in this chat. Sent by ${sender.username}.`,
        sender,
        chatId,
        readBy: [{ id: sender.id, username: sender.username, readAt: createdAt }],
        createdAt,
        updatedAt: createdAt,
      })
    }

    return messages
  }

  // Create mock chats
  const mockChats: Chat[] = [
    {
      id: "chat1",
      isGroupChat: false,
      users: [mockCurrentUser, mockUsers[1]],
      createdAt: new Date(Date.now() - 86400000 * 7).toISOString(), // 7 days ago
      updatedAt: new Date().toISOString(),
    },
    {
      id: "chat2",
      isGroupChat: false,
      users: [mockCurrentUser, mockUsers[2]],
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(), // 5 days ago
      updatedAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    },
    {
      id: "chat3",
      name: "Project Team",
      isGroupChat: true,
      users: [mockCurrentUser, mockUsers[1], mockUsers[2], mockUsers[3]],
      groupAdmin: mockCurrentUser,
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(), // 3 days ago
      updatedAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    },
    {
      id: "chat4",
      name: "Design Team",
      isGroupChat: true,
      users: [mockCurrentUser, mockUsers[1], mockUsers[3]],
      groupAdmin: mockUsers[1],
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
      updatedAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
    },
    {
      id: "chat5",
      isGroupChat: false,
      users: [mockCurrentUser, mockUsers[4]],
      createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      updatedAt: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
    },
  ]

  // Add messages to chats
  mockChats.forEach((chat) => {
    const messages = createMockMessages(chat.id, chat.users)
    chat.messages = messages
    chat.lastMessage = messages[messages.length - 1]
  })

  return { mockUsers, mockCurrentUser, mockChats }
}
