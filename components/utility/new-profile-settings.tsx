import { useRouter, useParams } from "next/navigation"
import { FC, useContext } from "react"
import { IconUserCircle } from "@tabler/icons-react"
import { Button } from "../ui/button"
import Image from "next/image"
import { ChatbotUIContext } from "@/context/context"
import { SIDEBAR_ICON_SIZE } from "../sidebar/sidebar-switcher"

export const NewProfileSettings: FC = () => {
  const router = useRouter()
  const params = useParams()
  const workspaceId = params.workspaceid as string

  const { profile } = useContext(ChatbotUIContext)

  const handleOpenProfileSettings = () => {
    // console.log("Opening profile settings for workspace:", workspaceId)
    router.push(`/${workspaceId}/profile`)
  }

  return (
    <Button size="icon" variant="ghost" onClick={handleOpenProfileSettings}>
      {profile?.image_url ? (
        <Image
          className="size-[34px] rounded hover:opacity-50"
          src={profile.image_url + "?" + new Date().getTime()}
          height={34}
          width={34}
          alt="Profile"
        />
      ) : (
        <IconUserCircle size={SIDEBAR_ICON_SIZE} />
      )}
    </Button>
  )
}
