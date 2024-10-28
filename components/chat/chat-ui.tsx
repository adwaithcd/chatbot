import Loading from "@/app/[locale]/loading"
import { useChatHandler } from "@/components/chat/chat-hooks/use-chat-handler"
import { ChatbotUIContext } from "@/context/context"
import { getAssistantToolsByAssistantId } from "@/db/assistant-tools"
import { getChatFilesByChatId } from "@/db/chat-files"
import { getChatById, updateChat } from "@/db/chats"
import { getMessageFileItemsByMessageId } from "@/db/message-file-items"
import { getMessagesByChatId } from "@/db/messages"
import { getMessageImageFromStorage } from "@/db/storage/message-images"
import { convertBlobToBase64 } from "@/lib/blob-to-b64"
import useHotkey from "@/lib/hooks/use-hotkey"
import { LLMID, MessageImage } from "@/types"
import { useParams } from "next/navigation"
import { FC, useContext, useEffect, useRef, useState } from "react"
import { ChatHelp } from "./chat-help"
import { useScroll } from "./chat-hooks/use-scroll"
import { ChatInput } from "./chat-input"
import { ChatMessages } from "./chat-messages"
import { ChatScrollButtons } from "./chat-scroll-buttons"
import { ChatSecondaryButtons } from "./chat-secondary-buttons"
// @ts-ignore
import { UilEditAlt } from "@iconscout/react-unicons"
import { Input } from "@/components/ui/input"
import { IconEdit, IconCheck } from "@tabler/icons-react"
import ChatRecommendations from "./chat-recommendations"

interface ChatUIProps {}

export const ChatUI: FC<ChatUIProps> = ({}) => {
  useHotkey("o", () => handleNewChat())

  const params = useParams()

  const {
    setChatMessages,
    selectedChat,
    setSelectedChat,
    setChatSettings,
    setChatImages,
    assistants,
    setSelectedAssistant,
    setChatFileItems,
    setChatFiles,
    setShowFilesDisplay,
    setUseRetrieval,
    setSelectedTools,
    setChats,
    setUserInput,
    chatMessages,
    isGenerating
  } = useContext(ChatbotUIContext)

  const { handleNewChat, handleFocusChatInput, handleSendMessage } =
    useChatHandler()

  const {
    messagesStartRef,
    messagesEndRef,
    handleScroll,
    scrollToBottom,
    setIsAtBottom,
    isAtTop,
    isAtBottom,
    isOverflowing,
    scrollToTop
  } = useScroll()

  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editedName, setEditedName] = useState("")
  const [lastUserMessage, setLastUserMessage] = useState<string>()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const fetchData = async () => {
      await fetchMessages()
      await fetchChat()

      scrollToBottom()
      setIsAtBottom(true)
    }

    if (params.chatid) {
      fetchData().then(() => {
        handleFocusChatInput()
        setLoading(false)
      })
    } else {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus()
    }
  }, [isEditing])

  // Update last user message when switching chats or when messages change
  useEffect(() => {
    if (chatMessages.length === 0) return

    const findLastUserMessage = (messages: typeof chatMessages) => {
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].message.role === "user") {
          return messages[i].message.content
        }
      }
      return undefined
    }

    const userMessage = findLastUserMessage(chatMessages)
    setLastUserMessage(userMessage)
  }, [chatMessages])

  useEffect(() => {
    if (!isGenerating && lastUserMessage) {
      // Small delay to ensure recommendations are rendered
      setTimeout(() => {
        scrollToBottom()
      }, 100)
    }
  }, [isGenerating, lastUserMessage])

  const fetchMessages = async () => {
    const fetchedMessages = await getMessagesByChatId(params.chatid as string)

    const imagePromises: Promise<MessageImage>[] = fetchedMessages.flatMap(
      message =>
        message.image_paths
          ? message.image_paths.map(async imagePath => {
              const url = await getMessageImageFromStorage(imagePath)

              if (url) {
                const response = await fetch(url)
                const blob = await response.blob()
                const base64 = await convertBlobToBase64(blob)

                return {
                  messageId: message.id,
                  path: imagePath,
                  base64,
                  url,
                  file: null
                }
              }

              return {
                messageId: message.id,
                path: imagePath,
                base64: "",
                url,
                file: null
              }
            })
          : []
    )

    const images: MessageImage[] = await Promise.all(imagePromises.flat())
    setChatImages(images)

    const messageFileItemPromises = fetchedMessages.map(
      async message => await getMessageFileItemsByMessageId(message.id)
    )

    const messageFileItems = await Promise.all(messageFileItemPromises)

    const uniqueFileItems = messageFileItems.flatMap(item => item.file_items)
    setChatFileItems(uniqueFileItems)

    const chatFiles = await getChatFilesByChatId(params.chatid as string)

    setChatFiles(
      chatFiles.files.map(file => ({
        id: file.id,
        name: file.name,
        type: file.type,
        file: null
      }))
    )

    setUseRetrieval(true)
    setShowFilesDisplay(true)

    const fetchedChatMessages = fetchedMessages.map(message => {
      return {
        message,
        fileItems: messageFileItems
          .filter(messageFileItem => messageFileItem.id === message.id)
          .flatMap(messageFileItem =>
            messageFileItem.file_items.map(fileItem => fileItem.id)
          )
      }
    })

    setChatMessages(fetchedChatMessages)
  }

  const fetchChat = async () => {
    const chat = await getChatById(params.chatid as string)
    if (!chat) return

    if (chat.assistant_id) {
      const assistant = assistants.find(
        assistant => assistant.id === chat.assistant_id
      )

      if (assistant) {
        setSelectedAssistant(assistant)

        const assistantTools = (
          await getAssistantToolsByAssistantId(assistant.id)
        ).tools
        setSelectedTools(assistantTools)
      }
    }

    setSelectedChat(chat)
    setChatSettings({
      model: chat.model as LLMID,
      prompt: chat.prompt,
      temperature: chat.temperature,
      contextLength: chat.context_length,
      includeProfileContext: chat.include_profile_context,
      includeWorkspaceInstructions: chat.include_workspace_instructions,
      embeddingsProvider: chat.embeddings_provider as "openai" | "local"
    })
  }

  const handleEditClick = () => {
    setIsEditing(true)
    setEditedName(selectedChat?.name || "")
  }

  const handleSaveName = async () => {
    if (!selectedChat) return

    const updatedChat = await updateChat(selectedChat.id, {
      name: editedName
    })

    setSelectedChat(updatedChat)
    setChats(prevChats =>
      prevChats.map(chat => (chat.id === updatedChat.id ? updatedChat : chat))
    )
    setIsEditing(false)
  }

  const handleRecommendationClick = (prompt: string) => {
    setUserInput(prompt)
    handleSendMessage(prompt, chatMessages, false)
  }

  if (loading) {
    return <Loading />
  }

  return (
    <div className="relative flex h-full flex-col items-center">
      <div className="absolute left-4 top-2.5 flex justify-center">
        <ChatScrollButtons
          isAtTop={isAtTop}
          isAtBottom={isAtBottom}
          isOverflowing={isOverflowing}
          scrollToTop={scrollToTop}
          scrollToBottom={scrollToBottom}
        />
      </div>

      <div className="absolute right-4 top-1 flex h-[40px] items-center space-x-2">
        <ChatSecondaryButtons />
      </div>

      <div className="bg-secondary flex max-h-[50px] min-h-[50px] w-full items-center justify-center border-b-2">
        {isEditing ? (
          <div className="flex w-[calc(100%-120px)] max-w-[500px] items-center justify-center px-4 sm:w-[calc(100%-160px)]">
            <Input
              ref={inputRef}
              value={editedName}
              onChange={e => setEditedName(e.target.value)}
              onBlur={handleSaveName}
              className="w-full px-2 py-1 text-center text-lg"
            />
            <IconCheck
              className="ml-2 shrink-0 cursor-pointer hover:opacity-50"
              size={24}
              onClick={handleSaveName}
            />
          </div>
        ) : (
          <div className="flex w-[calc(100%-120px)] items-center justify-center px-4 sm:w-[calc(100%-160px)]">
            <div className="flex max-w-full items-center justify-center">
              <span className="max-w-[160px] truncate text-center font-bold sm:max-w-[260px] md:max-w-[400px]">
                {selectedChat?.name || "Chat"}
              </span>
              <UilEditAlt
                className="ml-2 shrink-0 cursor-pointer hover:opacity-50"
                size={20}
                onClick={handleEditClick}
              />
            </div>
          </div>
        )}
      </div>

      <div
        className="flex size-full flex-col overflow-auto border-b"
        onScroll={handleScroll}
      >
        <div ref={messagesStartRef} />

        {/* updated width */}
        <div className="mx-auto w-full max-w-[800px] px-4">
          <ChatMessages />
        </div>

        {lastUserMessage && !isGenerating && (
          <ChatRecommendations
            onRecommendationClick={handleRecommendationClick}
            lastUserMessage={lastUserMessage}
          />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* <ChatRecommendations
        isVisible={showRecommendations}
        onRecommendationClick={handleRecommendationClick}
        lastUserMessage={lastUserMessage}
        variant="compact"
      /> */}

      <div className="mx-auto w-full max-w-3xl px-2 pb-3 pt-0 sm:pb-8 sm:pt-5">
        <ChatInput />
      </div>

      {/* <div className="absolute bottom-2 right-2 hidden md:block lg:bottom-4 lg:right-4">
        <ChatHelp />
      </div> */}
    </div>
  )
}
