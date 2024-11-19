import { ChatSettings } from "@/types"

const APPLICATION_CHATBOT_URL = process.env.APPLICATION_CHATBOT_URL

export async function POST(request: Request) {
  const json = await request.json()
  const { chatSettings, messages, chatId } = json as {
    chatSettings: ChatSettings
    messages: any[]
    chatId: string
  }

  try {
    const lastMessage = messages.pop()
    const userMessage = lastMessage.content
    const threadId = chatId || "1"

    if (!APPLICATION_CHATBOT_URL) {
      throw new Error("APPLICATION_CHATBOT_URL is not defined")
    }
    const response = await fetch(APPLICATION_CHATBOT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        question: userMessage,
        thread_id: threadId
      })
    })

    if (!response.ok) {
      throw new Error(`Application Chatbot API error: ${response.status}`)
    }

    const data = await response.json()

    return new Response(data.message.trim(), {
      headers: { "Content-Type": "text/plain" }
    })
  } catch (error: any) {
    console.error("Application Chatbot Error:", error)
    return new Response(
      JSON.stringify({
        message: "Error from Application Chatbot: " + error.message
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    )
  }
}
