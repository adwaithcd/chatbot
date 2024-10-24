import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const response = await fetch(
      "http://demo-d-Publi-NU2RRqsuaVm7-500183766.us-east-1.elb.amazonaws.com/prompt_recs/invoke",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          input: {
            question:
              "Give some sample questions which might be useful to a student?"
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
