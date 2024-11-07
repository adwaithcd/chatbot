"use client"

import { useContext, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ChatbotUIContext } from "@/context/context"
import { supabase } from "@/lib/supabase/browser-client"
import ExitSurveyLayout from "@/components/exitSurvey/exit-survey-layout"

export default function SurveyPage() {
  const router = useRouter()

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center">
      <ExitSurveyLayout />
      {/* <StepsSidebar />  */}
    </div>
  )
}
