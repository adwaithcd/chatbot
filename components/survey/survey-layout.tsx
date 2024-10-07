"use client"
import React, { useContext, useEffect, useState } from "react"
import { ChatbotUIContext } from "@/context/context"
import { SIDEBAR_WIDTH } from "@/components/ui/dashboard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  updateSurveyResponseStep,
  getOrCreateSurveyResponse,
  updateSurveyResponse,
  getTestScores,
  addOrUpdateTestScore
} from "@/db/survey-responses"
import { cn } from "@/lib/utils"
import Loading from "@/app/[locale]/loading"

const steps = [
  { id: 1, name: "Your Background" },
  { id: 2, name: "Test Scores" },
  { id: 3, name: "Application history" },
  { id: 4, name: "Impact factors" },
  { id: 5, name: "Challenges" }
]

interface TestScore {
  id: string
  test_name: string
  test_score: number | null
  isChecked: boolean
}

interface TestScoresFormProps {
  testScores: TestScore[]
  setTestScores: React.Dispatch<React.SetStateAction<TestScore[]>>
}

const SurveyLayout = () => {
  const { profile } = useContext(ChatbotUIContext)
  const [isLoading, setIsLoading] = useState(true)
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({})
  const [surveyId, setSurveyId] = useState("")
  const [testScores, setTestScores] = useState<TestScore[]>([
    { id: "1", test_name: "ACT", test_score: 0, isChecked: false },
    { id: "2", test_name: "SAT", test_score: 0, isChecked: false },
    { id: "3", test_name: "AP", test_score: 0, isChecked: false },
    { id: "4", test_name: "IB", test_score: 0, isChecked: false }
  ])

  // useEffect(() => {
  //   const fetchSurveyResponse = async () => {
  //     if (profile) {
  //       setIsLoading(true);
  //       try {
  //         const surveyResponse = await getOrCreateSurveyResponse(profile.user_id);
  //         setFormData(surveyResponse);
  //         setSurveyId(surveyResponse.survey_id);
  //         setCurrentStep(surveyResponse.step_completed + 1);

  //         // Fetch test scores
  //         const scores = await getTestScores(surveyResponse.survey_id);

  //         setTestScores(testScores.map(score => {
  //           const existingScore = scores.find(s => s.test_name === score.test_name);
  //           return existingScore
  //             ? { ...score, test_score: existingScore.test_score, isChecked: true }
  //             : score;
  //         }).concat(
  //           scores.filter(s => !testScores.some(ps => ps.test_name === s.test_name))
  //             .map(s => ({
  //               id: s.survey_id,
  //               test_name: s.test_name,
  //               test_score: s.test_score,
  //               isChecked: true
  //             }))
  //         ));
  //         console.log("scores set");
  //         console.log(testScores)
  //       } catch (error) {
  //         console.error("Error fetching survey data:", error);
  //       } finally {
  //         setIsLoading(false);
  //       }
  //     }
  //   };
  //   fetchSurveyResponse();
  // }, [profile]);

  useEffect(() => {
    const fetchSurveyResponse = async () => {
      if (profile) {
        setIsLoading(true)
        try {
          const surveyResponse = await getOrCreateSurveyResponse(
            profile.user_id
          )
          setFormData(surveyResponse)
          setSurveyId(surveyResponse.survey_id)
          setCurrentStep(surveyResponse.step_completed + 1)
        } catch (error) {
          console.error("Error fetching survey data:", error)
        } finally {
          setIsLoading(false)
        }
      }
    }
    fetchSurveyResponse()
  }, [profile])

  useEffect(() => {
    const fetchTestScores = async () => {
      if (surveyId) {
        try {
          const scores = await getTestScores(surveyId)

          setTestScores(prevTestScores =>
            prevTestScores
              .map(score => {
                const existingScore = scores.find(
                  s => s.test_name === score.test_name
                )
                return existingScore
                  ? {
                      ...score,
                      test_score: existingScore.test_score,
                      isChecked: true
                    }
                  : score
              })
              .concat(
                scores
                  .filter(
                    s =>
                      !prevTestScores.some(ps => ps.test_name === s.test_name)
                  )
                  .map(s => ({
                    id: s.survey_id,
                    test_name: s.test_name,
                    test_score: s.test_score,
                    isChecked: true
                  }))
              )
          )
          console.log("Test scores updated:", testScores)
        } catch (error) {
          console.error("Error fetching test scores:", error)
        }
      }
    }
    fetchTestScores()
  }, [surveyId])

  const handleInputChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleNextStep = async () => {
    if (surveyId && isStepComplete()) {
      try {
        switch (currentStep) {
          case 1:
            await updateSurveyResponse(surveyId, formData)
            break
          case 2:
            for (const score of testScores) {
              if (score.isChecked && score.test_score) {
                await addOrUpdateTestScore(surveyId, {
                  test_name: score.test_name,
                  test_score: score.test_score,
                  survey_id: surveyId
                })
              }
            }
            break
          case 3:
            // await addOrUpdateCollegeApplication(surveyId, formData);
            break
          case 4:
            // await updateImpactFactors(surveyId, formData.impact_factors);
            break
          case 5:
            // await updateChallenges(surveyId, formData.challenges);
            break
        }
        await updateSurveyResponseStep(surveyId, currentStep, {})
        setCurrentStep(currentStep + 1)
      } catch (error) {
        console.error("Error updating survey data:", error)
      }
    }
  }

  const isStepComplete = () => {
    switch (currentStep) {
      case 1:
        return (
          formData.application_year &&
          formData.city &&
          formData.state &&
          formData.high_school_name &&
          formData.high_school_gpa &&
          formData.max_gpa
        )
      // Implement checks for other steps
      default:
        return true
    }
  }

  const renderStepContent = () => {
    if (isLoading) {
      return <Loading />
    }
    switch (currentStep) {
      case 1:
        return (
          <BackgroundForm
            formData={formData}
            handleInputChange={handleInputChange}
          />
        )
      case 2:
        console.log("sending test scores")
        console.log(testScores)

        return (
          <TestScoresForm
            testScores={testScores}
            setTestScores={setTestScores}
          />
        )
      // return <></>
      case 3:
        return (
          <ApplicationHistoryForm
            formData={formData}
            handleInputChange={handleInputChange}
          />
        )
      case 4:
        return (
          <ImpactFactorsForm
            formData={formData}
            handleInputChange={handleInputChange}
          />
        )
      case 5:
        return (
          <ChallengesForm
            formData={formData}
            handleInputChange={handleInputChange}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="flex size-full">
      <div
        className="flex h-full flex-col"
        style={{
          minWidth: `${SIDEBAR_WIDTH}px`,
          maxWidth: `${SIDEBAR_WIDTH}px`,
          width: `${SIDEBAR_WIDTH}px`
        }}
      >
        <h2 className="mb-4 py-10 pl-12 pr-4 text-2xl font-semibold">
          Part One: Entry Survey
        </h2>
        <ul className="space-y-2">
          {steps.map(step => (
            <li
              key={step.id}
              className={cn(
                "cursor-pointer p-3 pr-10 text-right",
                currentStep === step.id && "bg-muted/50 font-bold"
              )}
              onClick={() => setCurrentStep(step.id)}
            >
              {step.name}
            </li>
          ))}
        </ul>
      </div>
      <div className="bg-muted/50 relative flex size-full flex-col items-center p-8">
        {/* <h1 className="mb-10 text-2xl font-bold">
          Step {currentStep}: {steps[currentStep - 1]?.name}
        </h1> */}
        {renderStepContent()}
        <Button
          className="absolute bottom-8 right-8"
          onClick={handleNextStep}
          disabled={!isStepComplete()}
        >
          Next
        </Button>
      </div>
    </div>
  )
}

const BackgroundForm = ({ formData, handleInputChange }) => {
  return (
    <form className="w-full max-w-2xl space-y-8">
      <div className="flex items-center pb-4">
        <Label htmlFor="application_year" className="text-base font-semibold">
          1. Which year did you apply to college?
        </Label>
        <div className="ml-6 shrink-0">
          <Input
            type="number"
            id="application_year"
            name="application_year"
            placeholder="YYYY"
            value={formData.application_year || ""}
            onChange={handleInputChange}
            className="w-32"
          />
        </div>
      </div>
      <div className="space-y-4 pb-4">
        <Label className="text-base font-semibold">
          2. Where did you apply from?
        </Label>
        <div className="grid grid-cols-2 gap-4">
          <Input
            type="text"
            placeholder="City"
            name="city"
            value={formData.city || ""}
            onChange={handleInputChange}
          />
          <Input
            type="text"
            placeholder="State/Province"
            name="state"
            value={formData.state || ""}
            onChange={handleInputChange}
          />
          <Input
            type="text"
            placeholder="Zipcode"
            name="zipcode"
            value={formData.zipcode || ""}
            onChange={handleInputChange}
          />
          <Input
            type="text"
            placeholder="Country if non-US"
            name="country"
            value={formData.country || ""}
            onChange={handleInputChange}
          />
        </div>
      </div>
      <div className="space-y-2 pb-4">
        <Label htmlFor="high_school_name" className="text-base font-semibold">
          3. What is the name of your most recent secondary/high school?
        </Label>
        <Input
          type="text"
          id="high_school_name"
          name="high_school_name"
          value={formData.high_school_name || ""}
          onChange={handleInputChange}
          className="max-w-md"
        />
      </div>
      <div className="flex items-center pb-4">
        <Label className="text-base font-semibold">
          4. What is your secondary/high school GPA?
        </Label>
        <div className="ml-6 flex shrink-0 items-center space-x-2">
          <Input
            type="text"
            className="w-20"
            placeholder="3.0"
            name="high_school_gpa"
            value={formData.high_school_gpa || ""}
            onChange={handleInputChange}
          />
          <span>out of</span>
          <Input
            type="text"
            className="w-20"
            placeholder="4.0"
            name="max_gpa"
            value={formData.max_gpa || ""}
            onChange={handleInputChange}
          />
        </div>
      </div>
    </form>
  )
}

const TestScoresForm: React.FC<TestScoresFormProps> = ({
  testScores,
  setTestScores
}) => {
  console.log("inside test")
  console.log(testScores)
  const handleScoreChange = (id: string, newScore: number) => {
    setTestScores(prev =>
      prev.map(score =>
        score.id === id ? { ...score, test_score: newScore } : score
      )
    )
  }

  const handleCheckChange = (id: string, isChecked: boolean) => {
    setTestScores(prev =>
      prev.map(score => (score.id === id ? { ...score, isChecked } : score))
    )
  }

  const handleAddNewTest = () => {
    setTestScores(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        test_name: "",
        test_score: 0,
        isChecked: true
      }
    ])
  }

  return (
    <form className="w-full max-w-2xl space-y-8">
      <div className="space-y-4">
        <Label className="text-base font-semibold">
          Enter your test scores:
        </Label>
        <Label className="text-base font-semibold">
          5. Did you take any of the following standardized tests?
        </Label>

        {testScores.map(score => (
          <div key={score.id} className="flex items-center space-x-4">
            <input
              type="checkbox"
              checked={score.isChecked}
              onChange={e => handleCheckChange(score.id, e.target.checked)}
            />
            <Input
              type="text"
              placeholder={score.test_name || "Test Name"}
              value={score.test_name}
              onChange={e =>
                setTestScores(prev =>
                  prev.map(s =>
                    s.id === score.id ? { ...s, name: e.target.value } : s
                  )
                )
              }
              disabled={!score.isChecked}
            />
            <Input
              type="text"
              placeholder="Score"
              value={score.test_score ?? ""}
              onChange={e =>
                handleScoreChange(score.id, Number(e.target.value))
              }
              disabled={!score.isChecked}
            />
          </div>
        ))}
        <Button type="button" onClick={handleAddNewTest}>
          Add a new test
        </Button>
      </div>
    </form>
  )
}

const ApplicationHistoryForm = ({ formData, handleInputChange }) => {
  return (
    <form className="w-full max-w-2xl space-y-8">
      <div className="space-y-4">
        <Label className="text-base font-semibold">
          Enter a college application:
        </Label>
        <div className="grid grid-cols-2 gap-4">
          <Input
            type="text"
            placeholder="College Name"
            name="college_name"
            value={formData.college_name || ""}
            onChange={handleInputChange}
          />
          <Input
            type="text"
            placeholder="Major"
            name="major"
            value={formData.major || ""}
            onChange={handleInputChange}
          />
          <Input
            type="text"
            placeholder="Application Status"
            name="offer_status"
            value={formData.offer_status || ""}
            onChange={handleInputChange}
          />
        </div>
      </div>
    </form>
  )
}

const ImpactFactorsForm = ({ formData, handleInputChange }) => {
  return (
    <form className="w-full max-w-2xl space-y-8">
      <div className="space-y-4">
        <Label className="text-base font-semibold">
          Describe the factors that had the most impact on your college
          applications:
        </Label>
        <textarea
          className="h-32 w-full rounded border p-2"
          name="impact_factors"
          value={formData.impact_factors || ""}
          onChange={handleInputChange}
          placeholder="Describe impact factors..."
        />
      </div>
    </form>
  )
}

const ChallengesForm = ({ formData, handleInputChange }) => {
  return (
    <form className="w-full max-w-2xl space-y-8">
      <div className="space-y-4">
        <Label className="text-base font-semibold">
          Describe any challenges you faced during the application process:
        </Label>
        <textarea
          className="h-32 w-full rounded border p-2"
          name="challenges"
          value={formData.challenges || ""}
          onChange={handleInputChange}
          placeholder="Describe challenges..."
        />
      </div>
    </form>
  )
}

export default SurveyLayout
