"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"

export default function ProfileForm() {
  const { user, updateProfile } = useAuth()
  const router = useRouter()

  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    bio: user?.bio || "",
    phoneNumber: user?.phoneNumber || "",
  })

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSuccess(false)
    setError("")

    try {
      await updateProfile(formData)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || "Failed to update profile")
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    router.push("/login")
    return null
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Profile Settings</CardTitle>
        <CardDescription>Update your personal information</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div className="flex items-center gap-6">
              <div className="relative">
                <img
                  src={user.avatar || `https://ui-avatars.com/api/?name=${user.username}&background=random`}
                  alt={user.username}
                  className="h-24 w-24 rounded-full object-cover"
                />
                <Button variant="outline" size="sm" className="absolute bottom-0 right-0 rounded-full">
                  Change
                </Button>
              </div>
              <div>
                <h3 className="text-lg font-medium">{user.username}</h3>
                <p className="text-sm text-gray-500">Member since {new Date(user.createdAt).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder="Your phone number will be encrypted"
              />
              <p className="text-xs text-gray-500">Your phone number will be encrypted and only visible to you</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                placeholder="Tell others about yourself"
                rows={4}
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}
            {success && <p className="text-sm text-green-500">Profile updated successfully!</p>}
          </div>

          <div className="mt-6 flex justify-end">
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
