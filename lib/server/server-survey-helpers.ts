import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

const getServerSupabase = () => {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        }
      }
    }
  )
}

export const getServerSurveyResponse = async (userId: string) => {
  const supabase = getServerSupabase()
  const { data: surveyResponse, error } = await supabase
    .from("survey_responses")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  if (error) throw error
  return surveyResponse
}

export const getServerTestScores = async (surveyId: string) => {
  const supabase = getServerSupabase()
  const { data: testScores, error } = await supabase
    .from("test_scores")
    .select("*")
    .eq("survey_id", surveyId)

  if (error) throw error
  return testScores
}

export const getServerCollegeApplications = async (surveyId: string) => {
  const supabase = getServerSupabase()
  const { data: applications, error } = await supabase
    .from("college_applications")
    .select("*")
    .eq("survey_id", surveyId)

  if (error) throw error
  return applications
}

export const getServerImpactFactors = async (surveyId: string) => {
  const supabase = getServerSupabase()
  const { data: factors, error } = await supabase
    .from("impact_factors")
    .select("*")
    .eq("survey_id", surveyId)

  if (error) throw error
  return factors
}

export const getServerChallenges = async (surveyId: string) => {
  const supabase = getServerSupabase()
  const { data: challenges, error } = await supabase
    .from("application_challenges")
    .select("*")
    .eq("survey_id", surveyId)

  if (error) throw error
  return challenges
}

export const getServerOutcomeFactors = async (surveyId: string) => {
  const supabase = getServerSupabase()
  const { data: factors, error } = await supabase
    .from("application_outcome_factors")
    .select("*")
    .eq("survey_id", surveyId)

  if (error) throw error
  return factors
}

export const upsertServerReport = async (report: {
  user_id: string
  survey_report?: string | null
  chat_report?: string | null
}) => {
  const supabase = getServerSupabase()
  const { data, error } = await supabase
    .from("reports")
    .upsert(
      {
        user_id: report.user_id,
        survey_report: report.survey_report,
        chat_report: report.chat_report
      },
      {
        onConflict: "user_id",
        ignoreDuplicates: false
      }
    )
    .select()
    .single()

  if (error) throw error
  return data
}
