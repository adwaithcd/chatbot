import React, { useContext, useEffect, useState } from "react"
import { ChatbotUIContext } from "@/context/context"
import { SIDEBAR_WIDTH } from "@/components/ui/dashboard"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { v4 as uuidv4 } from "uuid"
import OverallExperienceForm from "./overall-experience-form"
import FollowUpForm from "./follow-up-form"
import Loading from "@/app/[locale]/loading"

interface ExitSurveyForm {
  exit_survey_id: string
  user_id: string
  step_completed: number
  helpfulness_rating: number | null
  helpfulness_feedback: string | null
  trustworthiness_rating: number | null
  trustworthiness_feedback: string | null
  additional_feedback: string | null
  follow_up_contact: boolean
  gift_card_preference: string | null
}

const steps = [
  { id: 1, name: "Overall Experience" },
  { id: 2, name: "Follow-up" }
]

const ExitSurveyLayout = () => {
  const { profile } = useContext(ChatbotUIContext)
  const [currentStep, setCurrentStep] = useState(1)
  const [stepCompleted, setStepCompleted] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  const [surveyFormData, setSurveyFormData] = useState<ExitSurveyForm>({
    exit_survey_id: uuidv4(),
    user_id: profile?.user_id || "",
    step_completed: 0,
    helpfulness_rating: null,
    helpfulness_feedback: null,
    trustworthiness_rating: null,
    trustworthiness_feedback: null,
    additional_feedback: null,
    follow_up_contact: false,
    gift_card_preference: null
  })

  const handleNextStep = async () => {
    setStepCompleted(currentStep)
    setCurrentStep(currentStep + 1)
  }

  const renderStepContent = () => {
    if (isLoading) return <Loading />

    switch (currentStep) {
      case 1:
        return (
          <OverallExperienceForm
            formData={surveyFormData}
            setFormData={setSurveyFormData}
          />
        )
      case 2:
        return (
          <FollowUpForm
            formData={surveyFormData}
            setFormData={setSurveyFormData}
          />
        )
      default:
        return null
    }
  }

  const handleStepClick = (stepId: number) => {
    if (stepId <= stepCompleted + 1) {
      setCurrentStep(stepId)
    }
  }

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <div
        className="flex h-full flex-col"
        style={{
          minWidth: `${SIDEBAR_WIDTH}px`,
          maxWidth: `${SIDEBAR_WIDTH}px`,
          width: `${SIDEBAR_WIDTH}px`
        }}
      >
        <h2 className="mb-4 py-10 pl-12 pr-4 text-2xl font-semibold">
          Part Three: Exit Survey
        </h2>
        <ul className="space-y-2">
          {steps.map(step => (
            <li
              key={step.id}
              className={cn(
                "p-3 pr-10 text-right",
                currentStep === step.id && "bg-muted/50 font-bold",
                step.id <= stepCompleted + 1
                  ? "cursor-pointer"
                  : "cursor-not-allowed opacity-50"
              )}
              onClick={() => handleStepClick(step.id)}
            >
              {step.name}
            </li>
          ))}
        </ul>
      </div>
      <div className="bg-muted/50 relative h-full flex-1">
        <div className="flex h-full flex-col items-center overflow-y-auto p-8 pb-24">
          {renderStepContent()}
        </div>
        <div className="fixed bottom-8 right-8">
          <Button onClick={handleNextStep}>
            {currentStep === 2 ? "Submit" : "Next"}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ExitSurveyLayout
