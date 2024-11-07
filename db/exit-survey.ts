import { supabase } from "@/lib/supabase/browser-client"
import { TablesInsert, TablesUpdate } from "@/supabase/types"

export const getExitSurveyResponseById = async (exitSurveyId: string) => {
  const { data: exitSurveyResponse, error } = await supabase
    .from("exit_survey_responses")
    .select("*")
    .eq("exit_survey_id", exitSurveyId)
    .single()

  if (error) throw error
  return exitSurveyResponse
}

export const getExitSurveyResponseByUserId = async (userId: string) => {
  const { data: exitSurveyResponses, error } = await supabase
    .from("exit_survey_responses")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)

  if (error) throw error
  return exitSurveyResponses[0] || null
}

export const upsertExitSurveyResponse = async (
  ExitSurveyData: TablesInsert<"exit_survey_responses">
) => {
  const { data: exitSurveyResponse, error } = await supabase
    .from("exit_survey_responses")
    .upsert(ExitSurveyData)
    .select("*")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return exitSurveyResponse
}

export const updateExitSurveyStep = async (
  exitSurveyId: string,
  step: number
) => {
  const { data: updatedExitSurveyResponse, error } = await supabase
    .from("exit_survey_responses")
    .update({ step_completed: step })
    .eq("exit_survey_id", exitSurveyId)
    .select("*")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return updatedExitSurveyResponse
}
