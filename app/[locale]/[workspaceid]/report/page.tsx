"use client"

import React, { useContext, useEffect, useState } from "react"
import { ChatbotUIContext } from "@/context/context"
import { getReportByUserId } from "@/db/reports"
import { toast } from "sonner"
import { IconLoader2 } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { MessageMarkdown } from "@/components/messages/message-markdown"
import { IconDownload, IconShare } from "@tabler/icons-react"
//@ts-ignore
import { UilDownloadAlt, UilShareAlt } from "@iconscout/react-unicons"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"

interface Report {
  report_id: string
  user_id: string
  survey_report: string | null
  chat_report: string | null
}

const ReportCard = React.forwardRef<
  HTMLDivElement,
  {
    title: string
    content: string | null
    onDownload: () => void
    onShare: () => void
  }
>(({ title, content, onDownload, onShare }, ref) => (
  <div className="bg-background/60 flex h-[40%] w-full flex-col rounded-lg px-6 py-4">
    <h2 className="mb-8 text-xl font-bold">{title}</h2>

    <div ref={ref} className="flex-1 overflow-y-auto">
      {content ? (
        <div className="w-full space-y-4">
          <MessageMarkdown content={content} />
        </div>
      ) : (
        <p className="text-muted-foreground">
          {title === "Survey Summary"
            ? "Please complete the survey to view your summary."
            : "Start a chat to generate your summary."}
        </p>
      )}
    </div>

    <div className="flex justify-end">
      <Button
        variant="ghost"
        size="sm"
        onClick={onDownload}
        className="flex items-center gap-2"
      >
        <UilDownloadAlt className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onShare}
        className="flex items-center"
      >
        <UilShareAlt className="size-4" />
      </Button>
    </div>
  </div>
))

ReportCard.displayName = "ReportCard"

const ReportPage = () => {
  const { profile } = useContext(ChatbotUIContext)
  const [isLoading, setIsLoading] = useState(true)
  const [isChatReportGenerating, setIsChatReportGenerating] = useState(false)
  const [isSurveyReportGenerating, setIsSurveyReportGenerating] =
    useState(false)
  const [report, setReport] = useState<Report | null>(null)
  const [error, setError] = useState<string | null>(null)

  const surveyReportRef = React.useRef<HTMLDivElement>(null)
  const chatReportRef = React.useRef<HTMLDivElement>(null)

  const generateSurveyReport = async () => {
    if (!profile?.user_id) return

    setIsSurveyReportGenerating(true)
    try {
      const response = await fetch("/api/reports/survey", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userId: profile.user_id
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate survey report")
      }

      setReport(prev =>
        prev
          ? {
              ...prev,
              survey_report: data.report
            }
          : null
      )
    } catch (err: any) {
      console.error("Error generating survey report:", err)
      toast.error("Error generating survey report: " + err.message)
    } finally {
      setIsSurveyReportGenerating(false)
    }
  }

  const generateChatReport = async () => {
    if (!profile?.user_id) return

    setIsChatReportGenerating(true)
    try {
      const response = await fetch("/api/reports/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userId: profile.user_id
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate chat report")
      }

      setReport(prev =>
        prev
          ? {
              ...prev,
              chat_report: data.report
            }
          : null
      )
    } catch (err: any) {
      console.error("Error generating chat report:", err)
      toast.error("Error generating chat report: " + err.message)
    } finally {
      setIsChatReportGenerating(false)
    }
  }

  useEffect(() => {
    const generateReports = async () => {
      if (!profile?.user_id) return

      try {
        setIsLoading(true)

        setReport({
          report_id: "1", // Will be generated on backend
          user_id: profile.user_id,
          survey_report: null,
          chat_report: null
        })
        // const reportData = await getReportByUserId(profile.user_id)
        // setReport(reportData)
        //TODO:can save the reports in the table before hand and just fetch them if that functionality is needed

        await Promise.all([generateSurveyReport(), generateChatReport()])
      } catch (err: any) {
        console.error("Error fetching report:", err)
        setError(err.message)
        toast.error("Error fetching report: " + err.message)
      } finally {
        setIsLoading(false)
      }
    }

    generateReports()
  }, [profile?.user_id])

  const generatePDF = async (content: string, title: string) => {
    try {
      const pdf = new jsPDF("p", "pt", "a4")
      const pageWidth = pdf.internal.pageSize.width
      const margin = 40
      const lineHeight = 15

      // Add title
      pdf.setFontSize(16)
      pdf.text(title, margin, margin)

      // Convert markdown to plain text
      // This removes markdown syntax but keeps the structure
      const plainText = content
        .replace(/#{1,6}\s/g, "") // Remove headers
        .replace(/\*\*/g, "") // Remove bold
        .replace(/\*/g, "") // Remove italics
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Convert links to text
        .replace(/```[^`]*```/g, "") // Remove code blocks
        .trim()

      // Split into lines and add to PDF
      pdf.setFontSize(12)
      const splitText = pdf.splitTextToSize(plainText, pageWidth - 2 * margin)

      // Add each line to PDF, creating new pages as needed
      let y = margin + 30 // Start below title
      splitText.forEach((line: string) => {
        if (y > pdf.internal.pageSize.height - margin) {
          pdf.addPage()
          y = margin
        }
        pdf.text(line, margin, y)
        y += lineHeight
      })

      pdf.save(`${title.toLowerCase().replace(/\s+/g, "_")}.pdf`)
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast.error("Error generating PDF")
    }
  }

  const handleShare = async (content: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Report",
          text: content
        })
      } catch (err) {
        console.error("Error sharing:", err)
      }
    } else {
      // Fallback - copy to clipboard
      await navigator.clipboard.writeText(content)
      toast.success("Content copied to clipboard!")
    }
  }

  if (isLoading) {
    return (
      <div className="flex size-full items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <IconLoader2 className="size-12 animate-spin" />
          <p>Generating report...</p>
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
    <div className="flex h-screen flex-col p-10">
      <div className="flex h-full flex-col gap-12">
        <ReportCard
          ref={surveyReportRef}
          title={
            isSurveyReportGenerating
              ? "Generating Survey Summary..."
              : "Survey Summary"
          }
          content={report?.survey_report ?? null}
          onDownload={() =>
            generatePDF(report?.survey_report || "", "Survey Summary")
          }
          onShare={() => handleShare(report?.survey_report || "")}
        />

        <ReportCard
          ref={chatReportRef}
          title={
            isChatReportGenerating
              ? "Generating Chat Summary..."
              : "Chat Summary"
          }
          content={report?.chat_report ?? null}
          onDownload={() =>
            generatePDF(report?.chat_report || "", "Chat Summary")
          }
          onShare={() => handleShare(report?.chat_report || "")}
        />
      </div>
    </div>
  )
}

export default ReportPage
