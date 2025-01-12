// app/api/reports/queue/route.ts

import { NextResponse } from "next/server"
import { createReport } from "../generate/process"

export async function POST(request: Request) {
  try {
    const { userId, type } = await request.json()

    // Fire off report generation without awaiting
    createReport(userId, type).catch(error => {
      console.error("Background report generation failed:", error)
    })

    return NextResponse.json({ status: "queued" })
  } catch (error) {
    console.error("Error queueing report:", error)
    return NextResponse.json(
      { error: "Failed to queue report" },
      { status: 500 }
    )
  }
}
