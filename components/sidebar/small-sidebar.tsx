import React, { useContext } from "react"
import { Button } from "@/components/ui/button"
import {
  IconChevronRight,
  IconPlus,
  IconUser,
  IconSettings
} from "@tabler/icons-react"
//@ts-ignore
import { UilRobot, UilEdit, UilArrowFromRight } from "@iconscout/react-unicons"
import { ChatbotUIContext } from "@/context/context"
import Image from "next/image"
import { SIDEBAR_ICON_SIZE } from "../sidebar/sidebar-switcher"
import { WithTooltip } from "../ui/with-tooltip"
import { ProfileSettings } from "../utility/profile-settings"
import { useChatHandler } from "../chat/chat-hooks/use-chat-handler"
import { useParams, useRouter } from "next/navigation"
import { NewProfileSettings } from "../utility/new-profile-settings"

interface SmallSidebarProps {
  onExpand: () => void
}

const SmallSidebar: React.FC<SmallSidebarProps> = ({ onExpand }) => {
  const { profile } = useContext(ChatbotUIContext)
  const { handleNewChat } = useChatHandler()
  const createNewChat = () => {
    return async () => {
      handleNewChat()
    }
  }
  const router = useRouter()
  const params = useParams()
  const workspaceId = params.workspaceid as string
  const handleOpenSettings = () => {
    router.push(`/${workspaceId}/profile`)
  }

  return (
    <div className="flex h-full w-16 flex-col justify-between border-r ">
      <div className="flex flex-col items-center space-y-6 pt-6">
        <UilRobot size={SIDEBAR_ICON_SIZE + 4} />
        <Button
          variant="ghost"
          size="icon"
          onClick={onExpand}
          className="hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          <UilArrowFromRight className="size-6" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={createNewChat()}
          className="hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          <UilEdit className="size-6" />
        </Button>
      </div>
      <div className="flex flex-col items-center space-y-6 pb-6">
        {/* <WithTooltip
          display={<div>Profile Settings</div>}
          trigger={<ProfileSettings />}
        /> */}
        <NewProfileSettings />
        <Button
          variant="ghost"
          size="icon"
          onClick={handleOpenSettings}
          className="hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          <IconSettings size={SIDEBAR_ICON_SIZE + 2} className="size-6" />
        </Button>
      </div>
    </div>
  )
}

export default SmallSidebar
