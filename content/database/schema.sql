-- Users table
CREATE TABLE users (
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

-- Chats table
CREATE TABLE chats (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  is_group_chat BOOLEAN DEFAULT FALSE,
  group_admin_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  last_message_id INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Chat users junction table
CREATE TABLE chat_users (
  chat_id INTEGER REFERENCES chats(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (chat_id, user_id)
);

-- Messages table
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  chat_id INTEGER REFERENCES chats(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Message reads table for read receipts
CREATE TABLE message_reads (
  message_id INTEGER REFERENCES messages(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  read_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (message_id, user_id)
);

-- Session table for authentication
CREATE TABLE session (
  sid VARCHAR NOT NULL COLLATE "default",
  sess JSON NOT NULL,
  expire TIMESTAMP(6) NOT NULL,
  CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
);

CREATE INDEX "IDX_session_expire" ON session ("expire");

-- Add foreign key constraint for last_message_id after both tables exist
ALTER TABLE chats 
ADD CONSTRAINT fk_last_message 
FOREIGN KEY (last_message_id) 
REFERENCES messages(id) 
ON DELETE SET NULL;
