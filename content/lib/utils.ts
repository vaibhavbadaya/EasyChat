import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Encryption utilities for sensitive data
export const encryptData = (data: string, key: string): string => {
  // This is a simplified example. In a real app, use a proper encryption library
  // like crypto-js or the Web Crypto API

  // For demonstration purposes only:
  const encryptedData = Buffer.from(data).toString("base64")
  return encryptedData
}

export const decryptData = (encryptedData: string, key: string): string => {
  // This is a simplified example. In a real app, use a proper decryption method

  // For demonstration purposes only:
  const decryptedData = Buffer.from(encryptedData, "base64").toString("utf-8")
  return decryptedData
}
