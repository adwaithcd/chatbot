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
  IconX,
  IconUserCircle
} from "@tabler/icons-react"
import Image from "next/image"
import { FC, useContext, useEffect, useRef, useState, memo } from "react"
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

const ICON_SIZE = 32

const ProfileImage = memo(({ imageUrl }: { imageUrl: string }) => {
  if (!imageUrl)
    return (
      <IconUserCircle
        className="bg-primary text-secondary border-primary rounded border-DEFAULT p-1"
        size={ICON_SIZE}
      />
    )

  return (
    <Image
      className="size-[32px] rounded"
      src={imageUrl}
      height={32}
      width={32}
      alt="user image"
      priority={false}
      loading="lazy"
    />
  )
})
ProfileImage.displayName = "ProfileImage"

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
    setChatMessages,
    applicationAdvisorDisplayMessage
  } = useContext(ChatbotUIContext)

  const { theme } = useTheme()

  const { handleSendMessage } = useChatHandler()

  const editInputRef = useRef<HTMLTextAreaElement>(null)

  const [isHovering, setIsHovering] = useState(false)
  const [editedMessage, setEditedMessage] = useState(message.content)

  const [isLiked, setIsLiked] = useState(message.is_liked ?? false)
  const [isDisliked, setIsDisliked] = useState(message.is_disliked ?? false)
  const [showFeedbackPanel, setShowFeedbackPanel] = useState(false)
  const [feedbackComment, setFeedbackComment] = useState(
    message.feedback_message || ""
  )
  const feedbackPanelRef = useRef<HTMLDivElement>(null)
  // for cancel feedback confirmation
  const [showCancelFeedbackConfirmation, setShowCancelFeedbackConfirmation] =
    useState(false)

  // for change feedback
  const [showChangeFeedbackPanel, setShowChangeFeedbackPanel] = useState(false)
  const [newFeedbackComment, setNewFeedbackComment] = useState("")

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

    const isCurrentlyLiked = isLiked
    const isCurrentlyDisliked = isDisliked
    const hasExistingFeedback = feedbackComment.length > 0

    const updatedLikeStatus = action === "like"
    const updatedDislikeStatus = action === "dislike"

    // Case 1: User is toggling the current state
    if (
      (action === "like" && isCurrentlyLiked) ||
      (action === "dislike" && isCurrentlyDisliked)
    ) {
      if (hasExistingFeedback) {
        setShowCancelFeedbackConfirmation(true)
      } else {
        // Directly update to default state if no feedback
        await updateMessageInDB(
          false,
          false,
          "",
          isCurrentlyLiked,
          isCurrentlyDisliked
        )
        setShowFeedbackPanel(false)
      }
      return
    }

    // Case 2: User is changing from like to dislike or vice versa
    if (
      (action === "like" && isCurrentlyDisliked) ||
      (action === "dislike" && isCurrentlyLiked)
    ) {
      if (hasExistingFeedback) {
        setShowChangeFeedbackPanel(true)
        setNewFeedbackComment("")
      } else {
        updateMessageInDB(
          updatedLikeStatus,
          updatedDislikeStatus,
          "",
          isCurrentlyLiked,
          isCurrentlyDisliked
        )
        setShowFeedbackPanel(true)
      }
      return
    }

    // Case 3: First time liking/disliking
    await updateMessageInDB(
      updatedLikeStatus,
      updatedDislikeStatus,
      feedbackComment,
      isCurrentlyLiked,
      isCurrentlyDisliked
    )
    setShowFeedbackPanel(true)
  }

  // Helper function to update message in DB and state
  const updateMessageInDB = async (
    newLikeStatus: boolean,
    newDislikeStatus: boolean,
    newFeedbackMessage: string,
    isCurrentlyLiked: boolean,
    isCurrentlyDisliked: boolean
  ) => {
    try {
      const updatedMessage = await updateMessage(message.id, {
        is_liked: newLikeStatus,
        is_disliked: newDislikeStatus,
        feedback_message: newFeedbackMessage
      })

      setIsLiked(newLikeStatus)
      setIsDisliked(newDislikeStatus)
      setFeedbackComment(newFeedbackMessage)

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
      setIsLiked(isCurrentlyLiked)
      setIsDisliked(isCurrentlyDisliked)
    }
  }

  const handleSubmitFeedback = async () => {
    try {
      const updatedMessage = await updateMessage(message.id, {
        feedback_message: newFeedbackComment
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
      setFeedbackComment(newFeedbackComment)
      setNewFeedbackComment("") // Reset after submission
    } catch (error) {
      console.error("Error updating feedback message:", error)
    }
  }

  const handleCancelFeedback = async () => {
    // If the message is liked and user clicks on like again
    try {
      const updatedMessage = await updateMessage(message.id, {
        is_liked: false,
        is_disliked: false,
        feedback_message: ""
      })

      setIsLiked(false)
      setIsDisliked(false)
      setFeedbackComment("")
      setShowCancelFeedbackConfirmation(false)
      setShowFeedbackPanel(false)

      setChatMessages(prevMessages =>
        prevMessages.map(chatMessage =>
          chatMessage.message.id === updatedMessage.id
            ? { ...chatMessage, message: updatedMessage }
            : chatMessage
        )
      )
    } catch (error) {
      console.error("Error updating feedback message:", error)
    }
  }

  const handleShowComment = () => {
    setShowCancelFeedbackConfirmation(false)
    setNewFeedbackComment(feedbackComment) // Set newFeedbackComment with current feedback
    setShowFeedbackPanel(true)
  }

  const handleCloseFeedbackPanel = () => {
    setShowFeedbackPanel(false)
    setNewFeedbackComment("") // Reset when closing the panel
  }

  const handleSubmitChangedFeedback = async () => {
    // when user changes like to dislike or vice versa
    try {
      const updatedLikeStatus = !isLiked
      const updatedDislikeStatus = !isDisliked

      const updatedMessage = await updateMessage(message.id, {
        is_liked: updatedLikeStatus,
        is_disliked: updatedDislikeStatus,
        feedback_message: newFeedbackComment
      })

      setIsLiked(updatedLikeStatus)
      setIsDisliked(updatedDislikeStatus)
      setFeedbackComment(newFeedbackComment)
      setShowChangeFeedbackPanel(false)
      setShowFeedbackPanel(false)

      setChatMessages(prevMessages =>
        prevMessages.map(chatMessage =>
          chatMessage.message.id === updatedMessage.id
            ? { ...chatMessage, message: updatedMessage }
            : chatMessage
        )
      )
    } catch (error) {
      console.error("Error updating feedback:", error)
    }
  }

  const isUser = message.role === "user"

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
                isLiked={isLiked}
                isDisliked={isDisliked}
                onLike={() => handleToggleLikeDislike("like")}
                onDislike={() => handleToggleLikeDislike("dislike")}
                onComment={handleShowComment}
                feedbackComment={feedbackComment}
              />
            )}
          </div>
        )}

        <div className={cn("shrink-0", isUser ? "ml-3" : "mr-3 py-2")}>
          {isUser ? (
            <ProfileImage imageUrl={profile?.image_url || ""} />
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
            isUser && "bg-background"
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
                        <>
                          {applicationAdvisorDisplayMessage ? (
                            <div className="text-base ">
                              {"Calling " + applicationAdvisorDisplayMessage}
                              <span className="animate-dots"></span>
                            </div>
                          ) : (
                            <IconCircleFilled
                              className="animate-pulse"
                              size={20}
                            />
                          )}
                        </>
                        // <IconCircleFilled className="animate-pulse" size={20} />
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
            <div className="">
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
                onComment={handleShowComment}
                feedbackComment={feedbackComment}
              />
              {showFeedbackPanel && (
                <div
                  ref={feedbackPanelRef}
                  className="absolute bottom-1 left-44 w-80 overflow-hidden rounded-2xl p-0"
                >
                  <TextareaAutosize
                    placeholder={`Please explain why you ${isLiked ? "like" : "dislike"} this response...`}
                    value={newFeedbackComment}
                    onValueChange={setNewFeedbackComment}
                    minRows={3}
                    maxRows={6}
                    className="w-full resize-none rounded-2xl p-4 pr-20 text-sm focus:outline-none"
                  />
                  <button
                    onClick={handleCloseFeedbackPanel}
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
              )}
              {showCancelFeedbackConfirmation && (
                <div className="bg-background absolute bottom-1 left-44 w-80 overflow-hidden  rounded-2xl p-4 shadow-lg">
                  <p className="mb-4 text-sm">
                    Do you confirm to cancel {isLiked ? "like" : "dislike"}?
                    This will also remove your comment.
                  </p>
                  <div className="flex justify-end space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowCancelFeedbackConfirmation(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={handleCancelFeedback}
                    >
                      Confirm
                    </Button>
                  </div>
                </div>
              )}
              {showChangeFeedbackPanel && (
                <div className="bg-background absolute -bottom-10 left-44 z-10 w-80 overflow-hidden rounded-2xl p-4">
                  <button
                    onClick={() => setShowChangeFeedbackPanel(false)}
                    className="absolute right-2 top-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <IconX size={18} />
                  </button>
                  <div className="mb-4">
                    <p className="mb-2 text-sm">
                      Since you previously {isLiked ? "liked" : "disliked"} this
                      response, do you confirm to change to{" "}
                      {isLiked ? "dislike" : "like"}? This will cancel your
                      previous {isLiked ? "like" : "dislike"} and remove your
                      comment:
                    </p>
                    <p className="mb-4 text-sm italic">
                      &quot;{feedbackComment}&quot;
                    </p>
                    <p className="mb-2 text-sm">
                      Please explain why you {isLiked ? "dislike" : "like"} this
                      response:
                    </p>
                  </div>
                  <div className="relative mt-2">
                    <TextareaAutosize
                      value={newFeedbackComment}
                      onValueChange={setNewFeedbackComment}
                      minRows={3}
                      maxRows={6}
                      className="bg-secondary w-full resize-none rounded-lg p-4 pr-12 text-sm focus:outline-none"
                      placeholder="Enter your new feedback here..."
                    />
                    <button
                      onClick={handleSubmitChangedFeedback}
                      className="absolute bottom-2 right-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      <UilEnter size={18} />
                    </button>
                  </div>
                </div>
              )}
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
Message.displayName = "Message"
