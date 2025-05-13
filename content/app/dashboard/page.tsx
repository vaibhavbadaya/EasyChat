"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Sparkles, FileText, MessageSquare, Share2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { generateContent } from "@/app/actions"

export default function Dashboard() {
  const router = useRouter()
  const [prompt, setPrompt] = useState("")
  const [contentType, setContentType] = useState("blog")
  const [tone, setTone] = useState("professional")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState("")

  const handleGenerate = async () => {
    if (!prompt) return

    setIsGenerating(true)
    setGeneratedContent("")

    try {
      // This would call your server action in a real implementation
      const content = await generateContent(prompt, contentType, tone)
      setGeneratedContent(content)
    } catch (error) {
      console.error("Error generating content:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <span className="text-lg font-bold">ContentGenius</span>
          </div>
          <nav className="flex items-center gap-6">
            <Button variant="ghost" onClick={() => router.push("/account")}>
              My Account
            </Button>
            <Button variant="outline" onClick={() => router.push("/")}>
              Logout
            </Button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-8">
        <div className="container">
          <h1 className="text-3xl font-bold mb-8">Content Dashboard</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Content Types</CardTitle>
                  <CardDescription>Select the type of content you want to generate</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-5 w-5 text-purple-600" />
                      <button
                        className={`text-left w-full p-2 rounded-md ${contentType === "blog" ? "bg-purple-100 text-purple-800" : "hover:bg-gray-100"}`}
                        onClick={() => setContentType("blog")}
                      >
                        Blog Post
                      </button>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MessageSquare className="h-5 w-5 text-purple-600" />
                      <button
                        className={`text-left w-full p-2 rounded-md ${contentType === "social" ? "bg-purple-100 text-purple-800" : "hover:bg-gray-100"}`}
                        onClick={() => setContentType("social")}
                      >
                        Social Media
                      </button>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Share2 className="h-5 w-5 text-purple-600" />
                      <button
                        className={`text-left w-full p-2 rounded-md ${contentType === "marketing" ? "bg-purple-100 text-purple-800" : "hover:bg-gray-100"}`}
                        onClick={() => setContentType("marketing")}
                      >
                        Marketing Copy
                      </button>
                    </div>
                  </div>

                  <div className="mt-6">
                    <label className="block text-sm font-medium mb-2">Tone of Voice</label>
                    <Select value={tone} onValueChange={setTone}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select tone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="casual">Casual</SelectItem>
                        <SelectItem value="friendly">Friendly</SelectItem>
                        <SelectItem value="authoritative">Authoritative</SelectItem>
                        <SelectItem value="humorous">Humorous</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-2">
              <Card className="h-full flex flex-col">
                <CardHeader>
                  <CardTitle>Generate Content</CardTitle>
                  <CardDescription>
                    Describe what you want to create and our AI will generate it for you
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <div className="mb-4">
                    <Textarea
                      placeholder={`Describe what you want to generate. For example: "Write a blog post about the benefits of meditation for productivity."`}
                      className="min-h-[120px] resize-none"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                    />
                    <Button
                      className="mt-4 bg-purple-600 hover:bg-purple-700"
                      onClick={handleGenerate}
                      disabled={isGenerating || !prompt}
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Generate Content
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="flex-1 mt-6">
                    <div className="border rounded-md p-4 min-h-[300px] bg-gray-50">
                      {generatedContent ? (
                        <div className="whitespace-pre-wrap">{generatedContent}</div>
                      ) : (
                        <div className="text-gray-400 flex items-center justify-center h-full">
                          {isGenerating ? (
                            <div className="flex flex-col items-center">
                              <Loader2 className="h-8 w-8 animate-spin mb-2" />
                              <p>Generating amazing content...</p>
                            </div>
                          ) : (
                            <p>Your generated content will appear here</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
