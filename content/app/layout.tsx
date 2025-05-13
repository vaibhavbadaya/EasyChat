import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/context/auth-context"
import { SocketProvider } from "@/context/socket-context"
import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Real-time Chat Application",
  description: "A modern real-time chat application with secure messaging",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <SocketProvider>{children}</SocketProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
