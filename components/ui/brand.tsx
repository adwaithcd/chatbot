"use client"

import Link from "next/link"
import { FC } from "react"
import { ChatbotUISVG } from "../icons/chatbotui-svg"
// @ts-ignore
import { UilRobot } from "@iconscout/react-unicons"

interface BrandProps {
  theme?: "dark" | "light"
}

export const Brand: FC<BrandProps> = ({ theme = "dark" }) => {
  return (
    // <Link
    //   className="flex cursor-pointer items-center hover:opacity-50"
    //   href="https://www.chatbotui.com"
    //   target="_blank"
    //   rel="noopener noreferrer"
    // >
    //   {/* <div className="mb-2"> */}
    //   <UilRobot size={100} className="mr-4" />
    //   {/* <ChatbotUISVG theme={theme === "dark" ? "dark" : "light"} scale={0.3} /> */}
    //   {/* </div> */}

    //   <div className="text-4xl font-bold tracking-wide">EDUCHAT</div>
    // </Link>
    <div className="flex items-center">
      <UilRobot size={100} className="mr-4" />
      <div className="text-4xl font-bold tracking-wide">EDUCHAT</div>
    </div>
  )
}
