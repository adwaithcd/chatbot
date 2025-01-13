import { NextResponse } from "next/server"

const APPLICATION_CHATBOT_RECOMMENDATIONS_URL =
  process.env.APPLICATION_CHATBOT_RECOMMENDATIONS_URL

export async function POST(req: Request) {
  try {
    if (!APPLICATION_CHATBOT_RECOMMENDATIONS_URL) {
      throw new Error("APPLICATION_CHATBOT_RECOMMENDATIONS_URL is not defined")
    }

    const { message } = await req.json()
    const promptText = message
      ? message
      : "Give some sample questions which might be useful to a student for college application?"
    const response = await fetch(APPLICATION_CHATBOT_RECOMMENDATIONS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        question: promptText
      })
    })

    if (!response.ok) {
      throw new Error("Failed to fetch recommendations")
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching prompts:", error)
    return NextResponse.json(
      { error: "Failed to fetch recommendations" },
      { status: 500 }
    )
  }
}
