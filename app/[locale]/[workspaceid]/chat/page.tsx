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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip"

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
          },
          body: JSON.stringify({})
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

  const textRefs = useRef<(HTMLParagraphElement | null)[]>([])
  const [overflowStates, setOverflowStates] = useState<boolean[]>([])

  const checkOverflow = () => {
    if (!isLoadingPrompts) {
      const newOverflowStates = textRefs.current.map(ref => {
        if (ref) {
          return ref.scrollHeight > ref.clientHeight
        }
        return false
      })
      setOverflowStates(newOverflowStates)
    }
  }

  useEffect(() => {
    checkOverflow()
    window.addEventListener("resize", checkOverflow)
    return () => window.removeEventListener("resize", checkOverflow)
  }, [isLoadingPrompts, recommendedPrompts])

  return (
    <>
      {chatMessages.length === 0 ? (
        <>
          <div className="absolute left-1/2 top-1/2 flex w-full max-w-3xl -translate-x-1/2 -translate-y-1/2 flex-col items-center">
            <div className="mb-10">
              <Brand theme={theme === "dark" ? "dark" : "light"} />
            </div>
            <div className="mx-auto w-full max-w-3xl">
              <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
                {isLoadingPrompts
                  ? [...Array(3)].map((_, index) => (
                      <div
                        key={index}
                        className="bg-secondary flex h-32 animate-pulse items-start justify-start rounded-lg p-6"
                      />
                    ))
                  : recommendedPrompts.slice(0, 3).map((prompt, index) => (
                      <TooltipProvider key={index}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className="bg-secondary/100 hover:bg-secondary h-28 cursor-pointer items-center justify-center overflow-hidden rounded-lg p-4 text-left text-base transition-colors duration-200"
                              onClick={() => recommendedPromptClick(prompt)}
                            >
                              <p
                                ref={el => (textRefs.current[index] = el)}
                                className="line-clamp-3 overflow-hidden text-ellipsis"
                              >
                                {prompt}
                              </p>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent
                            className={`max-w-xs p-2 text-sm ${!overflowStates[index] ? "hidden" : ""}`}
                          >
                            {prompt}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
              </div>
            </div>
          </div>
          {/* <div className="absolute right-2 top-2">
            <ChatSettings />
          </div> */}
          <div className="absolute inset-x-0 bottom-0 px-2 pb-3 pt-0 sm:pb-8 sm:pt-5">
            <div className="mx-auto w-full max-w-3xl">
              <ChatInput />
            </div>
          </div>
        </>
      ) : (
        <ChatUI />
      )}
    </>
  )
}
