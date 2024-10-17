// types.ts
export interface SurveyForm {
  survey_id: string
  user_id: string
  application_year?: number | null
  city?: string | null
  state?: string | null
  high_school_name?: string | null
  high_school_gpa?: number | null
  max_gpa?: number | null
  zipcode?: string | null
  country?: string | null
  current_enrolled_program?: string | null
}

export interface TestScore {
  score_id: string
  test_name: string
  test_score: string | null
  isChecked: boolean
  isUserAdded: boolean
}

export interface CollegeApplications {
  application_id: string
  college_name: string
  major: string | null
  offer_status: string | null
}
