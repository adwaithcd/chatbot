import { checkApiKey, getServerProfile } from "@/lib/server/server-chat-helpers"
import { GoogleGenerativeAI } from "@google/generative-ai"
import {
  getServerChallenges,
  getServerCollegeApplications,
  getServerImpactFactors,
  getServerOutcomeFactors,
  getServerSurveyResponse,
  getServerTestScores,
  upsertServerReport
} from "@/lib/server/server-survey-helpers"

export const createReport = async (userId: string, type: "survey" | "chat") => {
  try {
    const profile = await getServerProfile()
    checkApiKey(profile.google_gemini_api_key, "Google")

    const genAI = new GoogleGenerativeAI(profile.google_gemini_api_key || "")
    const model = genAI.getGenerativeModel({ model: "gemini-pro" })

    let data
    let prompt

    if (type === "survey") {
      data = await formatSurveyData(userId)
      prompt = generateSurveyPrompt(data)
    } else {
      data = await formatChatData(userId)
      prompt = generateChatPrompt(data)
    }

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // Update the report in DB
    if (type === "survey") {
      await upsertServerReport({
        user_id: userId,
        survey_report: text
      })
    } else {
      await upsertServerReport({
        user_id: userId,
        chat_report: text
      })
    }

    return { success: true }
  } catch (error) {
    console.error(`Error generating ${type} report:`, error)
    return { success: false, error }
  }
}

const formatSurveyData = async (userId: string) => {
  try {
    const surveyResponse = await getServerSurveyResponse(userId)
    if (!surveyResponse) {
      throw new Error("Survey response not found")
    }

    // Only proceed if we have a valid survey_id
    const surveyId = surveyResponse.survey_id
    if (!surveyId) {
      throw new Error("Invalid survey ID")
    }

    // Now fetch all related data using the surveyId
    const [testScores, applications, impactFactors, challenges, factors] =
      await Promise.all([
        getServerTestScores(surveyId),
        getServerCollegeApplications(surveyId),
        getServerImpactFactors(surveyId),
        getServerChallenges(surveyId),
        getServerOutcomeFactors(surveyId)
      ])

    return {
      background: {
        applicationYear: surveyResponse.application_year,
        location: {
          city: surveyResponse.city || "Not specified",
          state: surveyResponse.state || "Not specified",
          zipcode: surveyResponse.zipcode || "Not specified",
          country: surveyResponse.country || "Not specified"
        },
        academics: {
          highSchool: surveyResponse.high_school_name || "Not specified",
          gpa: surveyResponse.high_school_gpa || "Not specified",
          maxGpa: surveyResponse.max_gpa || "Not specified"
        }
      },
      testScores:
        testScores?.map(score => ({
          testName: score.test_name,
          score: score.test_score
        })) || [],
      collegeApplications:
        applications?.map(app => ({
          collegeName: app.college_name,
          major: app.major || "Not specified",
          status: app.offer_status
        })) || [],
      currentProgram: {
        program: surveyResponse.current_enrolled_program || "Not specified",
        reasonForChoice:
          surveyResponse.reason_for_choosing_asu || "Not specified"
      },
      financialSupport:
        surveyResponse.financial_support_details || "Not specified",
      impactFactors:
        impactFactors?.map(factor => ({
          factor: factor.impact_factor,
          importance: factor.is_important,
          rank: factor.rank
        })) || [],
      challenges: challenges?.map(c => c.challenge) || [],
      outcomeFactors: factors?.map(f => f.factor) || []
    }
  } catch (error) {
    console.error("Error formatting survey data:", error)
    throw error
  }
}

const formatChatData = async (userId: string) => {
  // TODO: Implement chat data formatting when needed
  return {}
}

const generateSurveyPrompt = (data: any) => {
  return `Generate a personalized analysis and report of this student's college application journey based on their survey responses:

${data.background.applicationYear ? `Application Year: ${data.background.applicationYear}` : ""}

Location Information:
- City: ${data.background.location.city}
- State: ${data.background.location.state}
${data.background.location.country !== "Not specified" ? `- Country: ${data.background.location.country}` : "-Country: USA"}

Academic Background:
- High School: ${data.background.academics.highSchool}
- GPA: ${data.background.academics.gpa}/${data.background.academics.maxGpa}

${
  data.testScores.length > 0
    ? `Test Scores:
${data.testScores.map((test: { testName: any; score: any }) => `- ${test.testName}: ${test.score}`).join("\n")}`
    : ""
}

${
  data.collegeApplications.length > 0
    ? `College Applications:
${data.collegeApplications.map((app: { collegeName: any; major: any; status: any }) => `- ${app.collegeName} (${app.major}): ${app.status}`).join("\n")}`
    : ""
}

Current Enrollment:
- Program: ${data.currentProgram.program}
- Reason for choosing ASU: ${data.currentProgram.reasonForChoice}

${
  data.financialSupport !== "Not specified"
    ? `Financial Support Information:
${data.financialSupport}`
    : ""
}

${
  data.impactFactors.length > 0
    ? `Impact Factors in Decision Making:
${data.impactFactors.map((factor: { factor: any; is_important: any; rank: any }) => `- ${factor.factor} (Importance: ${factor.is_important ? "High" : "Low"}${factor.rank ? `, Rank: ${factor.rank}` : ""})`).join("\n")}`
    : ""
}

${
  data.challenges.length > 0
    ? `Challenges Faced:
${data.challenges.map((challenge: any) => `- ${challenge}`).join("\n")}`
    : ""
}

Please provide a summary of the survey responses. Use phrases like "your"
Make specific references to their chosen major, test scores, and unique circumstances. Format the report in clear sections with bullet points where appropriate.`
}

const generateChatPrompt = (data: any) => {
  // TODO: Implement chat prompt generation
  return ""
}
