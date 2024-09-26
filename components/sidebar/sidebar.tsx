import { ChatbotUIContext } from "@/context/context"
import { Tables } from "@/supabase/types"
import { ContentType } from "@/types"
import { FC, useContext } from "react"
import { SIDEBAR_WIDTH } from "../ui/dashboard"
import { TabsContent } from "../ui/tabs"
import { WorkspaceSwitcher } from "../utility/workspace-switcher"
import { WorkspaceSettings } from "../workspace/workspace-settings"
import { SidebarContent } from "./sidebar-content"

import { WithTooltip } from "../ui/with-tooltip"
import { ProfileSettings } from "../utility/profile-settings"
import { Settings } from "lucide-react"
// @ts-ignore
import { UilRobot } from "@iconscout/react-unicons"
import { NewProfileSettings } from "../utility/new-profile-settings" // Import the new component
import { useRouter, useParams } from "next/navigation"

interface SidebarProps {
  contentType: ContentType
  showSidebar: boolean
  onToggleSideBar: () => void
}

export const Sidebar: FC<SidebarProps> = ({
  contentType,
  showSidebar,
  onToggleSideBar
}) => {
  const {
    profile,
    folders,
    chats,
    presets,
    prompts,
    files,
    collections,
    assistants,
    tools,
    models
  } = useContext(ChatbotUIContext)

  const chatFolders = folders.filter(folder => folder.type === "chats")
  const presetFolders = folders.filter(folder => folder.type === "presets")
  const promptFolders = folders.filter(folder => folder.type === "prompts")
  const filesFolders = folders.filter(folder => folder.type === "files")
  const collectionFolders = folders.filter(
    folder => folder.type === "collections"
  )
  const assistantFolders = folders.filter(
    folder => folder.type === "assistants"
  )
  const toolFolders = folders.filter(folder => folder.type === "tools")
  const modelFolders = folders.filter(folder => folder.type === "models")

  const router = useRouter()
  const params = useParams()
  const workspaceId = params.workspaceid as string
  const handleOpenProfileSettings = () => {
    // console.log("Opening profile settings for workspace:", workspaceId)
    router.push(`/${workspaceId}/profile`)
  }

  const renderSidebarContent = (
    contentType: ContentType,
    data: any[],
    folders: Tables<"folders">[]
  ) => {
    return (
      <SidebarContent
        contentType={contentType}
        data={data}
        folders={folders}
        onCloseSideBar={onToggleSideBar}
      />
    )
  }

  return (
    <div
      className="flex h-full flex-col"
      style={{
        // Sidebar - SidebarSwitcher
        minWidth: showSidebar ? `${SIDEBAR_WIDTH}px` : "0px",
        maxWidth: showSidebar ? `${SIDEBAR_WIDTH}px` : "0px",
        width: showSidebar ? `${SIDEBAR_WIDTH}px` : "0px"
      }}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between p-3">
          {/* <WorkspaceSwitcher />
          <WorkspaceSettings /> */}

          <div className="flex items-center space-x-2">
            <UilRobot scale={0.3} />
            <span className="text-lg font-semibold">EDUCHAT</span>
          </div>
        </div>

        <div className="min-h-0 grow overflow-y-auto px-3">
          {(() => {
            switch (contentType) {
              case "chats":
                return renderSidebarContent("chats", chats, chatFolders)

              case "presets":
                return renderSidebarContent("presets", presets, presetFolders)

              case "prompts":
                return renderSidebarContent("prompts", prompts, promptFolders)

              case "files":
                return renderSidebarContent("files", files, filesFolders)

              case "collections":
                return renderSidebarContent(
                  "collections",
                  collections,
                  collectionFolders
                )

              case "assistants":
                return renderSidebarContent(
                  "assistants",
                  assistants,
                  assistantFolders
                )

              case "tools":
                return renderSidebarContent("tools", tools, toolFolders)

              case "models":
                return renderSidebarContent("models", models, modelFolders)

              default:
                return null
            }
          })()}
        </div>

        <div className="bg-background sticky bottom-0 flex items-center justify-between p-3">
          <div className="flex items-center space-x-2">
            {/* <WithTooltip
              display={<div>Profile Settings</div>}
              trigger={<NewProfileSettings />}
            /> */}
            <NewProfileSettings />
            <span className="text-sm font-medium">
              {profile?.display_name || "User"}
            </span>
          </div>
          <button className="rounded-full p-1 hover:opacity-50">
            <Settings size={20} onClick={handleOpenProfileSettings} />
          </button>
        </div>
      </div>
    </div>
  )
}
