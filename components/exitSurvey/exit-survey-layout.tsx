import React, { useContext, useEffect, useState } from "react"
import { ChatbotUIContext } from "@/context/context"
import { SIDEBAR_WIDTH } from "@/components/ui/dashboard"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { v4 as uuidv4 } from "uuid"
import OverallExperienceForm from "./overall-experience-form"
import FollowUpForm from "./follow-up-form"
import Loading from "@/app/[locale]/loading"
import {
  getExitSurveyResponseByUserId,
  updateExitSurveyStep,
  upsertExitSurveyResponse
} from "@/db/exit-survey"

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
  const [isLoading, setIsLoading] = useState(true)

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

  useEffect(() => {
    const fetchExitSurveyResponse = async () => {
      if (profile) {
        setIsLoading(true)
        try {
          const exitSurveyResponse = await getExitSurveyResponseByUserId(
            profile.user_id
          )

          if (exitSurveyResponse) {
            setSurveyFormData({
              exit_survey_id: exitSurveyResponse.exit_survey_id,
              user_id: profile.user_id,
              step_completed: exitSurveyResponse.step_completed,
              helpfulness_rating: exitSurveyResponse.helpfulness_rating,
              helpfulness_feedback: exitSurveyResponse.helpfulness_feedback,
              trustworthiness_rating: exitSurveyResponse.trustworthiness_rating,
              trustworthiness_feedback:
                exitSurveyResponse.trustworthiness_feedback,
              additional_feedback: exitSurveyResponse.additional_feedback,
              follow_up_contact: exitSurveyResponse.follow_up_contact ?? false,
              gift_card_preference: exitSurveyResponse.gift_card_preference
            })
            setCurrentStep(exitSurveyResponse.step_completed + 1)
            setStepCompleted(exitSurveyResponse.step_completed)
          } else {
            setSurveyFormData(prev => ({
              ...prev,
              user_id: profile.user_id
            }))
          }
        } catch (error) {
          console.error(error)
        } finally {
          setIsLoading(false)
        }
      }
    }

    fetchExitSurveyResponse()
  }, [profile])

  const handleNextStep = async () => {
    if (isStepComplete()) {
      try {
        switch (currentStep) {
          case 1:
            await upsertExitSurveyResponse(surveyFormData)
            break
          case 2:
            await upsertExitSurveyResponse(surveyFormData)
            break
        }
        if (currentStep > stepCompleted) {
          await updateExitSurveyStep(surveyFormData.exit_survey_id, currentStep)
          setStepCompleted(currentStep)
        }
        setCurrentStep(currentStep + 1)
      } catch (error) {
        console.error("Error updating exit survey data:", error)
      }
    }
    setStepCompleted(currentStep)
    setCurrentStep(currentStep + 1)
  }

  const isStepComplete = () => {
    switch (currentStep) {
      case 1:
        return (
          surveyFormData.helpfulness_rating !== null &&
          surveyFormData.helpfulness_feedback !== null &&
          surveyFormData.helpfulness_feedback.trim() !== "" &&
          surveyFormData.trustworthiness_rating !== null &&
          surveyFormData.trustworthiness_feedback !== null &&
          surveyFormData.trustworthiness_feedback.trim() !== "" &&
          surveyFormData.additional_feedback !== null &&
          surveyFormData.additional_feedback.trim() !== ""
        )
      case 2:
        if (surveyFormData.gift_card_preference === "no_contact") {
          return true
        }
        if (surveyFormData.gift_card_preference === "other") {
          return false // Submit should be disabled if "other" is selected without a value
        }
        return (
          surveyFormData.follow_up_contact &&
          surveyFormData.gift_card_preference &&
          surveyFormData.gift_card_preference.trim() !== "" &&
          surveyFormData.gift_card_preference !== "other"
        )
      default:
        return true
    }
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

  const renderCompletionMessage = () => (
    <div className="bg-background flex h-screen w-full items-center justify-center">
      <div className="flex flex-col items-center space-y-6">
        <p className="text-lg">We have saved your responses</p>
        <Button>Go to Chat</Button>
      </div>
    </div>
  )

  // If we're on step 3 (completion), render only the completion message
  if (currentStep === 3) {
    return renderCompletionMessage()
  }

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <div className="flex h-full w-[95px] flex-col md:w-[350px]">
        <h2 className="mb-4 hidden py-10 pl-12 pr-4 text-2xl font-semibold md:block">
          Part Three: Exit Survey
        </h2>
        <h2 className="mb-4 px-3 py-10 text-2xl font-semibold md:hidden">
          Exit Survey
        </h2>
        <ul className="space-y-2">
          {steps.map(step => (
            <li
              key={step.id}
              className={cn(
                "p-3 text-center md:pr-10 md:text-right",
                currentStep === step.id && "bg-muted/50 font-bold",
                step.id <= stepCompleted + 1
                  ? "cursor-pointer"
                  : "cursor-not-allowed opacity-50"
              )}
              onClick={() => handleStepClick(step.id)}
            >
              <span className="hidden md:block">{step.name}</span>
              <span className="block md:hidden">{step.id}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="bg-muted/50 relative h-full flex-1 overflow-hidden">
        <div className="flex h-full flex-col items-center overflow-y-auto px-4 py-6 pb-24 md:p-8">
          {renderStepContent()}
        </div>
        <div className="fixed bottom-8 right-8">
          <Button onClick={handleNextStep} disabled={!isStepComplete()}>
            {currentStep === 2 ? "Submit" : "Next"}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ExitSurveyLayout
