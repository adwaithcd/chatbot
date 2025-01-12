// db/reports.ts

import { supabase } from "@/lib/supabase/browser-client"

export const getReportByUserId = async (userId: string) => {
  const { data: report, error } = await supabase
    .from("reports")
    .select("*")
    .eq("user_id", userId)
    .single()

  if (error) throw error
  return report
}

export const upsertReport = async (report: {
  user_id: string
  survey_report?: string | null
  chat_report?: string | null
}) => {
  const { data, error } = await supabase
    .from("reports")
    .upsert({
      user_id: report.user_id,
      survey_report: report.survey_report,
      chat_report: report.chat_report
    })
    .select()
    .single()

  if (error) throw error
  return data
}
