import { useChatHandler } from "@/components/chat/chat-hooks/use-chat-handler"
import { ChatbotUIContext } from "@/context/context"
import { LLM_LIST } from "@/lib/models/llm/llm-list"
import { cn } from "@/lib/utils"
import { Tables } from "@/supabase/types"
import { LLM, LLMID, MessageImage, ModelProvider } from "@/types"
import {
  IconBolt,
  IconCaretDownFilled,
  IconCaretRightFilled,
  IconCircleFilled,
  IconFileText,
  IconMoodSmile,
  IconPencil,
  IconX
} from "@tabler/icons-react"
import Image from "next/image"
import { FC, useContext, useEffect, useRef, useState } from "react"
import { ModelIcon } from "../models/model-icon"
import { Button } from "../ui/button"
import { FileIcon } from "../ui/file-icon"
import { FilePreview } from "../ui/file-preview"
import { TextareaAutosize } from "../ui/textarea-autosize"
import { WithTooltip } from "../ui/with-tooltip"
import { MessageActions } from "./message-actions"
import { MessageMarkdown } from "./message-markdown"
// @ts-ignore
import { UilRobot, UilEnter } from "@iconscout/react-unicons"
import { useTheme } from "next-themes"
import { updateMessage } from "@/db/messages"
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover"

const ICON_SIZE = 32

interface MessageProps {
  message: Tables<"messages">
  fileItems: Tables<"file_items">[]
  isEditing: boolean
  isLast: boolean
  onStartEdit: (message: Tables<"messages">) => void
  onCancelEdit: () => void
  onSubmitEdit: (value: string, sequenceNumber: number) => void
}

export const Message: FC<MessageProps> = ({
  message,
  fileItems,
  isEditing,
  isLast,
  onStartEdit,
  onCancelEdit,
  onSubmitEdit
}) => {
  const {
    assistants,
    profile,
    isGenerating,
    setIsGenerating,
    firstTokenReceived,
    availableLocalModels,
    availableOpenRouterModels,
    chatMessages,
    selectedAssistant,
    chatImages,
    assistantImages,
    toolInUse,
    files,
    models,
    setChatMessages
  } = useContext(ChatbotUIContext)

  const { theme } = useTheme()

  const { handleSendMessage } = useChatHandler()

  const editInputRef = useRef<HTMLTextAreaElement>(null)

  const [isHovering, setIsHovering] = useState(false)
  const [editedMessage, setEditedMessage] = useState(message.content)

  const [isLiked, setIsLiked] = useState(message.is_liked)
  const [isDisliked, setIsDisliked] = useState(message.is_disliked)
  const [showFeedbackPanel, setShowFeedbackPanel] = useState(false)
  const [feedbackComment, setFeedbackComment] = useState(
    message.feedback_message || ""
  )

  const [showImagePreview, setShowImagePreview] = useState(false)
  const [selectedImage, setSelectedImage] = useState<MessageImage | null>(null)

  const [showFileItemPreview, setShowFileItemPreview] = useState(false)
  const [selectedFileItem, setSelectedFileItem] =
    useState<Tables<"file_items"> | null>(null)

  const [viewSources, setViewSources] = useState(false)

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(message.content)
    } else {
      const textArea = document.createElement("textarea")
      textArea.value = message.content
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)
    }
  }

  const handleSendEdit = () => {
    onSubmitEdit(editedMessage, message.sequence_number)
    onCancelEdit()
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (isEditing && event.key === "Enter" && event.metaKey) {
      handleSendEdit()
    }
  }

  const handleRegenerate = async () => {
    setIsGenerating(true)
    await handleSendMessage(
      editedMessage || chatMessages[chatMessages.length - 2].message.content,
      chatMessages,
      true
    )
  }

  const handleStartEdit = () => {
    onStartEdit(message)
  }

  useEffect(() => {
    setEditedMessage(message.content)

    if (isEditing && editInputRef.current) {
      const input = editInputRef.current
      input.focus()
      input.setSelectionRange(input.value.length, input.value.length)
    }
  }, [isEditing])

  const MODEL_DATA = [
    ...models.map(model => ({
      modelId: model.model_id as LLMID,
      modelName: model.name,
      provider: "custom" as ModelProvider,
      hostedId: model.id,
      platformLink: "",
      imageInput: false
    })),
    ...LLM_LIST,
    ...availableLocalModels,
    ...availableOpenRouterModels
  ].find(llm => llm.modelId === message.model) as LLM

  const messageAssistantImage = assistantImages.find(
    image => image.assistantId === message.assistant_id
  )?.base64

  const selectedAssistantImage = assistantImages.find(
    image => image.path === selectedAssistant?.image_path
  )?.base64

  const modelDetails = LLM_LIST.find(model => model.modelId === message.model)

  const fileAccumulator: Record<
    string,
    {
      id: string
      name: string
      count: number
      type: string
      description: string
    }
  > = {}

  const fileSummary = fileItems.reduce((acc, fileItem) => {
    const parentFile = files.find(file => file.id === fileItem.file_id)
    if (parentFile) {
      if (!acc[parentFile.id]) {
        acc[parentFile.id] = {
          id: parentFile.id,
          name: parentFile.name,
          count: 1,
          type: parentFile.type,
          description: parentFile.description
        }
      } else {
        acc[parentFile.id].count += 1
      }
    }
    return acc
  }, fileAccumulator)

  const handleToggleLikeDislike = async (action: "like" | "dislike") => {
    if (!message) return

    // Check if the clicked action is already active
    if (
      (action === "like" && isLiked) ||
      (action === "dislike" && isDisliked)
    ) {
      // If already active, just toggle the feedback panel
      setShowFeedbackPanel(!showFeedbackPanel)
      return
    }

    const updatedLikeStatus = action === "like"
    const updatedDislikeStatus = action === "dislike"

    setIsLiked(updatedLikeStatus)
    setIsDisliked(updatedDislikeStatus)
    setShowFeedbackPanel(true)

    try {
      const updatedMessage = await updateMessage(message.id, {
        is_liked: updatedLikeStatus,
        is_disliked: updatedDislikeStatus
      })

      // Update the message in the chat messages
      setChatMessages(prevMessages =>
        prevMessages.map(chatMessage =>
          chatMessage.message.id === updatedMessage.id
            ? { ...chatMessage, message: updatedMessage }
            : chatMessage
        )
      )
    } catch (error) {
      console.error("Error updating like/dislike status:", error)
      // Revert the UI state if the update fails
      setIsLiked(message.is_liked)
      setIsDisliked(message.is_disliked)
      setShowFeedbackPanel(false)
    }
  }

  const handleSubmitFeedback = async () => {
    try {
      const updatedMessage = await updateMessage(message.id, {
        feedback_message: feedbackComment
      })

      // Update the message in the chat messages
      setChatMessages(prevMessages =>
        prevMessages.map(chatMessage =>
          chatMessage.message.id === updatedMessage.id
            ? { ...chatMessage, message: updatedMessage }
            : chatMessage
        )
      )

      setShowFeedbackPanel(false)
    } catch (error) {
      console.error("Error updating feedback message:", error)
    }
  }

  const handleCloseFeedbackPanel = () => {
    setShowFeedbackPanel(false)
    setFeedbackComment(message.feedback_message || "")
  }

  const isUser = message.role === "user"

  const getBackgroundColor = () => {
    switch (theme) {
      case "light":
        return "bg-white"
      case "dark":
        return "bg-secondary"
      default:
        return "bg-beige-50"
    }
  }

  return (
    <div
      className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onKeyDown={handleKeyDown}
    >
      <div
        className={cn(
          "relative flex items-start",
          isUser ? "flex-row-reverse" : "flex-row",
          isUser ? "sm:w-[80%]" : "w-full"
        )}
      >
        {isUser && (
          <div className="absolute right-full top-1/2 -translate-y-1/2 pr-2">
            {isHovering && (
              <MessageActions
                onCopy={handleCopy}
                onEdit={handleStartEdit}
                isAssistant={false}
                isLast={isLast}
                isEditing={isEditing}
                isHovering={isHovering}
                onRegenerate={handleRegenerate}
                messageId={message.id}
                isLiked={message.is_liked}
                isDisliked={message.is_disliked}
                onLike={() => handleToggleLikeDislike("like")}
                onDislike={() => handleToggleLikeDislike("dislike")}
              />
            )}
          </div>
        )}

        <div className={cn("shrink-0", isUser ? "ml-3" : "mr-3 py-2")}>
          {isUser ? (
            profile?.image_url ? (
              <Image
                className="size-[32px] rounded"
                src={profile?.image_url}
                height={32}
                width={32}
                alt="user image"
              />
            ) : (
              <IconMoodSmile
                className="bg-primary text-secondary border-primary rounded border-DEFAULT p-1"
                size={ICON_SIZE}
              />
            )
          ) : (
            <UilRobot
              className="bg-primary text-secondary border-primary rounded border-DEFAULT p-1"
              size={ICON_SIZE}
            />
          )}
        </div>

        <div
          className={cn(
            "grow space-y-3",
            isUser ? "rounded-lg px-4 py-3" : "pt-1",
            isUser && getBackgroundColor()
          )}
        >
          <div className="space-y-3">
            {message.role === "system" ? (
              <div className="flex items-center space-x-4">
                <IconPencil
                  className="border-primary bg-primary text-secondary rounded border-DEFAULT p-1"
                  size={ICON_SIZE}
                />
                <div className="text-lg font-semibold">Prompt</div>
              </div>
            ) : null}

            {!firstTokenReceived &&
            isGenerating &&
            isLast &&
            message.role === "assistant" ? (
              <>
                {(() => {
                  switch (toolInUse) {
                    case "none":
                      return (
                        <IconCircleFilled className="animate-pulse" size={20} />
                      )
                    case "retrieval":
                      return (
                        <div className="flex animate-pulse items-center space-x-2">
                          <IconFileText size={20} />
                          <div>Searching files...</div>
                        </div>
                      )
                    default:
                      return (
                        <div className="flex animate-pulse items-center space-x-2">
                          <IconBolt size={20} />
                          <div>Using {toolInUse}...</div>
                        </div>
                      )
                  }
                })()}
              </>
            ) : isEditing ? (
              <TextareaAutosize
                textareaRef={editInputRef}
                className={cn("text-md w-full", isUser && "text-right")}
                value={editedMessage}
                onValueChange={setEditedMessage}
                maxRows={20}
              />
            ) : (
              <div className={cn(isUser && "text-right")}>
                <MessageMarkdown content={message.content} />
              </div>
            )}
          </div>

          {fileItems.length > 0 && (
            <div className="border-primary mt-6 border-t pt-4 font-bold">
              {!viewSources ? (
                <div
                  className="flex cursor-pointer items-center text-lg hover:opacity-50"
                  onClick={() => setViewSources(true)}
                >
                  {fileItems.length}
                  {fileItems.length > 1 ? " Sources " : " Source "}
                  from {Object.keys(fileSummary).length}{" "}
                  {Object.keys(fileSummary).length > 1 ? "Files" : "File"}{" "}
                  <IconCaretRightFilled className="ml-1" />
                </div>
              ) : (
                <>
                  <div
                    className="flex cursor-pointer items-center text-lg hover:opacity-50"
                    onClick={() => setViewSources(false)}
                  >
                    {fileItems.length}
                    {fileItems.length > 1 ? " Sources " : " Source "}
                    from {Object.keys(fileSummary).length}{" "}
                    {Object.keys(fileSummary).length > 1 ? "Files" : "File"}{" "}
                    <IconCaretDownFilled className="ml-1" />
                  </div>

                  <div className="mt-3 space-y-4">
                    {Object.values(fileSummary).map((file, index) => (
                      <div key={index}>
                        <div className="flex items-center space-x-2">
                          <div>
                            <FileIcon type={file.type} />
                          </div>
                          <div className="truncate">{file.name}</div>
                        </div>

                        {fileItems
                          .filter(fileItem => {
                            const parentFile = files.find(
                              parentFile => parentFile.id === fileItem.file_id
                            )
                            return parentFile?.id === file.id
                          })
                          .map((fileItem, index) => (
                            <div
                              key={index}
                              className="ml-8 mt-1.5 flex cursor-pointer items-center space-x-2 hover:opacity-50"
                              onClick={() => {
                                setSelectedFileItem(fileItem)
                                setShowFileItemPreview(true)
                              }}
                            >
                              <div className="text-sm font-normal">
                                <span className="mr-1 text-lg font-bold">
                                  -
                                </span>{" "}
                                {fileItem.content.substring(0, 200)}...
                              </div>
                            </div>
                          ))}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            {message.image_paths.map((path, index) => {
              const item = chatImages.find(image => image.path === path)

              return (
                <Image
                  key={index}
                  className="cursor-pointer rounded hover:opacity-50"
                  src={path.startsWith("data") ? path : item?.base64}
                  alt="message image"
                  width={300}
                  height={300}
                  onClick={() => {
                    setSelectedImage({
                      messageId: message.id,
                      path,
                      base64: path.startsWith("data")
                        ? path
                        : item?.base64 || "",
                      url: path.startsWith("data") ? "" : item?.url || "",
                      file: null
                    })
                    setShowImagePreview(true)
                  }}
                  loading="lazy"
                />
              )
            })}
          </div>

          {isEditing && (
            <div className="mt-4 flex justify-center space-x-2">
              <Button size="sm" onClick={handleSendEdit}>
                Save & Send
              </Button>
              <Button size="sm" variant="outline" onClick={onCancelEdit}>
                Cancel
              </Button>
            </div>
          )}

          {!isUser && (
            <div className="relative">
              <Popover
                open={showFeedbackPanel}
                onOpenChange={setShowFeedbackPanel}
              >
                <PopoverTrigger asChild>
                  <div>
                    <MessageActions
                      onCopy={handleCopy}
                      onEdit={handleStartEdit}
                      isAssistant={true}
                      isLast={isLast}
                      isEditing={isEditing}
                      isHovering={isHovering}
                      onRegenerate={handleRegenerate}
                      messageId={message.id}
                      isLiked={isLiked}
                      isDisliked={isDisliked}
                      onLike={() => handleToggleLikeDislike("like")}
                      onDislike={() => handleToggleLikeDislike("dislike")}
                    />
                  </div>
                </PopoverTrigger>
                <PopoverContent
                  sideOffset={-440}
                  side="left"
                  align="end"
                  className="w-80 overflow-hidden rounded-2xl p-0"
                >
                  <div className="relative">
                    <TextareaAutosize
                      placeholder="Please explain your response and provide suggestions if any"
                      value={feedbackComment}
                      onValueChange={setFeedbackComment}
                      minRows={3}
                      maxRows={6}
                      className="w-full resize-none rounded-2xl p-4 pr-20 text-sm focus:outline-none"
                    />
                    <button
                      onClick={() => setShowFeedbackPanel(false)}
                      className="absolute right-2 top-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      <IconX size={18} />
                    </button>
                    <button
                      onClick={handleSubmitFeedback}
                      className="absolute bottom-2 right-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      <UilEnter size={18} />
                    </button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>
      </div>

      {showImagePreview && selectedImage && (
        <FilePreview
          type="image"
          item={selectedImage}
          isOpen={showImagePreview}
          onOpenChange={(isOpen: boolean) => {
            setShowImagePreview(isOpen)
            setSelectedImage(null)
          }}
        />
      )}

      {showFileItemPreview && selectedFileItem && (
        <FilePreview
          type="file_item"
          item={selectedFileItem}
          isOpen={showFileItemPreview}
          onOpenChange={(isOpen: boolean) => {
            setShowFileItemPreview(isOpen)
            setSelectedFileItem(null)
          }}
        />
      )}
    </div>
  )
}
