import { ChatbotUIContext } from "@/context/context"
import { ChatSettings } from "@/types"
import { StreamingTextResponse } from "ai"

const APPLICATION_CHATBOT_URL = process.env.APPLICATION_CHATBOT_URL
export const runtime = "edge"

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

    // Create streams to transform the response
    const { readable, writable } = new TransformStream()
    const writer = writable.getWriter()
    const encoder = new TextEncoder()
    const decoder = new TextDecoder()

    // Process the stream
    const processStream = async () => {
      const reader = response.body?.getReader()
      if (!reader) throw new Error("No response body")

      let previousResponseMessage = ""
      let buffer = ""

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          // Decode the chunk and process line by line
          const chunk = decoder.decode(value)
          const lines = chunk.split("\n")

          for (const line of lines) {
            if (!line.trim()) continue
            console.log("****line*****", line)

            // If buffer is empty, start with this line
            // If buffer is not empty, append this line
            if (!buffer) {
              buffer = line
            } else {
              buffer += line
            }

            //check if the line has } to know if the response is complete
            if (buffer.includes("}")) {
              try {
                const jsonResponse = JSON.parse(buffer)
                if (
                  jsonResponse.next &&
                  [
                    "GeneralAdvisor",
                    "general_advisor",
                    "AdmissionAdvisor",
                    "admission_advisor",
                    "FinancialCostAdvisor",
                    "financial_cost_advisor"
                  ].includes(jsonResponse.next) &&
                  !jsonResponse.message
                ) {
                  await writer.write(encoder.encode(jsonResponse.next))
                  buffer = ""
                  continue
                }

                if (
                  jsonResponse.message &&
                  jsonResponse.message.trim() &&
                  jsonResponse.message !== previousResponseMessage &&
                  jsonResponse.message !== "I don't know." &&
                  jsonResponse.message !== "I don't know"
                ) {
                  previousResponseMessage = jsonResponse.message
                  await writer.write(
                    encoder.encode(jsonResponse.message.trim())
                  )
                }
                //clear the buffer
                buffer = ""
              } catch (e) {
                console.error("Error parsing JSON", e)
              }
            }

            // try {
            //   console.log("****line*****", line)
            //   const jsonResponse = JSON.parse(line)

            //   if (
            //     jsonResponse.next &&
            //     [
            //       "GeneralAdvisor",
            //       "AdmissionAdvisor",
            //       "FinancialCostAdvisor"
            //     ].includes(jsonResponse.next) &&
            //     !jsonResponse.message
            //   ) {
            //     await writer.write(encoder.encode(jsonResponse.next))
            //     continue
            //   }
            //   if (
            //     jsonResponse.message &&
            //     jsonResponse.message.trim() &&
            //     jsonResponse.message !== previousResponseMessage &&
            //     jsonResponse.message !== "I don't know."
            //   ) {
            //     previousResponseMessage = jsonResponse.message
            //     await writer.write(encoder.encode(jsonResponse.message.trim()))
            //   }
            // } catch (e) {
            //   if (line.trim()) {
            //     await writer.write(encoder.encode(line))
            //   }
            // }
          }
        }
      } finally {
        reader.releaseLock()
        await writer.close()
      }
    }

    // Start processing the stream
    processStream().catch(console.error)

    // Return streaming response
    return new Response(readable)
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
