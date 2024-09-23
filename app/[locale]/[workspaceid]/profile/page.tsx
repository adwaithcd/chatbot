// app/[locale]/[workspaceid]/profile/page.tsx
"use client"

import { useState, useEffect, useContext, useRef, ChangeEvent } from "react"
import { useRouter } from "next/navigation"
import { ChatbotUIContext } from "@/context/context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import ImagePicker from "@/components/ui/image-picker"
import { updateProfile } from "@/db/profile"
import { uploadProfileImage } from "@/db/storage/profile-images"
import { useTheme } from "next-themes"
import Image from "next/image"
// @ts-ignore
import { UilEditAlt } from "@iconscout/react-unicons"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase/browser-client"

export default function ProfileSettings() {
  const router = useRouter()
  const { profile, setProfile } = useContext(ChatbotUIContext)
  const { theme, setTheme } = useTheme()

  const [displayName, setDisplayName] = useState(profile?.display_name || "")
  const [username, setUsername] = useState(profile?.username || "")
  const [profileImageSrc, setProfileImageSrc] = useState(
    profile?.image_url || ""
  )
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null)
  const [isDisplayNameEditable, setIsDisplayNameEditable] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const displayNameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || "")
      setUsername(profile.username || "")
      setProfileImageSrc(profile.image_url || "")
    }
  }, [profile])

  useEffect(() => {
    if (isDisplayNameEditable) {
      displayNameInputRef.current?.focus()
    }
  }, [isDisplayNameEditable])

  const handleSave = async () => {
    if (!profile) return

    let profileImageUrl = profile.image_url
    let profileImagePath = ""

    if (profileImageFile) {
      const { path, url } = await uploadProfileImage(profile, profileImageFile)
      profileImageUrl = url ?? profileImageUrl
      profileImagePath = path
    }

    const updatedProfile = await updateProfile(profile.id, {
      ...profile,
      display_name: displayName,
      username,
      image_url: profileImageUrl,
      image_path: profileImagePath
    })

    setProfile(updatedProfile)
    router.back()
  }

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

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  const getBackgroundColor = () => {
    switch (theme) {
      case "light":
        return "bg-gray-100"
      case "dark":
        return "bg-gray-1000"
      default:
        return "bg-beige-100"
    }
  }

  const getInputBackgroundColor = () => {
    switch (theme) {
      case "light":
        return "bg-white"
      case "dark":
        return "bg-gray-700"
      default:
        return "bg-beige-50"
    }
  }

  const getSeparatorColor = () => {
    switch (theme) {
      case "light":
        return "bg-gray-200"
      case "dark":
        return "bg-gray-900"
      default:
        return "bg-beige-200"
    }
  }

  return (
    <div
      className={`flex min-h-screen items-center justify-center ${getBackgroundColor()} theme-transition`}
    >
      <Button onClick={handleSignOut} className="absolute right-16 top-8">
        Sign Out
      </Button>

      <div className="flex w-full max-w-3xl flex-col space-y-6 p-4">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">General</h2>
          <div
            className={`flex items-center justify-between rounded p-6 px-8 ${getInputBackgroundColor()}`}
          >
            <Label className="p-2">Theme</Label>
            <select
              value={theme}
              onChange={e => setTheme(e.target.value)}
              className={`rounded p-2 ${getBackgroundColor()} w-32 text-sm`}
            >
              <option value="beige">Beige</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Account</h2>
          <div
            className={`flex flex-col rounded p-6 px-8 ${getInputBackgroundColor()}`}
          >
            <div className="flex items-center justify-between py-2">
              <Label className="p-2">Avatar</Label>
              <div className="flex items-center space-x-2">
                <Image
                  src={profileImageSrc || "/default-avatar.png"}
                  alt="Profile"
                  width={50}
                  height={50}
                  className="rounded-full"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <UilEditAlt size={20} />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/jpg"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </div>
            </div>
            <div className={`my-2 h-px ${getSeparatorColor()}`} />
            <div className="flex items-center justify-between py-2">
              <Label className="p-2">Display Name</Label>
              <div className="flex items-center space-x-2">
                {isDisplayNameEditable ? (
                  <Input
                    ref={displayNameInputRef}
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    onBlur={() => setIsDisplayNameEditable(false)}
                    placeholder="Display Name"
                    className={`w-64 text-right ${getInputBackgroundColor()}`}
                  />
                ) : (
                  <div className="w-64 p-2 text-right">{displayName}</div>
                )}
                <button
                  onClick={() => setIsDisplayNameEditable(true)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <UilEditAlt size={20} />
                </button>
              </div>
            </div>
            {/* <div className={`my-2 h-px ${getSeparatorColor()}`} />
            <div className="flex items-center justify-between py-2">
              <Label className="p-2">Username</Label>
              <div
                className={`w-64 p-2 text-right ${getInputBackgroundColor()} rounded`}
              >
                {username || ""}
              </div>
            </div> */}
            {/* <div className={`my-2 h-px ${getSeparatorColor()}`} /> */}
            {/* <div className="flex items-center justify-between py-2">
              <Label className="p-2">Email</Label>
              <div
                className={`w-64 p-2 text-right ${getInputBackgroundColor()} rounded`}
              >
                {"test@email.com" || ""}
              </div>
            </div> */}
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} className="px-8">
            Save
          </Button>
        </div>
      </div>
    </div>
  )
}
