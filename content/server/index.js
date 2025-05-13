const express = require("express")
const http = require("http")
const { Server } = require("socket.io")
const cors = require("cors")
const cookieParser = require("cookie-parser")
const session = require("express-session")
const pgSession = require("connect-pg-simple")(session)
const { Pool } = require("pg")
const bcrypt = require("bcrypt")
const crypto = require("crypto")
const dotenv = require("dotenv")

// Load environment variables
dotenv.config()

// Initialize Express app
const app = express()
const server = http.createServer(app)

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
})

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  }),
)
app.use(express.json())
app.use(cookieParser())
app.use(
  session({
    store: new pgSession({
      pool,
      tableName: "session",
    }),
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
    },
  }),
)

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  },
})

// Socket.io middleware for authentication
io.use(async (socket, next) => {
  const sessionID = socket.handshake.auth.sessionID
  if (!sessionID) {
    return next(new Error("Authentication error"))
  }

  try {
    // Verify session
    const result = await pool.query("SELECT * FROM session WHERE sid = $1", [sessionID])

    if (result.rows.length === 0) {
      return next(new Error("Session not found"))
    }

    const session = JSON.parse(result.rows[0].sess)
    if (!session.userId) {
      return next(new Error("User not authenticated"))
    }

    // Attach user data to socket
    socket.userId = session.userId
    socket.username = session.username

    // Update user status to online
    await pool.query("UPDATE users SET status = $1, last_seen = NOW() WHERE id = $2", ["online", session.userId])

    next()
  } catch (error) {
    console.error("Socket authentication error:", error)
    next(new Error("Internal server error"))
  }
})

// Socket.io connection handler
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.userId}`)

  // Notify other users that this user is online
  socket.broadcast.emit("user:status", {
    userId: socket.userId,
    status: "online",
  })

  // Join user to their chat rooms
  joinUserRooms(socket)

  // Handle sending messages
  socket.on("message:send", async (data) => {
    try {
      const { content, chatId, tempId } = data

      // Save message to database
      const result = await pool.query(
        `INSERT INTO messages (content, sender_id, chat_id)
         VALUES ($1, $2, $3)
         RETURNING id, content, created_at, updated_at`,
        [content, socket.userId, chatId],
      )

      const message = result.rows[0]

      // Get sender info
      const senderResult = await pool.query(
        "SELECT id, username, first_name, last_name, avatar, status FROM users WHERE id = $1",
        [socket.userId],
      )

      const sender = senderResult.rows[0]

      // Create read receipt for sender
      await pool.query("INSERT INTO message_reads (message_id, user_id, read_at) VALUES ($1, $2, NOW())", [
        message.id,
        socket.userId,
      ])

      // Format message for clients
      const formattedMessage = {
        id: message.id,
        tempId,
        content: message.content,
        sender: {
          id: sender.id,
          username: sender.username,
          firstName: sender.first_name,
          lastName: sender.last_name,
          avatar: sender.avatar,
          status: sender.status,
        },
        chatId,
        readBy: [
          {
            id: socket.userId,
            username: sender.username,
            readAt: new Date().toISOString(),
          },
        ],
        createdAt: message.created_at,
        updatedAt: message.updated_at,
      }

      // Broadcast message to all users in the chat
      io.to(`chat:${chatId}`).emit("message:new", formattedMessage)

      // Update last message in chat
      await pool.query("UPDATE chats SET last_message_id = $1, updated_at = NOW() WHERE id = $2", [message.id, chatId])
    } catch (error) {
      console.error("Error sending message:", error)
      socket.emit("error", { message: "Failed to send message" })
    }
  })

  // Handle message read receipts
  socket.on("message:read", async (data) => {
    try {
      const { messageId, chatId, userId } = data

      // Check if read receipt already exists
      const existingResult = await pool.query("SELECT * FROM message_reads WHERE message_id = $1 AND user_id = $2", [
        messageId,
        userId,
      ])

      if (existingResult.rows.length === 0) {
        // Create read receipt
        await pool.query("INSERT INTO message_reads (message_id, user_id, read_at) VALUES ($1, $2, NOW())", [
          messageId,
          userId,
        ])
      }

      // Get username
      const userResult = await pool.query("SELECT username FROM users WHERE id = $1", [userId])

      const username = userResult.rows[0]?.username || ""

      // Broadcast read receipt to all users in the chat
      io.to(`chat:${chatId}`).emit("message:read", {
        messageId,
        userId,
        username,
        chatId,
        readAt: new Date().toISOString(),
      })
    } catch (error) {
      console.error("Error marking message as read:", error)
    }
  })

  // Handle group chat operations
  socket.on("group:rename", async (data) => {
    try {
      const { chatId, name } = data

      // Check if user is admin
      const adminCheck = await pool.query("SELECT * FROM chats WHERE id = $1 AND group_admin_id = $2", [
        chatId,
        socket.userId,
      ])

      if (adminCheck.rows.length === 0) {
        socket.emit("error", { message: "Only group admin can rename the group" })
        return
      }

      // Update group name
      await pool.query("UPDATE chats SET name = $1, updated_at = NOW() WHERE id = $2", [name, chatId])

      // Notify all users in the chat
      io.to(`chat:${chatId}`).emit("group:renamed", {
        chatId,
        name,
      })
    } catch (error) {
      console.error("Error renaming group:", error)
      socket.emit("error", { message: "Failed to rename group" })
    }
  })

  socket.on("group:addMember", async (data) => {
    try {
      const { chatId, userId } = data

      // Check if user is admin
      const adminCheck = await pool.query("SELECT * FROM chats WHERE id = $1 AND group_admin_id = $2", [
        chatId,
        socket.userId,
      ])

      if (adminCheck.rows.length === 0) {
        socket.emit("error", { message: "Only group admin can add members" })
        return
      }

      // Check if user is already in the chat
      const memberCheck = await pool.query("SELECT * FROM chat_users WHERE chat_id = $1 AND user_id = $2", [
        chatId,
        userId,
      ])

      if (memberCheck.rows.length > 0) {
        socket.emit("error", { message: "User is already in the group" })
        return
      }

      // Add user to chat
      await pool.query("INSERT INTO chat_users (chat_id, user_id) VALUES ($1, $2)", [chatId, userId])

      // Get user info
      const userResult = await pool.query(
        "SELECT id, username, first_name, last_name, avatar, status FROM users WHERE id = $1",
        [userId],
      )

      const user = userResult.rows[0]

      // Notify all users in the chat
      io.to(`chat:${chatId}`).emit("group:memberAdded", {
        chatId,
        user: {
          id: user.id,
          username: user.username,
          firstName: user.first_name,
          lastName: user.last_name,
          avatar: user.avatar,
          status: user.status,
        },
      })

      // Add the new user to the chat room
      const userSocket = getUserSocket(userId)
      if (userSocket) {
        userSocket.join(`chat:${chatId}`)
      }
    } catch (error) {
      console.error("Error adding member to group:", error)
      socket.emit("error", { message: "Failed to add member to group" })
    }
  })

  socket.on("group:removeMember", async (data) => {
    try {
      const { chatId, userId } = data

      // Check if user is admin
      const adminCheck = await pool.query("SELECT * FROM chats WHERE id = $1 AND group_admin_id = $2", [
        chatId,
        socket.userId,
      ])

      if (adminCheck.rows.length === 0) {
        socket.emit("error", { message: "Only group admin can remove members" })
        return
      }

      // Remove user from chat
      await pool.query("DELETE FROM chat_users WHERE chat_id = $1 AND user_id = $2", [chatId, userId])

      // Notify all users in the chat
      io.to(`chat:${chatId}`).emit("group:memberRemoved", {
        chatId,
        userId,
      })

      // Remove the user from the chat room
      const userSocket = getUserSocket(userId)
      if (userSocket) {
        userSocket.leave(`chat:${chatId}`)
      }
    } catch (error) {
      console.error("Error removing member from group:", error)
      socket.emit("error", { message: "Failed to remove member from group" })
    }
  })

  // Handle disconnection
  socket.on("disconnect", async () => {
    console.log(`User disconnected: ${socket.userId}`)

    try {
      // Update user status to offline
      await pool.query("UPDATE users SET status = $1, last_seen = NOW() WHERE id = $2", ["offline", socket.userId])

      // Notify other users
      socket.broadcast.emit("user:status", {
        userId: socket.userId,
        status: "offline",
      })
    } catch (error) {
      console.error("Error handling disconnect:", error)
    }
  })
})

// Helper function to join user to their chat rooms
async function joinUserRooms(socket) {
  try {
    // Get all chats for the user
    const result = await pool.query(
      `SELECT c.id 
       FROM chats c
       JOIN chat_users cu ON c.id = cu.chat_id
       WHERE cu.user_id = $1`,
      [socket.userId],
    )

    // Join each chat room
    result.rows.forEach((row) => {
      socket.join(`chat:${row.id}`)
    })
  } catch (error) {
    console.error("Error joining user rooms:", error)
  }
}

// Helper function to get a user's socket
function getUserSocket(userId) {
  const sockets = Array.from(io.sockets.sockets.values())
  return sockets.find((socket) => socket.userId === userId)
}

// API Routes

// Auth routes
app.post("/api/auth/register", async (req, res) => {
  try {
    const { username, email, password, firstName, lastName } = req.body

    // Check if username or email already exists
    const existingUser = await pool.query("SELECT * FROM users WHERE username = $1 OR email = $2", [username, email])

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: "Username or email already exists" })
    }

    // Hash password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    // Create user
    const result = await pool.query(
      `INSERT INTO users (username, email, password, first_name, last_name, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, username, email, first_name, last_name, avatar, status, created_at, updated_at`,
      [username, email, hashedPassword, firstName, lastName, "online"],
    )

    const user = result.rows[0]

    // Set session
    req.session.userId = user.id
    req.session.username = user.username

    // Return user data
    res.status(201).json({
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      avatar: user.avatar,
      status: user.status,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    })
  } catch (error) {
    console.error("Registration error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body

    // Find user
    const result = await pool.query("SELECT * FROM users WHERE username = $1", [username])

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    const user = result.rows[0]

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    // Update user status
    await pool.query("UPDATE users SET status = $1, last_seen = NOW() WHERE id = $2", ["online", user.id])

    // Set session
    req.session.userId = user.id
    req.session.username = user.username

    // Return user data
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      avatar: user.avatar,
      status: "online",
      bio: user.bio,
      phoneNumber: user.phone_number ? decryptPhoneNumber(user.phone_number) : null,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

app.post("/api/auth/logout", (req, res) => {
  try {
    const userId = req.session.userId

    // Update user status if logged in
    if (userId) {
      pool.query("UPDATE users SET status = $1, last_seen = NOW() WHERE id = $2", ["offline", userId])
    }

    // Destroy session
    req.session.destroy((err) => {
      if (err) {
        console.error("Session destruction error:", err)
        return res.status(500).json({ message: "Logout failed" })
      }
      res.clearCookie("connect.sid")
      res.json({ message: "Logged out successfully" })
    })
  } catch (error) {
    console.error("Logout error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

app.get("/api/auth/me", async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" })
    }

    // Get user data
    const result = await pool.query(
      "SELECT id, username, email, first_name, last_name, avatar, status, bio, phone_number, created_at, updated_at FROM users WHERE id = $1",
      [req.session.userId],
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" })
    }

    const user = result.rows[0]

    // Return user data
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      avatar: user.avatar,
      status: user.status,
      bio: user.bio,
      phoneNumber: user.phone_number ? decryptPhoneNumber(user.phone_number) : null,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    })
  } catch (error) {
    console.error("Auth check error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// User routes
app.patch("/api/users/profile", async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" })
    }

    const { firstName, lastName, email, bio, phoneNumber } = req.body

    // Encrypt phone number if provided
    const encryptedPhoneNumber = phoneNumber ? encryptPhoneNumber(phoneNumber) : null

    // Update user
    const result = await pool.query(
      `UPDATE users 
       SET first_name = COALESCE($1, first_name),
           last_name = COALESCE($2, last_name),
           email = COALESCE($3, email),
           bio = COALESCE($4, bio),
           phone_number = COALESCE($5, phone_number),
           updated_at = NOW()
       WHERE id = $6
       RETURNING id, username, email, first_name, last_name, avatar, status, bio, phone_number, created_at, updated_at`,
      [firstName, lastName, email, bio, encryptedPhoneNumber, req.session.userId],
    )

    const user = result.rows[0]

    // Return updated user data
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      avatar: user.avatar,
      status: user.status,
      bio: user.bio,
      phoneNumber: user.phone_number ? decryptPhoneNumber(user.phone_number) : null,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    })
  } catch (error) {
    console.error("Profile update error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Chat routes
app.get("/api/chats", async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" })
    }

    // Get all chats for the user
    const result = await pool.query(
      `SELECT c.id, c.name, c.is_group_chat, c.group_admin_id, c.created_at, c.updated_at,
              m.id as last_message_id, m.content as last_message_content, 
              m.sender_id as last_message_sender_id, m.created_at as last_message_created_at
       FROM chats c
       JOIN chat_users cu ON c.id = cu.chat_id
       LEFT JOIN messages m ON c.last_message_id = m.id
       WHERE cu.user_id = $1
       ORDER BY c.updated_at DESC`,
      [req.session.userId],
    )

    // Format chats with users
    const chats = await Promise.all(
      result.rows.map(async (row) => {
        // Get all users in the chat
        const usersResult = await pool.query(
          `SELECT u.id, u.username, u.first_name, u.last_name, u.avatar, u.status, u.last_seen
         FROM users u
         JOIN chat_users cu ON u.id = cu.user_id
         WHERE cu.chat_id = $1`,
          [row.id],
        )

        const users = usersResult.rows.map((user) => ({
          id: user.id,
          username: user.username,
          firstName: user.first_name,
          lastName: user.last_name,
          avatar: user.avatar,
          status: user.status,
          lastSeen: user.last_seen,
        }))

        // Get group admin if it's a group chat
        let groupAdmin = null
        if (row.is_group_chat && row.group_admin_id) {
          const adminResult = await pool.query("SELECT id, username FROM users WHERE id = $1", [row.group_admin_id])
          if (adminResult.rows.length > 0) {
            groupAdmin = {
              id: adminResult.rows[0].id,
              username: adminResult.rows[0].username,
            }
          }
        }

        // Format last message if exists
        let lastMessage = null
        if (row.last_message_id) {
          // Get sender info
          const senderResult = await pool.query("SELECT id, username FROM users WHERE id = $1", [
            row.last_message_sender_id,
          ])

          // Get read receipts
          const readByResult = await pool.query(
            `SELECT mr.user_id, u.username, mr.read_at
           FROM message_reads mr
           JOIN users u ON mr.user_id = u.id
           WHERE mr.message_id = $1`,
            [row.last_message_id],
          )

          const readBy = readByResult.rows.map((r) => ({
            id: r.user_id,
            username: r.username,
            readAt: r.read_at,
          }))

          lastMessage = {
            id: row.last_message_id,
            content: row.last_message_content,
            sender: {
              id: row.last_message_sender_id,
              username: senderResult.rows[0]?.username || "",
            },
            chatId: row.id,
            readBy,
            createdAt: row.last_message_created_at,
            updatedAt: row.last_message_created_at,
          }
        }

        return {
          id: row.id,
          name: row.name,
          isGroupChat: row.is_group_chat,
          users,
          groupAdmin,
          lastMessage,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        }
      }),
    )

    res.json(chats)
  } catch (error) {
    console.error("Get chats error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

app.get("/api/chats/:chatId/messages", async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" })
    }

    const { chatId } = req.params

    // Check if user is in the chat
    const memberCheck = await pool.query("SELECT * FROM chat_users WHERE chat_id = $1 AND user_id = $2", [
      chatId,
      req.session.userId,
    ])

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ message: "Not authorized to access this chat" })
    }

    // Get messages
    const result = await pool.query(
      `SELECT m.id, m.content, m.sender_id, m.created_at, m.updated_at
       FROM messages m
       WHERE m.chat_id = $1
       ORDER BY m.created_at ASC`,
      [chatId],
    )

    // Format messages with sender and read receipts
    const messages = await Promise.all(
      result.rows.map(async (row) => {
        // Get sender info
        const senderResult = await pool.query(
          "SELECT id, username, first_name, last_name, avatar, status FROM users WHERE id = $1",
          [row.sender_id],
        )

        const sender = senderResult.rows[0]

        // Get read receipts
        const readByResult = await pool.query(
          `SELECT mr.user_id, u.username, mr.read_at
         FROM message_reads mr
         JOIN users u ON mr.user_id = u.id
         WHERE mr.message_id = $1`,
          [row.id],
        )

        const readBy = readByResult.rows.map((r) => ({
          id: r.user_id,
          username: r.username,
          readAt: r.read_at,
        }))

        return {
          id: row.id,
          content: row.content,
          sender: {
            id: sender.id,
            username: sender.username,
            firstName: sender.first_name,
            lastName: sender.last_name,
            avatar: sender.avatar,
            status: sender.status,
          },
          chatId,
          readBy,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        }
      }),
    )

    res.json(messages)
  } catch (error) {
    console.error("Get messages error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

app.post("/api/chats", async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" })
    }

    const { isGroupChat, name, userIds } = req.body

    // Ensure userIds includes the current user
    const allUserIds = [...new Set([...userIds, req.session.userId])]

    // Start a transaction
    const client = await pool.connect()
    try {
      await client.query("BEGIN")

      // Create chat
      const chatResult = await client.query(
        `INSERT INTO chats (name, is_group_chat, group_admin_id)
         VALUES ($1, $2, $3)
         RETURNING id, name, is_group_chat, group_admin_id, created_at, updated_at`,
        [isGroupChat ? name : null, isGroupChat, isGroupChat ? req.session.userId : null],
      )

      const chat = chatResult.rows[0]

      // Add users to chat
      for (const userId of allUserIds) {
        await client.query("INSERT INTO chat_users (chat_id, user_id) VALUES ($1, $2)", [chat.id, userId])
      }

      // Get users
      const usersResult = await client.query(
        `SELECT u.id, u.username, u.first_name, u.last_name, u.avatar, u.status, u.last_seen
         FROM users u
         WHERE u.id = ANY($1)`,
        [allUserIds],
      )

      const users = usersResult.rows.map((user) => ({
        id: user.id,
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
        avatar: user.avatar,
        status: user.status,
        lastSeen: user.last_seen,
      }))

      await client.query("COMMIT")

      // Format response
      const formattedChat = {
        id: chat.id,
        name: chat.name,
        isGroupChat: chat.is_group_chat,
        users,
        groupAdmin: chat.is_group_chat ? { id: req.session.userId } : null,
        createdAt: chat.created_at,
        updatedAt: chat.updated_at,
      }

      res.status(201).json(formattedChat)

      // Notify users about new chat
      for (const userId of allUserIds) {
        const userSocket = getUserSocket(userId)
        if (userSocket) {
          userSocket.join(`chat:${chat.id}`)
          if (userId !== req.session.userId) {
            userSocket.emit("chat:new", formattedChat)
          }
        }
      }
    } catch (error) {
      await client.query("ROLLBACK")
      throw error
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Create chat error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Helper functions for encryption
function encryptPhoneNumber(phoneNumber) {
  const algorithm = "aes-256-cbc"
  const key = Buffer.from(process.env.ENCRYPTION_KEY || "a-very-secure-32-char-encryption-key", "utf-8")
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(algorithm, key, iv)
  let encrypted = cipher.update(phoneNumber, "utf8", "hex")
  encrypted += cipher.final("hex")
  return iv.toString("hex") + ":" + encrypted
}

function decryptPhoneNumber(encryptedPhoneNumber) {
  try {
    const algorithm = "aes-256-cbc"
    const key = Buffer.from(process.env.ENCRYPTION_KEY || "a-very-secure-32-char-encryption-key", "utf-8")
    const parts = encryptedPhoneNumber.split(":")
    const iv = Buffer.from(parts[0], "hex")
    const encryptedText = parts[1]
    const decipher = crypto.createDecipheriv(algorithm, key, iv)
    let decrypted = decipher.update(encryptedText, "hex", "utf8")
    decrypted += decipher.final("utf8")
    return decrypted
  } catch (error) {
    console.error("Decryption error:", error)
    return null
  }
}

// Database initialization
async function initializeDatabase() {
  const client = await pool.connect()
  try {
    // Create tables if they don't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(100) NOT NULL,
        first_name VARCHAR(50),
        last_name VARCHAR(50),
        avatar VARCHAR(255),
        status VARCHAR(20) DEFAULT 'offline',
        last_seen TIMESTAMP DEFAULT NOW(),
        bio TEXT,
        phone_number TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS chats (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100),
        is_group_chat BOOLEAN DEFAULT FALSE,
        group_admin_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        last_message_id INTEGER,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS chat_users (
        chat_id INTEGER REFERENCES chats(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        PRIMARY KEY (chat_id, user_id)
      );

      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        content TEXT NOT NULL,
        sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        chat_id INTEGER REFERENCES chats(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS message_reads (
        message_id INTEGER REFERENCES messages(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        read_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (message_id, user_id)
      );

      CREATE TABLE IF NOT EXISTS session (
        sid VARCHAR NOT NULL COLLATE "default",
        sess JSON NOT NULL,
        expire TIMESTAMP(6) NOT NULL,
        CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
      );
      
      CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON session ("expire");
    `)

    // Add foreign key constraint for last_message_id
    try {
      await client.query(`
        ALTER TABLE chats 
        ADD CONSTRAINT fk_last_message 
        FOREIGN KEY (last_message_id) 
        REFERENCES messages(id) 
        ON DELETE SET NULL;
      `)
    } catch (error) {
      // Constraint might already exist, which is fine
      console.log("Note: last_message_id constraint may already exist")
    }

    console.log("Database initialized successfully")
  } catch (error) {
    console.error("Database initialization error:", error)
  } finally {
    client.release()
  }
}

// Start server
const PORT = process.env.PORT || 5000
server.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`)
  await initializeDatabase()
})
