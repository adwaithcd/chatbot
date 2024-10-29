import React, { useEffect, useRef, useState } from "react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface ChatRecommendationsProps {
  onRecommendationClick: (prompt: string) => void
  lastUserMessage?: string
  className?: string
}

const ChatRecommendations = ({
  onRecommendationClick,
  lastUserMessage,
  className
}: ChatRecommendationsProps) => {
  const [recommendations, setRecommendations] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const textRefs = useRef<(HTMLParagraphElement | null)[]>([])
  const [overflowStates, setOverflowStates] = useState<boolean[]>([])
  const previousMessageRef = useRef<string>()

  const checkOverflow = () => {
    if (!isLoading) {
      const newOverflowStates = textRefs.current.map(ref => {
        if (ref) {
          return ref.scrollHeight > ref.clientHeight
        }
        return false
      })
      setOverflowStates(newOverflowStates)
    }
  }

  useEffect(() => {
    checkOverflow()
    window.addEventListener("resize", checkOverflow)
    return () => window.removeEventListener("resize", checkOverflow)
  }, [isLoading, recommendations])

  useEffect(() => {
    const fetchRecommendations = async () => {
      // Skip if the message is the same as the previous one
      if (lastUserMessage === previousMessageRef.current || !lastUserMessage) {
        return
      }

      setIsLoading(true)
      previousMessageRef.current = lastUserMessage

      try {
        const response = await fetch("/api/prompt-recommendations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            message: lastUserMessage
          })
        })

        if (!response.ok) throw new Error("Failed to fetch recommendations")

        const data = await response.json()
        const questions = [
          data.output["question 1"],
          data.output["question 2"],
          data.output["question 3"]
        ]
        setRecommendations(questions)
      } catch (error) {
        console.error("Error fetching recommendations:", error)
        setRecommendations([
          "Could you elaborate more on that?",
          "What are your thoughts on this topic?",
          "Can you provide specific examples?"
        ])
      } finally {
        setIsLoading(false)
      }
    }

    fetchRecommendations()
  }, [lastUserMessage])

  return (
    <div className={cn("mx-auto w-full max-w-3xl px-2 py-3", className)}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {isLoading
          ? [...Array(3)].map((_, index) => (
              <div
                key={index}
                className="bg-secondary h-16 animate-pulse rounded-lg"
              />
            ))
          : recommendations.map((recommendation, index) => (
              <TooltipProvider key={index}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onRecommendationClick(recommendation)}
                      className="bg-secondary/100 hover:bg-secondary h-16 items-center justify-center overflow-hidden rounded-lg p-3 text-start text-sm transition-colors duration-200"
                    >
                      <p
                        ref={el => (textRefs.current[index] = el)}
                        className="line-clamp-2 overflow-hidden text-ellipsis"
                      >
                        {recommendation}
                      </p>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className={`max-w-xs p-2 text-sm ${!overflowStates[index] ? "hidden" : ""}`}
                  >
                    {recommendation}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
      </div>
    </div>
  )
}

export default ChatRecommendations
