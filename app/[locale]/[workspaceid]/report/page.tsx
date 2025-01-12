"use client"

import React, { useContext, useEffect, useState } from "react"
import { ChatbotUIContext } from "@/context/context"
import { getReportByUserId } from "@/db/reports"
import { toast } from "sonner"
import { IconLoader2 } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { MessageMarkdown } from "@/components/messages/message-markdown"
import { IconDownload, IconShare } from "@tabler/icons-react"

interface Report {
  report_id: string
  user_id: string
  survey_report: string | null
  chat_report: string | null
}

const ReportPage = () => {
  const { profile } = useContext(ChatbotUIContext)
  const [isLoading, setIsLoading] = useState(true)
  const [report, setReport] = useState<Report | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchReport = async () => {
      if (!profile?.user_id) return

      try {
        setIsLoading(true)
        const reportData = await getReportByUserId(profile.user_id)
        setReport(reportData)
      } catch (err: any) {
        console.error("Error fetching report:", err)
        setError(err.message)
        toast.error("Error fetching report: " + err.message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchReport()
  }, [profile?.user_id])

  const handleDownload = (content: string, filename: string) => {
    const element = document.createElement("a")
    const file = new Blob([content], { type: "text/pdf" })
    element.href = URL.createObjectURL(file)
    element.download = filename
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  if (isLoading) {
    return (
      <div className="flex size-full items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <IconLoader2 className="size-12 animate-spin" />
          <p>Loading report...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex size-full items-center justify-center">
        <div className="text-destructive">Error: {error}</div>
      </div>
    )
  }

  return (
    <div className="flex size-full flex-col space-y-4 p-4">
      {/* Survey Summary */}
      <div className="bg-muted/30 rounded-lg p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-medium">Survey summary</h2>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                handleDownload(
                  report?.survey_report || "",
                  "survey-summary.txt"
                )
              }
            >
              <IconDownload className="size-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <IconShare className="size-5" />
            </Button>
          </div>
        </div>

        {report?.survey_report ? (
          <div className="space-y-2">
            <p>This summary is generated based on your survey response.</p>
            <MessageMarkdown content={report.survey_report} />
          </div>
        ) : (
          <p className="text-muted-foreground">
            Please complete the survey to view your summary.
          </p>
        )}
      </div>

      {/* Chat Summary */}
      <div className="bg-muted/30 rounded-lg p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-medium">Chat summary</h2>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                handleDownload(report?.chat_report || "", "chat-summary.txt")
              }
            >
              <IconDownload className="size-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <IconShare className="size-5" />
            </Button>
          </div>
        </div>

        {report?.chat_report ? (
          <div className="space-y-2">
            <p>This summary is generated based on your chat history.</p>
            <p>Here is a list of universities that may interest you:</p>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              {report.chat_report.split("\n").map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground">
            Start a chat to generate your summary.
          </p>
        )}
      </div>
    </div>
  )
}

export default ReportPage
