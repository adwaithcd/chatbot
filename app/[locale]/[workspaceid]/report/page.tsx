"use client"

import React from "react"

const ReportPage = () => {
  return (
    <div className="flex size-full flex-col space-y-8 p-8">
      {/* Survey Summary */}
      <div className="bg-background rounded-lg border p-6">
        <h2 className="mb-4 text-xl font-semibold">Survey Summary</h2>
        <div className="space-y-2">
          <p>This summary is generated based on your survey response.</p>
          <p>Your interested major:</p>
          <p>Your academic standing:</p>
          <p>...</p>
        </div>
      </div>

      {/* Chat Summary */}
      <div className="bg-background rounded-lg border p-6">
        <h2 className="mb-4 text-xl font-semibold">Chat Summary</h2>
        <div className="space-y-2">
          <p>This summary is generated based on your chat history.</p>
          <p>Here is a list of universities that may interest you:</p>
          <p>Here is a summary of scholarship information:</p>
          <p>...</p>
        </div>
      </div>
    </div>
  )
}

export default ReportPage
