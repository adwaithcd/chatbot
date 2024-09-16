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
import { useContext } from "react"

export default function ChatPage() {
  useHotkey("o", () => handleNewChat())
  useHotkey("l", () => {
    handleFocusChatInput()
  })

  const { chatMessages } = useContext(ChatbotUIContext)

  const { handleNewChat, handleFocusChatInput } = useChatHandler()

  const { theme } = useTheme()

  const recommendedPrompts = [
    "Recommended prompt 1",
    "Recommended prompt 2",
    "Recommended prompt 3"
  ]

  return (
    <div className="relative flex h-full flex-col items-center justify-center">
      {chatMessages.length === 0 ? (
        <>
          <div className="absolute left-1/2 top-1/2 flex w-full max-w-3xl -translate-x-1/2 -translate-y-1/2 flex-col items-center px-4">
            <div className="mb-10">
              <Brand theme={theme === "dark" ? "dark" : "light"} />
            </div>
            <div className="w-full">
              <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
                {recommendedPrompts.map((prompt, index) => (
                  <div
                    key={index}
                    className="flex min-h-[120px] cursor-pointer items-center justify-center rounded-lg bg-gray-100 p-6 text-center shadow-md transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
                    onClick={() => handleFocusChatInput()}
                  >
                    <p>{prompt}</p>
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
          <div className="absolute bottom-2 right-2 hidden md:block lg:bottom-4 lg:right-4">
            <ChatHelp />
          </div>
        </>
      ) : (
        <ChatUI />
      )}
    </div>
  )
}
