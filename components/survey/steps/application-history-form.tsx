import React, { useState } from "react"
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"

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
  const [showDeleteConfirmation, setShowDeleteConfirmation] =
    useState<boolean>(false)
  const [applicationToDeleteId, setApplicationToDeleteId] = useState<
    string | null
  >(null)

  const createEmptyApplication = (): CollegeApplications => ({
    application_id: uuidv4(),
    college_name: "",
    major: "",
    offer_status: "Offer received",
    isSaved: false
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

  const handleSurveyInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setSurveyFormData(prevData => ({
      ...prevData,
      [name]: value
    }))
  }

  const handleDeleteConfirmation = async () => {
    if (applicationToDeleteId) {
      try {
        await deleteCollegeApplication(applicationToDeleteId)
        deleteApplicationFromState(applicationToDeleteId)
      } catch (error) {
        console.error("Error deleting college application:", error)
      } finally {
        setShowDeleteConfirmation(false)
        setApplicationToDeleteId(null)
      }
    }
  }

  const handleCancelDelete = () => {
    setShowDeleteConfirmation(false)
    setApplicationToDeleteId(null)
  }

  const deleteApplicationFromState = (id: string) => {
    setApplications(prev => prev.filter(app => app.application_id !== id))
  }

  const handleDeleteApplication = (id: string) => {
    const applicationToDelete = applications.find(
      app => app.application_id === id
    )
    if (applicationToDelete?.isSaved) {
      setShowDeleteConfirmation(true)
      setApplicationToDeleteId(id)
    } else {
      deleteApplicationFromState(id)
    }
  }

  return (
    <div className="w-full max-w-2xl space-y-6 px-2 md:space-y-8 md:px-0">
      <Label className="text-sm font-semibold md:text-base">
        6. What colleges and majors have you applied to? Have you received an
        offer?
      </Label>
      <div className="space-y-4">
        {applications.map((application, index) => (
          <div
            key={application.application_id}
            className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_1fr_auto] md:items-center"
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
              className="w-full"
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
              className="w-full"
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
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Offer received">Offer received</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex justify-end md:w-8 md:justify-center">
              {index > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 p-0"
                  onClick={() =>
                    handleDeleteApplication(application.application_id)
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
        className="w-full md:w-auto"
      >
        + Add a new record
      </Button>

      <div className="space-y-2 pb-4">
        <Label
          htmlFor="current_enrolled_program"
          className="text-sm font-semibold md:text-base"
        >
          7. Which program are you currently enrolled in at ASU?
        </Label>
        <Input
          type="text"
          id="current_enrolled_program"
          name="current_enrolled_program"
          className="w-full md:max-w-sm"
          value={surveyFormData.current_enrolled_program || ""}
          onChange={handleSurveyInputChange}
        />
      </div>

      <div className="space-y-2 pb-4">
        <Label
          htmlFor="reason_for_choosing_asu"
          className="text-sm font-semibold md:text-base"
        >
          8. Why did you choose ASU over the other options?
        </Label>
        <Input
          type="text"
          id="reason_for_choosing_asu"
          name="reason_for_choosing_asu"
          className="w-full md:max-w-sm"
          value={surveyFormData.reason_for_choosing_asu || ""}
          onChange={handleSurveyInputChange}
        />
      </div>

      <Dialog
        open={showDeleteConfirmation}
        onOpenChange={setShowDeleteConfirmation}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <div className="mt-2">
            <p className="text-sm text-gray-500">
              Are you sure you want to delete this college application? This
              action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirmation(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirmation}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ApplicationHistoryForm
