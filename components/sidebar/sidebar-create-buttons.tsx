import { useChatHandler } from "@/components/chat/chat-hooks/use-chat-handler"
import { ChatbotUIContext } from "@/context/context"
import { createFolder } from "@/db/folders"
import { ContentType } from "@/types"
import { IconFolderPlus, IconPlus } from "@tabler/icons-react"
import { FC, useContext, useEffect, useState } from "react"
import { Button } from "../ui/button"
import { CreateAssistant } from "./items/assistants/create-assistant"
import { CreateCollection } from "./items/collections/create-collection"
import { CreateFile } from "./items/files/create-file"
import { CreateModel } from "./items/models/create-model"
import { CreatePreset } from "./items/presets/create-preset"
import { CreatePrompt } from "./items/prompts/create-prompt"
import { CreateTool } from "./items/tools/create-tool"
import { useRouter } from "next/navigation"
//@ts-ignore
import {
  UilEdit,
  UilLeftArrowFromLeft,
  UilFileCheckAlt,
  UilGraphBar,
  UilFileExclamationAlt
} from "@iconscout/react-unicons"
import { getSurveyResponseByUserId } from "@/db/survey-responses"

interface SidebarCreateButtonsProps {
  contentType: ContentType
  hasData: boolean
  onCloseSideBar: () => void
}

export const SidebarCreateButtons: FC<SidebarCreateButtonsProps> = ({
  contentType,
  hasData,
  onCloseSideBar
}) => {
  const { profile, selectedWorkspace, folders, setFolders } =
    useContext(ChatbotUIContext)
  const { handleNewChat } = useChatHandler()

  const [isCreatingPrompt, setIsCreatingPrompt] = useState(false)
  const [isCreatingPreset, setIsCreatingPreset] = useState(false)
  const [isCreatingFile, setIsCreatingFile] = useState(false)
  const [isCreatingCollection, setIsCreatingCollection] = useState(false)
  const [isCreatingAssistant, setIsCreatingAssistant] = useState(false)
  const [isCreatingTool, setIsCreatingTool] = useState(false)
  const [isCreatingModel, setIsCreatingModel] = useState(false)
  const [isSurveyComplete, setIsSurveyComplete] = useState(false)
  const router = useRouter()

  const handleCreateFolder = async () => {
    if (!profile) return
    if (!selectedWorkspace) return

    const createdFolder = await createFolder({
      user_id: profile.user_id,
      workspace_id: selectedWorkspace.id,
      name: "New Folder",
      description: "",
      type: contentType
    })
    setFolders([...folders, createdFolder])
  }

  const getCreateFunction = () => {
    switch (contentType) {
      case "chats":
        return async () => {
          handleNewChat()
        }

      case "presets":
        return async () => {
          setIsCreatingPreset(true)
        }

      case "prompts":
        return async () => {
          setIsCreatingPrompt(true)
        }

      case "files":
        return async () => {
          setIsCreatingFile(true)
        }

      case "collections":
        return async () => {
          setIsCreatingCollection(true)
        }

      case "assistants":
        return async () => {
          setIsCreatingAssistant(true)
        }

      case "tools":
        return async () => {
          setIsCreatingTool(true)
        }

      case "models":
        return async () => {
          setIsCreatingModel(true)
        }

      default:
        break
    }
  }

  useEffect(() => {
    const checkSurveyStatus = async () => {
      if (profile?.user_id) {
        try {
          const surveyResponse = await getSurveyResponseByUserId(
            profile.user_id
          )
          setIsSurveyComplete(surveyResponse?.step_completed === 5)
        } catch (e) {
          console.error("Error checking survey status:", e)
        }
      }
    }
    checkSurveyStatus()
  }, [profile?.user_id])

  return (
    <div className="flex w-full flex-col space-y-2">
      {/* <Button className="flex h-[36px] grow" onClick={getCreateFunction()}>
        <IconPlus className="mr-1" size={20} />
        New{" "}
        {contentType.charAt(0).toUpperCase() +
          contentType.slice(1, contentType.length - 1)}
      </Button>

      {hasData && (
        <Button className="size-[36px] p-1" onClick={handleCreateFolder}>
          <IconFolderPlus size={20} />
        </Button>
      )} */}

      <div className="flex w-full justify-between">
        <Button
          className="flex h-[36px]"
          variant="ghost"
          onClick={getCreateFunction()}
        >
          <UilEdit className="mr-3" size={20} />
          New Chat
        </Button>

        <Button
          className="flex h-[36px]"
          variant="ghost"
          onClick={onCloseSideBar}
        >
          <UilLeftArrowFromLeft size={20} />
        </Button>
      </div>

      <div className="flex w-full justify-between">
        <Button
          className="flex h-[36px]"
          variant="ghost"
          onClick={() => router.push("/survey")}
        >
          {isSurveyComplete ? (
            <UilFileCheckAlt className="mr-3" size={20} />
          ) : (
            <UilFileExclamationAlt className="mr-3" size={20} />
          )}
          Survey
        </Button>
      </div>

      <div className="flex w-full justify-between">
        <Button className="flex h-[36px]" variant="ghost">
          <UilGraphBar className="mr-3" size={20} />
          Report
        </Button>
      </div>

      {/* {isCreatingPrompt && (
        <CreatePrompt
          isOpen={isCreatingPrompt}
          onOpenChange={setIsCreatingPrompt}
        />
      )}

      {isCreatingPreset && (
        <CreatePreset
          isOpen={isCreatingPreset}
          onOpenChange={setIsCreatingPreset}
        />
      )}

      {isCreatingFile && (
        <CreateFile isOpen={isCreatingFile} onOpenChange={setIsCreatingFile} />
      )}

      {isCreatingCollection && (
        <CreateCollection
          isOpen={isCreatingCollection}
          onOpenChange={setIsCreatingCollection}
        />
      )}

      {isCreatingAssistant && (
        <CreateAssistant
          isOpen={isCreatingAssistant}
          onOpenChange={setIsCreatingAssistant}
        />
      )}

      {isCreatingTool && (
        <CreateTool isOpen={isCreatingTool} onOpenChange={setIsCreatingTool} />
      )}

      {isCreatingModel && (
        <CreateModel
          isOpen={isCreatingModel}
          onOpenChange={setIsCreatingModel}
        />
      )} */}
    </div>
  )
}
