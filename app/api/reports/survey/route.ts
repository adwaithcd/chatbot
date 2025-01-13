// app/api/reports/survey/route.ts
import { NextResponse } from "next/server"
import { checkApiKey, getServerProfile } from "@/lib/server/server-chat-helpers"
import { GoogleGenerativeAI } from "@google/generative-ai"
import {
  getServerSurveyResponse,
  getServerTestScores,
  getServerCollegeApplications,
  getServerImpactFactors,
  getServerChallenges,
  getServerOutcomeFactors,
  upsertServerReport
} from "@/lib/server/server-report-helpers"

export async function POST(request: Request) {
  try {
    const { userId } = await request.json()

    const profile = await getServerProfile()
    checkApiKey(profile.google_gemini_api_key, "Google")

    const genAI = new GoogleGenerativeAI(profile.google_gemini_api_key || "")
    const model = genAI.getGenerativeModel({ model: "gemini-pro" })

    const data = await formatSurveyData(userId)

    // If no survey data, return default message
    if (!data) {
      const defaultReport =
        "Please complete the survey to generate your survey summary."
      await upsertServerReport({
        user_id: userId,
        survey_report: defaultReport
      })
      return NextResponse.json({
        success: true,
        report: defaultReport
      })
    }

    // Generate prompt from survey data
    const prompt = generateSurveyPrompt(data)

    // Generate report using LLM
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // Update report in database
    await upsertServerReport({
      user_id: userId,
      survey_report: text
    })

    // Return the generated report
    return NextResponse.json({
      success: true,
      report: text
    })
  } catch (error: any) {
    console.error("Error generating survey report:", error)
    return NextResponse.json(
      { error: error.message || "Failed to generate survey report" },
      { status: 500 }
    )
  }
}

async function formatSurveyData(userId: string) {
  try {
    const surveyResponse = await getServerSurveyResponse(userId)
    if (!surveyResponse) {
      return null
    }

    const surveyId = surveyResponse.survey_id
    if (!surveyId) {
      return null
    }

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

function generateSurveyPrompt(data: any) {
  return `Here is response given by the student for the survey:

${data.background.applicationYear ? `Application Year: ${data.background.applicationYear}` : ""}

Location Information:
- City: ${data.background.location.city}
- State: ${data.background.location.state}
${data.background.location.country !== "Not specified" ? `- Country: ${data.background.location.country}` : "- Country: USA"}

Academic Background:
- High School: ${data.background.academics.highSchool}
- GPA: ${data.background.academics.gpa}/${data.background.academics.maxGpa}

${
  data.testScores.length > 0
    ? `Test Scores:
${data.testScores.map((test: any) => `- ${test.testName}: ${test.score}`).join("\n")}`
    : ""
}

${
  data.collegeApplications.length > 0
    ? `College Applications:
${data.collegeApplications.map((app: any) => `- ${app.collegeName} (${app.major}): ${app.status}`).join("\n")}`
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
${data.impactFactors.map((factor: any) => `- ${factor.factor} (Importance: ${factor.is_important ? "High" : "Low"}${factor.rank ? `, Rank: ${factor.rank}` : ""})`).join("\n")}`
    : ""
}

${
  data.challenges.length > 0
    ? `Challenges Faced:
${data.challenges.map((challenge: any) => `- ${challenge}`).join("\n")}`
    : ""
}

Generate a survey summary report of this student based on their survey responses in second person, use words like your. Make specific references to their chosen major, test scores, and unique circumstances. Format the report in clear sections with bullet points where appropriate.`
}
