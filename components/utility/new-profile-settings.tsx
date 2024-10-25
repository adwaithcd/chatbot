import { useRouter, useParams } from "next/navigation"
import { FC, useContext, memo } from "react"
import { IconUserCircle } from "@tabler/icons-react"
import { Button } from "../ui/button"
import Image from "next/image"
import { ChatbotUIContext } from "@/context/context"
import { SIDEBAR_ICON_SIZE } from "../sidebar/sidebar-switcher"

// Memoized profile image content
const ProfileImageContent = memo(
  ({ imageUrl }: { imageUrl: string | null | undefined }) => {
    if (!imageUrl) {
      return <IconUserCircle size={SIDEBAR_ICON_SIZE} />
    }

    // Use a stable cache key based on the URL itself
    const cacheKey = encodeURIComponent(imageUrl)

    return (
      <Image
        className="size-[34px] rounded hover:opacity-50"
        src={`${imageUrl}?v=${cacheKey}`}
        height={34}
        width={34}
        alt="Profile"
        priority={false}
        loading="lazy"
      />
    )
  }
)
ProfileImageContent.displayName = "ProfileImageContent"

export const NewProfileSettings: FC = memo(() => {
  const router = useRouter()
  const params = useParams()
  const workspaceId = params.workspaceid as string
  const { profile } = useContext(ChatbotUIContext)

  const handleOpenProfileSettings = () => {
    router.push(`/${workspaceId}/profile`)
  }

  return (
    <Button size="icon" variant="ghost" onClick={handleOpenProfileSettings}>
      <ProfileImageContent imageUrl={profile?.image_url} />
    </Button>
  )
})

NewProfileSettings.displayName = "NewProfileSettings"
