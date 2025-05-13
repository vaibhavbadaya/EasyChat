# Real-time Chat Application

A full-stack real-time chat application with secure messaging, built with Next.js, Node.js, Socket.io, and PostgreSQL.

## Features

- Real-time messaging with Socket.io
- User authentication and authorization
- Group chat functionality
- Read receipts
- Online status indicators
- Encrypted sensitive data (phone numbers)
- Responsive UI for desktop and mobile

## Tech Stack

### Frontend
- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS
- shadcn/ui components
- Socket.io client

### Backend
- Node.js
- Express
- Socket.io
- PostgreSQL
- bcrypt for password hashing
- crypto for data encryption

## Project Structure

\`\`\`
├── app/                  # Next.js App Router
│   ├── api/              # API routes
│   ├── login/            # Login page
│   ├── register/         # Registration page
│   ├── profile/          # User profile page
│   └── page.tsx          # Main chat interface
├── components/           # React components
│   ├── auth/             # Authentication components
│   ├── chat/             # Chat interface components
│   ├── profile/          # Profile components
│   └── ui/               # UI components (shadcn)
├── context/              # React context providers
│   ├── auth-context.tsx  # Authentication context
│   └── socket-context.tsx # Socket.io context
├── lib/                  # Utility functions
├── types/                # TypeScript type definitions
└── server/               # Backend Node.js server
    ├── index.js          # Express and Socket.io server
    └── database/         # Database schema and migrations
\`\`\`

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL

### Installation

1. Clone the repository
\`\`\`bash
git clone https://github.com/yourusername/chat-app.git
cd chat-app
\`\`\`

2. Install frontend dependencies
\`\`\`bash
npm install
\`\`\`

3. Install backend dependencies
\`\`\`bash
cd server
npm install
\`\`\`

4. Set up environment variables
   - Copy `.env.example` to `.env` in the server directory
   - Update the variables with your PostgreSQL connection details

5. Start the development servers

Frontend:
\`\`\`bash
npm run dev
\`\`\`

Backend:
\`\`\`bash
cd server
npm run dev
\`\`\`

## Database Schema

The application uses the following PostgreSQL tables:

- `users`: User accounts and profiles
- `chats`: Chat rooms (both 1-on-1 and group chats)
- `chat_users`: Junction table for users in chats
- `messages`: Chat messages
- `message_reads`: Read receipts for messages
- `session`: User sessions for authentication

## Security Features

- Password hashing with bcrypt
- Phone number encryption with AES-256-CBC
- Session-based authentication
- CORS protection

## License

MIT
