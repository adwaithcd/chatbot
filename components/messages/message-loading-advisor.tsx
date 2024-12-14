import React from "react"
import { IconCircleFilled, IconCheck } from "@tabler/icons-react"
import { AdvisorDetails } from "@/types"

interface AdvisorDetailsProps {
  advisors: AdvisorDetails[]
  currentAdvisor: string | null
  showLoading: boolean
}

export const AdvisorStatus = ({
  advisors,
  currentAdvisor,
  showLoading
}: AdvisorDetailsProps) => {
  const hasAdvisors = advisors.length > 0

  if (!hasAdvisors && showLoading) {
    return (
      <div className="mt-2">
        <IconCircleFilled className="animate-pulse" size={20} />
      </div>
    )
  }

  if (!hasAdvisors) {
    return null
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-col">
        {advisors.map((advisor, index) => (
          <div key={index}>
            <div className="flex items-center space-x-3 py-3">
              {advisor.status === "loading" ? (
                <IconCircleFilled className="animate-pulse" size={20} />
              ) : (
                <IconCheck className="text-green-500" size={20} />
              )}
              <span className="text-base font-medium">
                {advisor.status === "loading" ? "Calling " : ""}
                {advisor.name.replace(/([A-Z])/g, " $1").trim()}
                {advisor.status === "loading" && (
                  <span className="animate-dots" />
                )}
              </span>
            </div>
            {/* {index < advisors.length - 1 && <div className="border" />} */}
          </div>
        ))}
      </div>
    </div>
  )
}

export default AdvisorStatus
