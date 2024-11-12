"use client"

import { ChatbotUIContext } from "@/context/context"
import { getProfileByUserId, updateProfile } from "@/db/profile"
import {
  getHomeWorkspaceByUserId,
  getWorkspacesByUserId
} from "@/db/workspaces"
import { supabase } from "@/lib/supabase/browser-client"
import { TablesUpdate } from "@/supabase/types"
import { useRouter } from "next/navigation"
import { ChangeEvent, useContext, useEffect, useRef, useState } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card"
import { toast } from "sonner"
import { uploadProfileImage } from "@/db/storage/profile-images"
import Image from "next/image"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  PROFILE_DISPLAY_NAME_MAX,
  PROFILE_USERNAME_MAX,
  PROFILE_USERNAME_MIN
} from "@/db/limits"
import {
  IconCircleCheckFilled,
  IconCircleXFilled,
  IconLoader2,
  IconUserCircle
} from "@tabler/icons-react"
//@ts-ignore
import { UilEditAlt } from "@iconscout/react-unicons"
import { LimitDisplay } from "@/components/ui/limit-display"
import { getSurveyResponseByUserId } from "@/db/survey-responses"

export default function SetupPage() {
  const { profile, setProfile, setWorkspaces, setSelectedWorkspace } =
    useContext(ChatbotUIContext)

  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(true)
  const [checkingUsername, setCheckingUsername] = useState(false)

  // Profile Info
  const [displayName, setDisplayName] = useState("")
  const [username, setUsername] = useState(profile?.username || "")
  const [usernameAvailable, setUsernameAvailable] = useState(true)
  const [profileImageSrc, setProfileImageSrc] = useState(
    profile?.image_url || ""
  )
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null)
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    ;(async () => {
      const session = (await supabase.auth.getSession()).data.session

      if (!session) {
        return router.push("/login")
      } else {
        const user = session.user

        const profile = await getProfileByUserId(user.id)
        setProfile(profile)
        setUsername(profile.username)
        setProfileImageSrc(profile.image_url || "")

        //if user has not onboarded, show the setup page
        if (!profile.has_onboarded) {
          setLoading(false)
        } else {
          const surveyResponse = await getSurveyResponseByUserId(
            profile.user_id
          )
          // if user has completed the survey, redirect to chat
          if (surveyResponse && surveyResponse.step_completed >= 5) {
            const homeWorkspaceId = await getHomeWorkspaceByUserId(
              session.user.id
            )
            return router.push(`/${homeWorkspaceId}/chat`)
          } else {
            return router.push("/survey")
          }
        }
      }
    })()
  }, [])

  const handleImageSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const file = e.target.files[0]

      if (file.size > 6000000) {
        toast.error("Image must be less than 6MB!")
        return
      }

      const url = URL.createObjectURL(file)

      const img = new window.Image()
      img.src = url

      img.onload = () => {
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")

        if (!ctx) {
          toast.error("Unable to create canvas context.")
          return
        }

        const size = Math.min(img.width, img.height)
        canvas.width = size
        canvas.height = size

        ctx.drawImage(
          img,
          (img.width - size) / 2,
          (img.height - size) / 2,
          size,
          size,
          0,
          0,
          size,
          size
        )

        const squareUrl = canvas.toDataURL()

        setProfileImageSrc(squareUrl)
        setProfileImageFile(file)
      }
    }
  }

  const checkUsernameAvailability = async (username: string) => {
    if (!username) {
      setUsernameAvailable(false)
      return
    }

    if (username.length < PROFILE_USERNAME_MIN) {
      setUsernameAvailable(false)
      return
    }

    if (username.length > PROFILE_USERNAME_MAX) {
      setUsernameAvailable(false)
      return
    }

    const usernameRegex = /^[a-zA-Z0-9_]+$/
    if (!usernameRegex.test(username)) {
      setUsernameAvailable(false)
      toast.error(
        "Username must be letters, numbers, or underscores only - no other characters or spacing allowed."
      )
      return
    }

    setCheckingUsername(true)

    try {
      const response = await fetch(`/api/username/available`, {
        method: "POST",
        body: JSON.stringify({ username })
      })

      const data = await response.json()
      setUsernameAvailable(data.isAvailable)
    } catch (error) {
      console.error("Error checking username:", error)
      setUsernameAvailable(false)
    } finally {
      setCheckingUsername(false)
    }
  }

  const handleSaveAndProceed = async () => {
    const session = (await supabase.auth.getSession()).data.session
    if (!session) {
      return router.push("/login")
    }

    const user = session.user
    const profile = await getProfileByUserId(user.id)

    let profileImageUrl = profile.image_url
    let profileImagePath = ""

    if (profileImageFile) {
      const { path, url } = await uploadProfileImage(profile, profileImageFile)
      profileImageUrl = url ?? profileImageUrl
      profileImagePath = path
    }

    const updateProfilePayload: TablesUpdate<"profiles"> = {
      ...profile,
      has_onboarded: true,
      display_name: displayName,
      username,
      image_url: profileImageUrl,
      image_path: profileImagePath
    }

    const updatedProfile = await updateProfile(profile.id, updateProfilePayload)
    setProfile(updatedProfile)

    const workspaces = await getWorkspacesByUserId(profile.user_id)
    const homeWorkspace = workspaces.find(w => w.is_home)

    setSelectedWorkspace(homeWorkspace!)
    setWorkspaces(workspaces)

    return router.push("/survey")
  }

  if (loading) {
    return null
  }

  const isNextEnabled =
    !!username && usernameAvailable && displayName.trim().length > 0

  return (
    <div className="flex h-full items-center justify-center">
      <Card className="max-h-[calc(100vh-60px)] w-[600px] overflow-auto">
        <CardHeader>
          <CardTitle className="text-center">Welcome to EDUCHAT</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Profile Image Selection */}
          <div className="flex flex-col items-center space-y-4">
            <Label>Profile Picture</Label>
            <div className="flex items-center space-x-2">
              <div className="relative size-20">
                {profileImageSrc && !imageError ? (
                  <Image
                    src={profileImageSrc}
                    alt="Profile"
                    width={80}
                    height={80}
                    className="rounded-full object-cover"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <IconUserCircle className="size-20" />
                )}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 rounded-full bg-gray-100 p-1.5 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                >
                  <UilEditAlt size={16} />
                </button>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg, image/jpg"
              onChange={handleImageSelect}
              className="hidden"
            />
          </div>

          {/* Username Input */}
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Label>Username</Label>
              <div className="text-xs">
                {usernameAvailable ? (
                  <div className="text-green-500">AVAILABLE</div>
                ) : (
                  <div className="text-red-500">UNAVAILABLE</div>
                )}
              </div>
            </div>

            <div className="relative">
              <Input
                className="pr-10"
                placeholder="username"
                value={username}
                onChange={e => {
                  setUsername(e.target.value)
                  checkUsernameAvailability(e.target.value)
                }}
                minLength={PROFILE_USERNAME_MIN}
                maxLength={PROFILE_USERNAME_MAX}
              />

              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                {checkingUsername ? (
                  <IconLoader2 className="animate-spin" />
                ) : usernameAvailable ? (
                  <IconCircleCheckFilled className="text-green-500" />
                ) : (
                  <IconCircleXFilled className="text-red-500" />
                )}
              </div>
            </div>

            <LimitDisplay used={username.length} limit={PROFILE_USERNAME_MAX} />
          </div>

          {/* Display Name Input */}
          <div className="space-y-1">
            <Label>Display Name</Label>
            <Input
              placeholder="Your Name"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              maxLength={PROFILE_DISPLAY_NAME_MAX}
            />
            <LimitDisplay
              used={displayName.length}
              limit={PROFILE_DISPLAY_NAME_MAX}
            />
          </div>
        </CardContent>

        <CardFooter className="flex justify-end">
          <Button onClick={handleSaveAndProceed} disabled={!isNextEnabled}>
            Next
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
