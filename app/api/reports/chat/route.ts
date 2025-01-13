// app/api/reports/chat/route.ts
import { NextResponse } from "next/server"
import { getMessagesByChatId } from "@/db/messages"
import { checkApiKey, getServerProfile } from "@/lib/server/server-chat-helpers"
import { GoogleGenerativeAI } from "@google/generative-ai"
import {
  getServerUserMessages,
  upsertServerReport
} from "@/lib/server/server-report-helpers"

export async function POST(request: Request) {
  try {
    const { userId } = await request.json()

    const profile = await getServerProfile()
    checkApiKey(profile.google_gemini_api_key, "Google")

    const genAI = new GoogleGenerativeAI(profile.google_gemini_api_key || "")
    const model = genAI.getGenerativeModel({ model: "gemini-pro" })

    const messages = await getServerUserMessages(userId)

    if (messages.length === 0) {
      const defaultReport =
        "Start chatting to generate your chat analysis report."

      // Save default message to database
      await upsertServerReport({
        user_id: userId,
        chat_report: defaultReport
      })

      return NextResponse.json({
        success: true,
        report: defaultReport
      })
    }

    // Generate prompt from messages
    const prompt = generateChatPrompt(messages)

    // Generate report using LLM
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // Update report in database
    await upsertServerReport({
      user_id: userId,
      chat_report: text
    })

    // Return the generated report
    return NextResponse.json({
      success: true,
      report: text
    })
  } catch (error: any) {
    console.error("Error generating chat report:", error)
    return NextResponse.json(
      { error: error.message || "Failed to generate chat report" },
      { status: 500 }
    )
  }
}

function generateChatPrompt(messages: any[]) {
  return `Here are the user's messages with an LLM which helps with applications:

${messages.map(msg => `- ${msg.content}`).join("\n")}

Please provide a detailed report that includes:
1. Most common topics or themes discussed
2. Key questions or concerns raised
3. Areas of interest
4. List of universities that may interest them
5. Scholarship information if any

Based on the user's chat history, generate a comprehensive analysis of their interactions and key themes in second person. Format the report with clear sections and bullet points for easy reading.`
}
