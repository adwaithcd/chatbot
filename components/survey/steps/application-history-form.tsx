import React from "react"
import { Input } from "@/components/ui/input"
import { CollegeApplications, SurveyForm } from "../surveyTypes"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { v4 as uuidv4 } from "uuid"
import { deleteCollegeApplication } from "@/db/survey-responses"
//@ts-ignore
import { UilTimes } from "@iconscout/react-unicons"

interface ApplicationHistoryFormProps {
  applications: CollegeApplications[]
  setApplications: React.Dispatch<React.SetStateAction<CollegeApplications[]>>
  surveyFormData: SurveyForm
  setSurveyFormData: React.Dispatch<React.SetStateAction<SurveyForm>>
}

const ApplicationHistoryForm: React.FC<ApplicationHistoryFormProps> = ({
  applications,
  setApplications,
  surveyFormData,
  setSurveyFormData
}) => {
  const createEmptyApplication = (): CollegeApplications => ({
    application_id: uuidv4(),
    college_name: "",
    major: "",
    offer_status: "Offer received"
  })

  const handleInputChange = (
    id: string,
    field: keyof CollegeApplications,
    value: string
  ) => {
    setApplications(prev =>
      prev.map(app =>
        app.application_id === id ? { ...app, [field]: value } : app
      )
    )
  }

  const handleAddRecord = () => {
    if (canAddNewRecord()) {
      setApplications(prev => [...prev, createEmptyApplication()])
    }
  }

  const canAddNewRecord = () => {
    return applications.every(
      app => app.college_name && app.major && app.offer_status
    )
  }

  const handleCurrentEnrolledProgramChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSurveyFormData(prev => ({
      ...prev,
      current_enrolled_program: e.target.value
    }))
  }

  const handleDeleteApplication = async (id: string, index: number) => {
    // Delete from database if it exists
    await deleteCollegeApplication(id)

    // Update state
    setApplications(prev => prev.filter(app => app.application_id !== id))
  }

  return (
    <div className="w-full max-w-2xl space-y-8">
      <Label className="text-base font-semibold">
        6. What colleges and majors have you applied to? Have you received an
        offer?
      </Label>
      <div className="space-y-4">
        {applications.map((application, index) => (
          <div
            key={application.application_id}
            className="grid grid-cols-[1fr_1fr_1fr_auto] items-center gap-3"
          >
            <Input
              type="text"
              value={application.college_name}
              onChange={e =>
                handleInputChange(
                  application.application_id,
                  "college_name",
                  e.target.value
                )
              }
              placeholder="College"
            />
            <Input
              type="text"
              value={application.major || ""}
              onChange={e =>
                handleInputChange(
                  application.application_id,
                  "major",
                  e.target.value
                )
              }
              placeholder="Major"
            />
            <Select
              value={application.offer_status || "Offer received"}
              onValueChange={value =>
                handleInputChange(
                  application.application_id,
                  "offer_status",
                  value
                )
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Offer received">Offer received</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex w-8 justify-center">
              {index > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 p-0"
                  onClick={() =>
                    handleDeleteApplication(application.application_id, index)
                  }
                >
                  <UilTimes className="size-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
      <Button
        type="button"
        onClick={handleAddRecord}
        variant="ghost"
        disabled={!canAddNewRecord()}
      >
        + Add a new record
      </Button>

      <div className="space-y-2 pb-4">
        <Label
          htmlFor="current_enrolled_program"
          className="text-base font-semibold"
        >
          7. Which program are you currently enrolled in at ASU? Why did you
          choose ASU over the other options?
        </Label>
        <Input
          type="text"
          id="current_enrolled_program"
          className="max-w-sm"
          value={surveyFormData.current_enrolled_program || ""}
          onChange={handleCurrentEnrolledProgramChange}
        />
      </div>
    </div>
  )
}

export default ApplicationHistoryForm
