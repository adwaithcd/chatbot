"use client"
import React, { useContext, useEffect, useState } from "react"
import { ChatbotUIContext } from "@/context/context"
import { SIDEBAR_WIDTH } from "@/components/ui/dashboard"
import { Button } from "@/components/ui/button"
import {
  updateSurveyResponseStep,
  getTestScores,
  addOrUpdateTestScore,
  getSurveyResponseByUserId,
  upsertSurveyResponse,
  deleteTestScore,
  getCollegeApplications,
  addOrUpdateCollegeApplication,
  addOrUpdateImpactFactor,
  getImpactFactors,
  getApplicationChallenges,
  getApplicationOutcomeFactors,
  addOrUpdateChallenge,
  addOrUpdateOutcomeFactor,
  deleteChallenge,
  deleteOutcomeFactor
} from "@/db/survey-responses"
import { cn } from "@/lib/utils"
import Loading from "@/app/[locale]/loading"
import { v4 as uuidv4 } from "uuid"
import {
  ApplicationChallenge,
  ApplicationOutcomeFactor,
  CollegeApplications,
  ImpactFactors,
  SurveyForm,
  TestScore
} from "./surveyTypes"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import BackgroundForm from "./steps/background-form"
import TestScoresForm from "./steps/test-score-form"
import ApplicationHistoryForm from "./steps/application-history-form"
import ImpactFactorsForm from "./steps/impact-factors-form"
import ChallengesForm from "./steps/application-challenges-form"
import { supabase } from "@/lib/supabase/browser-client"
import { useRouter } from "next/navigation"

const steps = [
  { id: 1, name: "Your Background" },
  { id: 2, name: "Test Scores" },
  { id: 3, name: "Application history" },
  { id: 4, name: "Impact factors" },
  { id: 5, name: "Challenges" }
]

const DEFAULT_TESTS = ["ACT", "SAT", "AP", "IB"]

const DEFAULT_IMPACT_FACTORS: ImpactFactors[] = [
  {
    impact_factor_id: uuidv4(),
    impact_factor: "Academic Programs",
    is_important: null,
    rank: null,
    user_added_factor: false
  },
  {
    impact_factor_id: uuidv4(),
    impact_factor: "Campus Culture",
    is_important: null,
    rank: null,
    user_added_factor: false
  },
  {
    impact_factor_id: uuidv4(),
    impact_factor: "Location",
    is_important: null,
    rank: null,
    user_added_factor: false
  },
  {
    impact_factor_id: uuidv4(),
    impact_factor: "Admission Probability",
    is_important: null,
    rank: null,
    user_added_factor: false
  },
  {
    impact_factor_id: uuidv4(),
    impact_factor: "Cost and Financial Aid",
    is_important: null,
    rank: null,
    user_added_factor: false
  },
  {
    impact_factor_id: uuidv4(),
    impact_factor: "Extracurricular Activities",
    is_important: null,
    rank: null,
    user_added_factor: false
  },
  {
    impact_factor_id: uuidv4(),
    impact_factor: "Career Opportunities and Job placement",
    is_important: null,
    rank: null,
    user_added_factor: false
  }
]

const DEFAULT_CHALLENGES: ApplicationChallenge[] = [
  {
    challenge_id: uuidv4(),
    challenge: "Understanding the application requirements",
    isChecked: false
  },
  {
    challenge_id: uuidv4(),
    challenge: "Choosing the right college",
    isChecked: false
  },
  {
    challenge_id: uuidv4(),
    challenge: "Choosing the right major/program",
    isChecked: false
  },
  {
    challenge_id: uuidv4(),
    challenge: "Financial aid and scholarships",
    isChecked: false
  },
  {
    challenge_id: uuidv4(),
    challenge: "Meeting deadlines",
    isChecked: false
  },
  {
    challenge_id: uuidv4(),
    challenge: "Writing personal statements/essays",
    isChecked: false
  }
]

const DEFAULT_FACTORS: ApplicationOutcomeFactor[] = [
  {
    factor_id: uuidv4(),
    factor: "Academic performance (GPA)",
    isChecked: false
  },
  {
    factor_id: uuidv4(),
    factor: "Standardized test scores",
    isChecked: false
  },
  {
    factor_id: uuidv4(),
    factor: "Extracurricular activities",
    isChecked: false
  },
  {
    factor_id: uuidv4(),
    factor: "Personal statements/essays",
    isChecked: false
  },
  {
    factor_id: uuidv4(),
    factor: "Letters of recommendation",
    isChecked: false
  },
  {
    factor_id: uuidv4(),
    factor: "Interview performance",
    isChecked: false
  }
]

const SurveyLayout = () => {
  const { profile } = useContext(ChatbotUIContext)
  const [isLoading, setIsLoading] = useState(true)
  const [currentStep, setCurrentStep] = useState(1)
  const [stepCompleted, setStepCompleted] = useState(0)
  const [isDirty, setIsDirty] = useState(false)
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false)
  const [pendingStepNavigation, setPendingStepNavigation] = useState<
    number | null
  >(null)
  const [originalState, setOriginalState] = useState({
    surveyFormData: {} as SurveyForm,
    testScores: [] as TestScore[],
    applications: [] as CollegeApplications[],
    impactFactors: [] as ImpactFactors[],
    challenges: [] as ApplicationChallenge[],
    factors: [] as ApplicationOutcomeFactor[]
  })
  const router = useRouter()

  const [surveyFormData, setSurveyFormData] = useState<SurveyForm>({
    survey_id: uuidv4(),
    user_id: profile?.user_id || "",
    application_year: null,
    city: null,
    state: null,
    high_school_name: null,
    high_school_gpa: null,
    max_gpa: null,
    zipcode: null,
    country: null,
    current_enrolled_program: null,
    reason_for_choosing_asu: null,
    financial_support_details: null
  })
  const [surveyId, setSurveyId] = useState("")
  const [testScores, setTestScores] = useState<TestScore[]>([])
  const [applications, setApplications] = useState<CollegeApplications[]>([])
  const [impactFactors, setImpactFactors] = useState<ImpactFactors[]>([])

  const [challenges, setChallenges] = useState<ApplicationChallenge[]>([
    ...DEFAULT_CHALLENGES
  ])
  const [factors, setFactors] = useState<ApplicationOutcomeFactor[]>([
    ...DEFAULT_FACTORS
  ])

  useEffect(() => {
    const fetchSurveyResponse = async () => {
      if (profile) {
        setIsLoading(true)
        try {
          const surveyResponse = await getSurveyResponseByUserId(
            profile.user_id
          )

          if (surveyResponse && surveyResponse.step_completed === 5) {
            // Get workspace info for redirection post survey completion
            const { data: homeWorkspace, error } = await supabase
              .from("workspaces")
              .select("*")
              .eq("user_id", profile.user_id)
              .eq("is_home", true)
              .single()

            if (!homeWorkspace) {
              throw new Error(error?.message || "Unable to find home workspace")
            }

            // Navigate to workspace
            router.push(`/${homeWorkspace.id}/chat`)
            return
          }

          if (surveyResponse) {
            setSurveyFormData({
              survey_id: surveyResponse.survey_id,
              user_id: profile.user_id,
              application_year: surveyResponse.application_year,
              city: surveyResponse.city,
              state: surveyResponse.state,
              high_school_name: surveyResponse.high_school_name,
              high_school_gpa: surveyResponse.high_school_gpa,
              max_gpa: surveyResponse.max_gpa,
              zipcode: surveyResponse.zipcode,
              country: surveyResponse.country,
              current_enrolled_program: surveyResponse.current_enrolled_program,
              reason_for_choosing_asu: surveyResponse.reason_for_choosing_asu,
              financial_support_details:
                surveyResponse.financial_support_details
            })
            setSurveyId(surveyResponse.survey_id)
            setStepCompleted(surveyResponse.step_completed)
            setCurrentStep(surveyResponse.step_completed + 1)

            //get data for other forms if they are done
            if (surveyResponse.step_completed >= 1) {
              const scores = await getTestScores(surveyResponse.survey_id)
              const formattedScores = scores.map(score => ({
                score_id: score.score_id,
                test_name: score.test_name,
                test_score: score.test_score,
                isChecked: score.test_score !== null,
                isUserAdded: false
              }))

              // Set both the current test scores and original state
              setTestScores(formattedScores)
              setOriginalState(prev => ({
                ...prev,
                testScores: formattedScores
              }))
            }

            if (surveyResponse.step_completed >= 2) {
              const applications = await getCollegeApplications(
                surveyResponse.survey_id
              )
              let updatedApplications
              if (applications.length > 0) {
                updatedApplications = applications.map(application => ({
                  application_id: application.application_id,
                  college_name: application.college_name,
                  major: application.major,
                  offer_status: application.offer_status,
                  isSaved: true
                }))
              } else {
                updatedApplications = [
                  {
                    application_id: uuidv4(),
                    college_name: "",
                    major: "",
                    offer_status: "Offer received",
                    isSaved: false
                  }
                ]
              }
              setApplications(updatedApplications)
              // Update original state with the loaded applications
              setOriginalState(prev => ({
                ...prev,
                applications: updatedApplications,
                // Also update surveyFormData in original state
                surveyFormData: {
                  ...surveyFormData,
                  current_enrolled_program:
                    surveyResponse.current_enrolled_program,
                  reason_for_choosing_asu:
                    surveyResponse.reason_for_choosing_asu
                }
              }))
            }

            if (surveyResponse.step_completed >= 3) {
              try {
                const savedFactors = await getImpactFactors(
                  surveyResponse.survey_id
                )
                let updatedFactors

                if (savedFactors && savedFactors.length > 0) {
                  updatedFactors = savedFactors.map(factor => ({
                    ...factor,
                    user_added_factor: false
                  }))
                } else {
                  updatedFactors = DEFAULT_IMPACT_FACTORS
                }

                setImpactFactors(updatedFactors)
                setOriginalState(prev => ({
                  ...prev,
                  impactFactors: updatedFactors
                }))
              } catch (error) {
                console.error("Error fetching impact factors:", error)
                setImpactFactors(DEFAULT_IMPACT_FACTORS)
              }
            } else {
              // Not at step 4 yet, use defaults
              setImpactFactors(DEFAULT_IMPACT_FACTORS)
              setOriginalState(prev => ({
                ...prev,
                impactFactors: DEFAULT_IMPACT_FACTORS
              }))
            }

            if (surveyResponse.step_completed >= 4) {
              const savedChallenges = await getApplicationChallenges(
                surveyResponse.survey_id
              )
              const savedFactors = await getApplicationOutcomeFactors(
                surveyResponse.survey_id
              )

              // Update challenges
              setChallenges(prev => {
                // Start with default challenges, but update their IDs if they exist in DB
                const updatedChallenges = DEFAULT_CHALLENGES.map(
                  defaultChallenge => {
                    const savedChallenge = savedChallenges.find(
                      sc => sc.challenge === defaultChallenge.challenge
                    )

                    return {
                      challenge_id:
                        savedChallenge?.challenge_id ||
                        defaultChallenge.challenge_id,
                      challenge: defaultChallenge.challenge,
                      isChecked: savedChallenge ? true : false
                    }
                  }
                )

                // Add any additional custom challenges from DB
                const customChallenges = savedChallenges
                  .filter(
                    sc =>
                      !DEFAULT_CHALLENGES.some(
                        dc => dc.challenge === sc.challenge
                      )
                  )
                  .map(sc => ({
                    challenge_id: sc.challenge_id,
                    challenge: sc.challenge,
                    isChecked: true
                  }))

                return [...updatedChallenges, ...customChallenges]
              })

              // Update factors
              setFactors(prev => {
                // Start with default factors, but update their IDs if they exist in DB
                const updatedFactors = DEFAULT_FACTORS.map(defaultFactor => {
                  const savedFactor = savedFactors.find(
                    sf => sf.factor === defaultFactor.factor
                  )

                  return {
                    factor_id:
                      savedFactor?.factor_id || defaultFactor.factor_id,
                    factor: defaultFactor.factor,
                    isChecked: savedFactor ? true : false
                  }
                })

                // Add any additional custom factors from DB
                const customFactors = savedFactors
                  .filter(
                    sf => !DEFAULT_FACTORS.some(df => df.factor === sf.factor)
                  )
                  .map(sf => ({
                    factor_id: sf.factor_id,
                    factor: sf.factor,
                    isChecked: true
                  }))

                return [...updatedFactors, ...customFactors]
              })
            }
          } else {
            setSurveyId(surveyFormData.survey_id)
            setSurveyFormData(prevData => ({
              ...prevData,
              user_id: profile.user_id
            }))
            setImpactFactors(DEFAULT_IMPACT_FACTORS)
          }
        } catch (error) {
          console.error("Error fetching survey data:", error)
        } finally {
          setIsLoading(false)
        }
      }
    }
    fetchSurveyResponse()
  }, [profile])

  //dirty data use effect
  useEffect(() => {
    const isDataDirty = () => {
      switch (currentStep) {
        case 1:
          return (
            JSON.stringify(surveyFormData) !==
            JSON.stringify(originalState.surveyFormData)
          )
        case 2:
        case 2:
          // Only consider test scores where user has actually entered data
          const hasEnteredScores = testScores.some(
            score => score.isChecked && score.test_score !== null
          )

          const originalHadScores = originalState.testScores.some(
            score => score.isChecked && score.test_score !== null
          )

          // If neither current nor original state has entered scores, not dirty
          if (!hasEnteredScores && !originalHadScores) {
            return false
          }

          // Compare only scores that have actual data
          const activeScores = testScores.filter(
            score => score.isChecked && score.test_score !== null
          )
          const originalActiveScores = originalState.testScores.filter(
            score => score.isChecked && score.test_score !== null
          )

          return (
            JSON.stringify(activeScores) !==
            JSON.stringify(originalActiveScores)
          )
        case 3:
          // Only consider applications that have some data entered
          const hasEnteredApplications = applications.some(
            app =>
              app.college_name.trim() !== "" ||
              app.major?.trim() !== "" ||
              app.offer_status !== "Offer received"
          )

          const originalHadApplications = originalState.applications.some(
            app =>
              app.college_name.trim() !== "" ||
              app.major?.trim() !== "" ||
              app.offer_status !== "Offer received"
          )

          const applicationsChanged =
            hasEnteredApplications !== originalHadApplications ||
            (hasEnteredApplications &&
              JSON.stringify(
                applications.filter(
                  app =>
                    app.college_name.trim() !== "" ||
                    app.major?.trim() !== "" ||
                    app.offer_status !== "Offer received"
                )
              ) !==
                JSON.stringify(
                  originalState.applications.filter(
                    app =>
                      app.college_name.trim() !== "" ||
                      app.major?.trim() !== "" ||
                      app.offer_status !== "Offer received"
                  )
                ))

          const relevantFormDataChanged =
            (surveyFormData.current_enrolled_program?.trim() || "") !==
              (originalState.surveyFormData.current_enrolled_program?.trim() ||
                "") ||
            (surveyFormData.reason_for_choosing_asu?.trim() || "") !==
              (originalState.surveyFormData.reason_for_choosing_asu?.trim() ||
                "")

          return applicationsChanged || relevantFormDataChanged
        case 4:
          // Check if any impact factors have been categorized
          const hasChangedFactors = impactFactors.some(
            factor =>
              factor.is_important !== null ||
              (factor.user_added_factor && factor.impact_factor.trim() !== "")
          )

          const originalHadChangedFactors = originalState.impactFactors.some(
            factor =>
              factor.is_important !== null ||
              (factor.user_added_factor && factor.impact_factor.trim() !== "")
          )

          const impactFactorsChanged =
            hasChangedFactors !== originalHadChangedFactors ||
            (hasChangedFactors &&
              JSON.stringify(
                impactFactors.filter(
                  f =>
                    f.is_important !== null ||
                    (f.user_added_factor && f.impact_factor.trim() !== "")
                )
              ) !==
                JSON.stringify(
                  originalState.impactFactors.filter(
                    f =>
                      f.is_important !== null ||
                      (f.user_added_factor && f.impact_factor.trim() !== "")
                  )
                ))

          // Check if financial support details have changed
          const financialDetailsChanged =
            (surveyFormData.financial_support_details?.trim() || "") !==
            (originalState.surveyFormData.financial_support_details?.trim() ||
              "")

          return impactFactorsChanged || financialDetailsChanged
        case 5:
          return (
            JSON.stringify(challenges) !==
              JSON.stringify(originalState.challenges) ||
            JSON.stringify(factors) !== JSON.stringify(originalState.factors)
          )
        default:
          return false
      }
    }

    setIsDirty(isDataDirty())
  }, [
    surveyFormData,
    testScores,
    applications,
    impactFactors,
    challenges,
    factors,
    currentStep
  ])

  // useEffect to store original state when step changes
  useEffect(() => {
    setOriginalState({
      surveyFormData,
      testScores,
      applications,
      impactFactors,
      challenges,
      factors
    })
  }, [currentStep])

  const handleNextStep = async () => {
    if (surveyId) {
      try {
        switch (currentStep) {
          case 1:
            await upsertSurveyResponse({
              ...surveyFormData,
              current_enrolled_program:
                surveyFormData.current_enrolled_program ?? null,
              reason_for_choosing_asu:
                surveyFormData.reason_for_choosing_asu ?? null
            })
            await initializeTestScores()
            break
          case 2:
            await updateTestScores()
            await initializeCollegeApplications()
            break
          case 3:
            await updateApplications()
            await upsertSurveyResponse({
              ...surveyFormData,
              current_enrolled_program:
                surveyFormData.current_enrolled_program ?? null,
              reason_for_choosing_asu:
                surveyFormData.reason_for_choosing_asu ?? null
            })
            break
          case 4:
            await upsertSurveyResponse({
              ...surveyFormData,
              financial_support_details:
                surveyFormData.financial_support_details ?? null
            })
            // Handle impact factors
            for (const factor of impactFactors) {
              // Skip user-added factors that weren't categorized
              if (factor.user_added_factor && factor.is_important === null) {
                if (factor.impact_factor_id) {
                  // await deleteImpactFactor(factor.impact_factor_id)
                }
                continue
              }

              // Upsert each impact factor
              await addOrUpdateImpactFactor({
                impact_factor_id: factor.impact_factor_id,
                survey_id: surveyId,
                impact_factor: factor.impact_factor,
                is_important: factor.is_important,
                rank: factor.rank
              })
            }
            break
          case 5:
            await saveChallengesAndFactors()
            await handleSubmitSurvey()
            break
        }
        // Only update stepCompleted if the current step is complete and it's greater than the previous completed step
        if (currentStep > stepCompleted && isStepComplete()) {
          await updateSurveyResponseStep(surveyId, currentStep, {})
          setStepCompleted(currentStep)
        }

        setCurrentStep(currentStep + 1)
      } catch (error) {
        console.error("Error updating survey data:", error)
      }
    }
  }

  const initializeTestScores = async () => {
    const existingScores = await getTestScores(surveyId)
    // Create default test score rows only if no scores exist
    if (existingScores.length === 0) {
      const defaultTestScores: TestScore[] = []
      for (const testName of DEFAULT_TESTS) {
        const newScore = {
          score_id: uuidv4(),
          survey_id: surveyId,
          test_name: testName,
          test_score: null,
          isChecked: false,
          isUserAdded: false
        }
        defaultTestScores.push(newScore)
        await addOrUpdateTestScore({
          score_id: newScore.score_id,
          survey_id: surveyId,
          test_name: testName,
          test_score: null
        })
      }
      setTestScores(defaultTestScores)
      // Update original state with these initialized scores
      setOriginalState(prev => ({
        ...prev,
        testScores: defaultTestScores
      }))
    } else {
      const updatedScores = existingScores.map(score => ({
        ...score,
        isChecked: score.test_score !== null,
        isUserAdded: false
      }))
      setTestScores(updatedScores)
      // Update original state with the existing scores
      setOriginalState(prev => ({
        ...prev,
        testScores: updatedScores
      }))
    }
  }

  const updateTestScores = async () => {
    for (const score of testScores) {
      if (score.isChecked && score.test_score !== null) {
        await addOrUpdateTestScore({
          score_id: score.score_id,
          survey_id: surveyId,
          test_name: score.test_name,
          test_score: score.test_score
        })
      } else if (DEFAULT_TESTS.includes(score.test_name)) {
        await addOrUpdateTestScore({
          score_id: score.score_id,
          survey_id: surveyId,
          test_name: score.test_name,
          test_score: null
        })
      } else {
        await deleteTestScore(score.score_id)
      }
    }
    await updateTestScoresState()
  }

  const updateTestScoresState = async () => {
    const fetchedScores = await getTestScores(surveyId)
    const updatedScores = fetchedScores.map(score => ({
      ...score,
      isChecked: score.test_score !== null,
      isUserAdded: false
    }))
    setTestScores(updatedScores)
  }

  const initializeCollegeApplications = async () => {
    const existingApplications = await getCollegeApplications(
      surveyFormData.survey_id
    )
    if (existingApplications.length > 0) {
      setApplications(
        existingApplications.map(application => ({
          application_id: application.application_id,
          college_name: application.college_name,
          major: application.major,
          offer_status: application.offer_status,
          isSaved: true
        }))
      )
    } else {
      setApplications([
        {
          application_id: uuidv4(),
          college_name: "",
          major: "",
          offer_status: "Offer received",
          isSaved: false
        }
      ])
    }
  }

  const updateApplications = async () => {
    for (const application of applications) {
      console.log("application", application)
      const { isSaved, ...applicationToUpdate } = application
      try {
        await addOrUpdateCollegeApplication({
          ...applicationToUpdate,
          survey_id: surveyFormData.survey_id
        })
      } catch (error) {
        console.error(
          `Error updating application ${application.application_id}:`,
          error
        )
      }
    }

    // After all updates, mark all applications as saved in the state
    setApplications(applications.map(app => ({ ...app, isSaved: true })))
  }

  const saveChallengesAndFactors = async () => {
    try {
      // Handle challenges, if unchecked, delete from DB
      for (const challenge of challenges) {
        if (challenge.isChecked) {
          await addOrUpdateChallenge({
            challenge_id: challenge.challenge_id,
            survey_id: surveyId,
            challenge: challenge.challenge
          })
        } else {
          await deleteChallenge(challenge.challenge_id)
        }
      }

      // Handle factors
      for (const factor of factors) {
        if (factor.isChecked) {
          await addOrUpdateOutcomeFactor({
            factor_id: factor.factor_id,
            survey_id: surveyId,
            factor: factor.factor
          })
        } else {
          await deleteOutcomeFactor(factor.factor_id)
        }
      }
    } catch (error) {
      console.error("Error updating challenges and factors:", error)
    }
  }

  const handleSubmitSurvey = async () => {
    try {
      //update completed step to 5
      await updateSurveyResponseStep(surveyId, 5, {})

      //updating to 6 to show completion message
      setCurrentStep(6)
    } catch (error) {
      console.error("Error submitting survey:", error)
    }
  }

  const handleNavigateToChat = async () => {
    try {
      const { data: homeWorkspace, error } = await supabase
        .from("workspaces")
        .select("*")
        .eq("user_id", profile?.user_id || "")
        .eq("is_home", true)
        .single()

      if (!homeWorkspace) {
        throw new Error(error?.message || "Unable to find home workspace")
      }

      router.push(`/${homeWorkspace.id}/chat`)
    } catch (error) {
      console.error("Error navigating to chat:", error)
    }
  }

  const isStepComplete = () => {
    switch (currentStep) {
      case 1:
        return (
          surveyFormData.application_year &&
          surveyFormData.city &&
          surveyFormData.state &&
          surveyFormData.high_school_name &&
          surveyFormData.high_school_gpa &&
          surveyFormData.max_gpa
        )
      case 2:
        return testScores.every(
          score =>
            !score.isChecked ||
            (score.isChecked &&
              score.test_score !== null &&
              score.test_name !== "")
        )
      case 3:
        return (
          applications.length > 0 &&
          applications.every(
            application =>
              application.college_name.trim() !== "" &&
              application.offer_status !== "" &&
              application.major !== ""
          ) &&
          surveyFormData.current_enrolled_program &&
          surveyFormData.current_enrolled_program.trim() !== "" &&
          surveyFormData.reason_for_choosing_asu &&
          surveyFormData.reason_for_choosing_asu.trim() !== ""
        )
      case 4:
        const hasFinancialDetails =
          surveyFormData.financial_support_details &&
          surveyFormData.financial_support_details.trim() !== ""

        // Check if all factors have been categorized
        const allDefaultFactorsCategorized = impactFactors.every(
          factor => factor.is_important !== null
        )
        return hasFinancialDetails && allDefaultFactorsCategorized
      case 5:
        return (
          challenges.every(
            challenge =>
              !challenge.isChecked ||
              (challenge.isChecked && challenge.challenge.trim() !== "")
          ) &&
          factors.every(
            factor =>
              !factor.isChecked ||
              (factor.isChecked && factor.factor.trim() !== "")
          )
        )
      default:
        return true
    }
  }

  const renderCompletionMessage = () => (
    <div className="bg-background flex h-screen w-full items-center justify-center">
      <div className="flex flex-col items-center space-y-6">
        <p className="text-lg">We have saved your responses</p>
        <Button onClick={handleNavigateToChat}>Go to Chat</Button>
      </div>
    </div>
  )

  const renderStepContent = () => {
    if (isLoading) {
      return <Loading />
    }
    switch (currentStep) {
      case 1:
        return (
          <BackgroundForm
            formData={surveyFormData}
            setFormData={setSurveyFormData}
          />
        )
      case 2:
        return (
          <TestScoresForm
            testScores={testScores}
            setTestScores={setTestScores}
          />
        )
      case 3:
        return (
          <ApplicationHistoryForm
            applications={applications}
            setApplications={setApplications}
            surveyFormData={surveyFormData}
            setSurveyFormData={setSurveyFormData}
          />
        )
      case 4:
        return (
          <ImpactFactorsForm
            surveyFormData={surveyFormData}
            setSurveyFormData={setSurveyFormData}
            impactFactors={impactFactors}
            setImpactFactors={setImpactFactors}
          />
        )
      case 5:
        return (
          <ChallengesForm
            challenges={challenges}
            setChallenges={setChallenges}
            factors={factors}
            setFactors={setFactors}
            defaultChallenges={DEFAULT_CHALLENGES}
            defaultFactors={DEFAULT_FACTORS}
          />
        )
      default:
        return null
    }
  }

  const handleStepClick = (stepId: number) => {
    if (stepId <= stepCompleted + 1 && currentStep !== 6) {
      if (stepId !== currentStep) {
        if (isDirty) {
          setShowUnsavedDialog(true)
          setPendingStepNavigation(stepId)
        } else {
          setCurrentStep(stepId)
        }
      }
    }
  }

  const handleSaveAndNavigate = async () => {
    console.log("save and navigate")
    await handleNextStep()
    setShowUnsavedDialog(false)
    if (pendingStepNavigation !== null) {
      setCurrentStep(pendingStepNavigation)
      setPendingStepNavigation(null)
    }
  }

  const handleDiscard = () => {
    // Reset state to original values
    switch (currentStep) {
      case 1:
        setSurveyFormData(originalState.surveyFormData)
        break
      case 2:
        setTestScores(originalState.testScores)
        break
      case 3:
      case 3:
        // If original state had no applications with data, reset to a single empty row
        const hadApplications = originalState.applications.some(
          app =>
            app.college_name.trim() !== "" ||
            app.major?.trim() !== "" ||
            app.offer_status !== "Offer received"
        )

        if (!hadApplications) {
          setApplications([
            {
              application_id: uuidv4(),
              college_name: "",
              major: "",
              offer_status: "Offer received",
              isSaved: false
            }
          ])
        } else {
          setApplications(originalState.applications)
        }
        setSurveyFormData(originalState.surveyFormData)
        break
      case 4:
        setImpactFactors(originalState.impactFactors)
        setSurveyFormData(originalState.surveyFormData)
        break
      case 5:
        setChallenges(originalState.challenges)
        setFactors(originalState.factors)
        break
    }

    setShowUnsavedDialog(false)
    if (pendingStepNavigation !== null) {
      setCurrentStep(pendingStepNavigation)
      setPendingStepNavigation(null)
    }
  }

  // Add browser navigation/closing handler
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = ""
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [isDirty])

  // If we're on step 6 (completion), render only the completion message
  if (currentStep === 6) {
    return renderCompletionMessage()
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
          Part One: Entry Survey
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
      {/* <div className="bg-muted/50 relative flex size-full flex-col items-center overflow-y-auto p-8">
        {renderStepContent()}
        <Button
          className="absolute bottom-8 right-8"
          onClick={handleNextStep}
          disabled={!isStepComplete()}
        >
          {currentStep === 5 ? "Submit" : "Next"}
        </Button>
      </div> */}
      <div className="bg-muted/50 relative h-full flex-1">
        <div className="flex h-full flex-col items-center overflow-y-auto p-8 pb-24">
          {renderStepContent()}
        </div>
        <div className="fixed bottom-8 right-8">
          <Button onClick={handleNextStep} disabled={!isStepComplete()}>
            {currentStep === 5 ? "Submit" : "Next"}
          </Button>
        </div>
      </div>
      <Dialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Unsaved Changes</DialogTitle>
          </DialogHeader>
          <div className="mt-2">
            <p className="text-sm text-gray-500">
              You have unsaved changes. Would you like to save them before
              proceeding?
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowUnsavedDialog(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDiscard}>
              Discard
            </Button>
            <Button onClick={handleSaveAndNavigate}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default SurveyLayout
