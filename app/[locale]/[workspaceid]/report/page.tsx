"use client"

import React, { useContext, useEffect, useState } from "react"
import { ChatbotUIContext } from "@/context/context"
import { getReportByUserId } from "@/db/reports"
import { toast } from "sonner"
import { IconLoader2 } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { MessageMarkdown } from "@/components/messages/message-markdown"
import { IconDownload, IconShare } from "@tabler/icons-react"
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
  <div className="bg-background/60 flex h-[45%] w-full flex-col rounded-lg p-4">
    <h2 className="mb-2 text-xl font-medium">{title}</h2>

    <div ref={ref} className="flex-1 overflow-y-auto">
      {content ? (
        <div className="w-full">
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

    <div className="mt-2 flex justify-end gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={onDownload}
        className="flex items-center gap-2"
      >
        <IconDownload className="size-4" />
        Download
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onShare}
        className="flex items-center gap-2"
      >
        <IconShare className="size-4" />
        Share
      </Button>
    </div>
  </div>
))

ReportCard.displayName = "ReportCard"

const ReportPage = () => {
  const { profile } = useContext(ChatbotUIContext)
  const [isLoading, setIsLoading] = useState(true)
  const [report, setReport] = useState<Report | null>(null)
  const [error, setError] = useState<string | null>(null)

  const surveyReportRef = React.useRef<HTMLDivElement>(null)
  const chatReportRef = React.useRef<HTMLDivElement>(null)

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
    <div className="flex h-screen flex-col p-4">
      <div className="flex h-full flex-col gap-4">
        <ReportCard
          ref={surveyReportRef}
          title="Survey Summary"
          content={report?.survey_report ?? null}
          onDownload={() =>
            generatePDF(report?.survey_report || "", "Survey Summary")
          }
          onShare={() => handleShare(report?.survey_report || "")}
        />

        <ReportCard
          ref={chatReportRef}
          title="Chat Summary"
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
