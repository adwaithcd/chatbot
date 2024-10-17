import { supabase } from "@/lib/supabase/browser-client"
import { TablesInsert, TablesUpdate } from "@/supabase/types"

export const getSurveyResponseById = async (surveyId: string) => {
  const { data: surveyResponse } = await supabase
    .from("survey_responses")
    .select("*")
    .eq("survey_id", surveyId)
    .single()

  return surveyResponse
}

export const getSurveyResponseByUserId = async (userId: string) => {
  const { data: surveyResponses, error } = await supabase
    .from("survey_responses")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)

  if (error) throw error
  return surveyResponses[0] || null
}

export const createSurveyResponse = async (
  surveyResponse: TablesInsert<"survey_responses">
) => {
  const { data: createdSurveyResponse, error } = await supabase
    .from("survey_responses")
    .insert([surveyResponse])
    .select("*")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return createdSurveyResponse
}

export const updateSurveyResponse = async (
  surveyId: string,
  surveyResponse: TablesUpdate<"survey_responses">
) => {
  const { data: updatedSurveyResponse, error } = await supabase
    .from("survey_responses")
    .update(surveyResponse)
    .eq("survey_id", surveyId)
    .select("*")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return updatedSurveyResponse
}

export const upsertSurveyResponse = async (
  surveyData: TablesInsert<"survey_responses">
) => {
  const { data: surveyResponse, error } = await supabase
    .from("survey_responses")
    .upsert(surveyData)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return surveyResponse
}

export const updateSurveyResponseStep = async (
  surveyId: string,
  step: number,
  stepData: any
) => {
  let updateData: any = {
    step_completed: step
  }
  if (step === 1) {
    updateData = {
      ...updateData,
      application_year: stepData.application_year,
      city: stepData.city,
      state: stepData.state,
      zipcode: stepData.zipcode,
      country: stepData.country,
      high_school_name: stepData.high_school_name,
      high_school_gpa: stepData.high_school_gpa,
      max_gpa: stepData.max_gpa
    }
  } else if (step === 2) {
    updateData = {
      ...updateData,
      act_score: stepData.act_score,
      sat_score: stepData.sat_score,
      sat_subject_scores: stepData.sat_subject_scores,
      ap_scores: stepData.ap_scores,
      ib_scores: stepData.ib_scores,
      other_test_scores: stepData.other_test_scores
    }
  } else {
    updateData[getStepField(step)] = stepData
  }
  const { data: updatedSurveyResponse, error } = await supabase
    .from("survey_responses")
    .update(updateData)
    .eq("survey_id", surveyId)
    .select("*")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return updatedSurveyResponse
}

function getStepField(step: number): string {
  switch (step) {
    case 3:
      return "application_history"
    case 4:
      return "impact_factors"
    case 5:
      return "challenges"
    default:
      throw new Error("Invalid step")
  }
}

export const deleteSurveyResponse = async (surveyId: string) => {
  const { error } = await supabase
    .from("survey_responses")
    .delete()
    .eq("survey_id", surveyId)
  if (error) {
    throw new Error(error.message)
  }
  return true
}

// Function to get or create a survey response for a user
export const getOrCreateSurveyResponse = async (userId: string) => {
  console.log("this is user id - " + userId)
  let surveyResponse = await getSurveyResponseByUserId(userId)

  if (!surveyResponse) {
    surveyResponse = await createSurveyResponse({ user_id: userId })
  }

  return surveyResponse
}

// Test Scores Functions

export const getTestScores = async (surveyId: string) => {
  const { data: testScores, error } = await supabase
    .from("test_scores")
    .select("*")
    .eq("survey_id", surveyId)

  if (error) {
    throw new Error(error.message)
  }

  return testScores
}

export const addTestScore = async (testScore: TablesInsert<"test_scores">) => {
  const { data: newTestScore, error } = await supabase
    .from("test_scores")
    .insert([testScore])
    .select("*")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return newTestScore
}

export const updateTestScore = async (
  scoreId: string,
  testScore: TablesUpdate<"test_scores">
) => {
  const { data: updatedTestScore, error } = await supabase
    .from("test_scores")
    .update(testScore)
    .eq("score_id", scoreId)
    .select("*")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return updatedTestScore
}

export const deleteTestScore = async (scoreId: string) => {
  const { error } = await supabase
    .from("test_scores")
    .delete()
    .eq("score_id", scoreId)
  if (error) {
    throw new Error(error.message)
  }
  return true
}

// College Applications Functions

export const getCollegeApplications = async (surveyId: string) => {
  const { data: collegeApplications, error } = await supabase
    .from("college_applications")
    .select("*")
    .eq("survey_id", surveyId)

  if (error) {
    throw new Error(error.message)
  }

  return collegeApplications
}

export const addCollegeApplication = async (
  application: TablesInsert<"college_applications">
) => {
  const { data: newApplication, error } = await supabase
    .from("college_applications")
    .insert([application])
    .select("*")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return newApplication
}

export const updateCollegeApplication = async (
  applicationId: string,
  application: TablesUpdate<"college_applications">
) => {
  const { data: updatedApplication, error } = await supabase
    .from("college_applications")
    .update(application)
    .eq("application_id", applicationId)
    .select("*")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return updatedApplication
}

export const deleteCollegeApplication = async (applicationId: string) => {
  const { error } = await supabase
    .from("college_applications")
    .delete()
    .eq("application_id", applicationId)
  if (error) {
    throw new Error(error.message)
  }
  return true
}

export const addOrUpdateTestScore = async (
  testScore: TablesInsert<"test_scores">
) => {
  const { data, error } = await supabase
    .from("test_scores")
    .upsert(testScore)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export const addOrUpdateCollegeApplication = async (
  surveyId: string,
  application: TablesInsert<"college_applications">
) => {
  const { data, error } = await supabase
    .from("college_applications")
    .upsert({ ...application, survey_id: surveyId })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}
