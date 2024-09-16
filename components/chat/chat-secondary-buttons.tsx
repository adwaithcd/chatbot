import { useChatHandler } from "@/components/chat/chat-hooks/use-chat-handler"
import { ChatbotUIContext } from "@/context/context"
import {
  IconInfoCircle,
  IconMessagePlus,
  IconStar,
  IconShare
} from "@tabler/icons-react"
import { FC, useContext, useState } from "react"
import { WithTooltip } from "../ui/with-tooltip"
import { updateChat } from "@/db/chats"
import { useTheme } from "next-themes"

interface ChatSecondaryButtonsProps {}

export const ChatSecondaryButtons: FC<ChatSecondaryButtonsProps> = ({}) => {
  const { selectedChat, setSelectedChat, chats, setChats } =
    useContext(ChatbotUIContext)
  const [isFavorite, setIsFavorite] = useState(
    selectedChat?.is_favorite || false
  )
  const { theme } = useTheme()

  const { handleNewChat } = useChatHandler()

  const handleToggleFavorite = async () => {
    if (!selectedChat) return

    const updatedFavoriteStatus = !isFavorite
    setIsFavorite(updatedFavoriteStatus)

    try {
      const updatedChat = await updateChat(selectedChat.id, {
        is_favorite: updatedFavoriteStatus
      })

      setSelectedChat(updatedChat)

      //update chats in context
      setChats(prevChats =>
        prevChats.map(chat => (chat.id === updatedChat.id ? updatedChat : chat))
      )

      // If the chat was favorited, move it to the top of the list
      // if (updatedFavoriteStatus) {
      //   setChats(prevChats => {
      //     const chatToMove = prevChats.find(chat => chat.id === updatedChat.id)
      //     if (chatToMove) {
      //       const newChats = prevChats.filter(chat => chat.id !== updatedChat.id)
      //       return [chatToMove, ...newChats]
      //     }
      //     return prevChats
      //   })
      // }
    } catch (error) {
      console.error("Error updating favorite status:", error)
      // Revert the UI state if the update fails
      setIsFavorite(!updatedFavoriteStatus)
    }
  }

  const getStarIconClasses = () => {
    if (isFavorite) {
      return theme === "dark"
        ? "text-white fill-white"
        : "text-black fill-black"
    } else {
      return theme === "dark" ? "text-white" : "text-black"
    }
  }

  return (
    <>
      {selectedChat && (
        <>
          {/* <WithTooltip
            delayDuration={200}
            display={
              <div>
                <div className="text-xl font-bold">Chat Info</div>

                <div className="mx-auto mt-2 max-w-xs space-y-2 sm:max-w-sm md:max-w-md lg:max-w-lg">
                  <div>Model: {selectedChat.model}</div>
                  <div>Prompt: {selectedChat.prompt}</div>

                  <div>Temperature: {selectedChat.temperature}</div>
                  <div>Context Length: {selectedChat.context_length}</div>

                  <div>
                    Profile Context:{" "}
                    {selectedChat.include_profile_context
                      ? "Enabled"
                      : "Disabled"}
                  </div>
                  <div>
                    {" "}
                    Workspace Instructions:{" "}
                    {selectedChat.include_workspace_instructions
                      ? "Enabled"
                      : "Disabled"}
                  </div>

                  <div>
                    Embeddings Provider: {selectedChat.embeddings_provider}
                  </div>
                </div>
              </div>
            }
            trigger={
              <div className="mt-1">
                <IconInfoCircle
                  className="cursor-default hover:opacity-50"
                  size={24}
                />
              </div>
            }
          />

          <WithTooltip
            delayDuration={200}
            display={<div>Start a new chat</div>}
            trigger={
              <div className="mt-1">
                <IconMessagePlus
                  className="cursor-pointer hover:opacity-50"
                  size={24}
                  onClick={handleNewChat}
                />
              </div>
            }
          /> */}

          <WithTooltip
            delayDuration={200}
            display={
              <div>
                {isFavorite ? "Remove from favorites" : "Add to favorites"}
              </div>
            }
            trigger={
              <div className="mt-1">
                <IconStar
                  className={`cursor-pointer ${getStarIconClasses()}`}
                  // className={`cursor-pointer hover:opacity-50 ${
                  //   isFavorite ? "fill-yellow-400 text-yellow-400" : "text-gray-500"
                  // }`}
                  size={24}
                  onClick={handleToggleFavorite}
                />
              </div>
            }
          />

          <WithTooltip
            delayDuration={200}
            display={<div>Share</div>}
            trigger={
              <div className="mt-1">
                <IconShare
                  className="cursor-pointer hover:opacity-50"
                  size={24}
                  // onClick={handleNewChat}
                />
              </div>
            }
          />
        </>
      )}
    </>
  )
}
