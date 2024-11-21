"use client"

import { Sidebar } from "@/components/sidebar/sidebar"
import { SidebarSwitcher } from "@/components/sidebar/sidebar-switcher"
import { Button } from "@/components/ui/button"
import { Tabs } from "@/components/ui/tabs"
import useHotkey from "@/lib/hooks/use-hotkey"
import { cn } from "@/lib/utils"
import { ContentType } from "@/types"
import { IconChevronCompactRight } from "@tabler/icons-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { FC, useEffect, useState } from "react"
import { useSelectFileHandler } from "../chat/chat-hooks/use-select-file-handler"
import { CommandK } from "../utility/command-k"
import SmallSidebar from "../sidebar/small-sidebar"
import { ProfileSettings } from "../utility/profile-settings"
import { WithTooltip } from "./with-tooltip"

export const SIDEBAR_WIDTH = 350
const MOBILE_BREAKPOINT = 768

interface DashboardProps {
  children: React.ReactNode
}

export const Dashboard: FC<DashboardProps> = ({ children }) => {
  useHotkey("s", () => setShowSidebar(prevState => !prevState))

  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabValue = searchParams.get("tab") || "chats"

  const { handleSelectDeviceFile } = useSelectFileHandler()

  const [contentType, setContentType] = useState<ContentType>(
    tabValue as ContentType
  )
  // const [showSidebar, setShowSidebar] = useState(
  //   localStorage.getItem("showSidebar") === "true"
  // )

  const [showSidebar, setShowSidebar] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  const [isDragging, setIsDragging] = useState(false)

  // Handle initial load and window resize
  useEffect(() => {
    const checkScreenSize = () => {
      const isMobileView = window.innerWidth < MOBILE_BREAKPOINT
      setIsMobile(isMobileView)
      // Only auto-collapse sidebar on initial load for mobile
      if (!localStorage.getItem("sidebarPreference")) {
        setShowSidebar(!isMobileView)
      }
    }

    // Check initial screen size
    checkScreenSize()

    // Add resize listener
    window.addEventListener("resize", checkScreenSize)

    // Cleanup
    return () => window.removeEventListener("resize", checkScreenSize)
  }, [])

  // Load saved preference if it exists
  useEffect(() => {
    const savedPreference = localStorage.getItem("sidebarPreference")
    if (savedPreference !== null) {
      setShowSidebar(savedPreference === "true")
    }
  }, [])

  const onFileDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()

    const files = event.dataTransfer.files
    const file = files[0]

    handleSelectDeviceFile(file)

    setIsDragging(false)
  }

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(false)
  }

  const onDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }

  const handleToggleSidebar = () => {
    setShowSidebar(prevState => !prevState)
    localStorage.setItem("showSidebar", String(!showSidebar))
  }

  const handleNewChat = () => {
    // Implement new chat functionality
    console.log("New chat")
  }

  const handleOpenSettings = () => {
    setIsSettingsOpen(true)
  }

  return (
    <div className="flex size-full">
      <CommandK />
      {!showSidebar && <SmallSidebar onExpand={handleToggleSidebar} />}

      <div
        className={cn(
          "transition-all duration-300 ease-in-out dark:border-none"
        )}
        style={{
          // Sidebar
          minWidth: showSidebar ? `${SIDEBAR_WIDTH}px` : "0px",
          maxWidth: showSidebar ? `${SIDEBAR_WIDTH}px` : "0px",
          width: showSidebar ? `${SIDEBAR_WIDTH}px` : "0px"
        }}
      >
        {showSidebar && (
          <Sidebar
            contentType={contentType}
            showSidebar={true}
            onToggleSideBar={handleToggleSidebar}
          />
        )}
      </div>

      <div
        className="bg-muted/50 relative flex w-screen min-w-[90%] grow flex-col sm:min-w-fit"
        onDrop={onFileDrop}
        onDragOver={onDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
      >
        {isDragging ? (
          <div className="flex h-full items-center justify-center bg-black/50 text-2xl text-white">
            drop file here
          </div>
        ) : (
          children
        )}
        {/* button to expand side bar
        <Button
          className={cn(
            "absolute left-[4px] top-[50%] z-10 size-[32px] cursor-pointer"
          )}
          style={{
            // marginLeft: showSidebar ? `${SIDEBAR_WIDTH}px` : "0px",
            transform: showSidebar ? "rotate(180deg)" : "rotate(0deg)"
          }}
          variant="ghost"
          size="icon"
          onClick={handleToggleSidebar}
        >
          <IconChevronCompactRight size={24} />
        </Button> */}
      </div>
    </div>
  )
}
