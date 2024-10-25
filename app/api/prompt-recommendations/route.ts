import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { message } = await req.json()
    const promptText = message
      ? message
      : "Give some sample questions which might be useful to a student for college application?"
    const response = await fetch(
      "http://demo-d-Publi-NU2RRqsuaVm7-500183766.us-east-1.elb.amazonaws.com/prompt_recs/invoke",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          input: {
            question: promptText
          }
        })
      }
    )

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
