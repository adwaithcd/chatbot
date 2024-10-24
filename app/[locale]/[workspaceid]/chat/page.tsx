"use client"

import { ChatHelp } from "@/components/chat/chat-help"
import { useChatHandler } from "@/components/chat/chat-hooks/use-chat-handler"
import { ChatInput } from "@/components/chat/chat-input"
import { ChatSettings } from "@/components/chat/chat-settings"
import { ChatUI } from "@/components/chat/chat-ui"
import { QuickSettings } from "@/components/chat/quick-settings"
import { Brand } from "@/components/ui/brand"
import { ChatbotUIContext } from "@/context/context"
import useHotkey from "@/lib/hooks/use-hotkey"
import { useTheme } from "next-themes"
import { useContext, useEffect, useRef, useState } from "react"

interface ApiResponse {
  output: {
    "question 1": string
    "question 2": string
    "question 3": string
    "question 4": string
  }
  metadata: {
    run_id: string
    feedback_tokens: string[]
  }
}

const DEFAULT_PROMPTS = [
  "How can I improve my study habits?",
  "What are effective note-taking techniques?",
  "How do I prepare for exams efficiently?"
]

export default function ChatPage() {
  useHotkey("o", () => handleNewChat())
  useHotkey("l", () => {
    handleFocusChatInput()
  })

  const { chatMessages, setUserInput } = useContext(ChatbotUIContext)

  const { handleNewChat, handleFocusChatInput, handleSendMessage } =
    useChatHandler()

  const { theme } = useTheme()

  const [recommendedPrompts, setRecommendedPrompts] = useState<string[]>([])
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(true)

  const fetchedRef = useRef(false) // Keep track of whether we've fetched before

  const recommendedPromptClick = (prompt: string) => {
    setUserInput(prompt)
    handleSendMessage(prompt, chatMessages, false)
  }

  useEffect(() => {
    const fetchRecommendedPrompts = async () => {
      // Only fetch if we have no messages and haven't fetched before
      if (chatMessages.length > 0 || fetchedRef.current) {
        return
      }

      fetchedRef.current = true
      setIsLoadingPrompts(true)

      try {
        const response = await fetch("/api/prompt-recommendations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          }
        })

        if (!response.ok) {
          throw new Error("Failed to fetch recommendations")
        }

        const data: ApiResponse = await response.json()

        const questions = [
          data.output["question 1"],
          data.output["question 2"],
          data.output["question 3"]
        ]
        setRecommendedPrompts(questions)
      } catch (error) {
        console.error("Error fetching prompts:", error)
        setRecommendedPrompts(DEFAULT_PROMPTS)
      } finally {
        setIsLoadingPrompts(false)
      }
    }

    fetchRecommendedPrompts()
  }, [chatMessages.length])

  return (
    <>
      {chatMessages.length === 0 ? (
        <>
          <div className="absolute left-1/2 top-1/2 flex w-full max-w-3xl -translate-x-1/2 -translate-y-1/2 flex-col items-center px-4">
            <div className="mb-10">
              <Brand theme={theme === "dark" ? "dark" : "light"} />
            </div>
            <div className="w-full">
              <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
                {isLoadingPrompts
                  ? [...Array(3)].map((_, index) => (
                      <div
                        key={index}
                        className="bg-secondary flex h-32 animate-pulse items-center justify-center rounded-lg p-6"
                      />
                    ))
                  : // Display fetched prompts
                    recommendedPrompts.slice(0, 3).map((prompt, index) => (
                      <div
                        key={index}
                        className="bg-secondary flex h-32 cursor-pointer items-center justify-center rounded-lg p-6 text-center shadow-md transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
                        onClick={() => {
                          // You might want to add logic here to pre-fill the input with the selected prompt
                          recommendedPromptClick(prompt)
                        }}
                      >
                        <p className="line-clamp-4 overflow-hidden text-ellipsis">
                          {prompt}
                        </p>
                      </div>
                    ))}
              </div>
            </div>
          </div>
          <div className="absolute right-2 top-2">
            <ChatSettings />
          </div>
          <div className="absolute inset-x-0 bottom-0 px-2 pb-3 pt-0 sm:pb-8 sm:pt-5">
            <div className="mx-auto w-full max-w-3xl">
              <ChatInput />
            </div>
          </div>
          {/* <div className="absolute bottom-2 right-2 hidden md:block lg:bottom-4 lg:right-4">
            <ChatHelp />
          </div> */}
        </>
      ) : (
        <ChatUI />
      )}
    </>
  )
}
