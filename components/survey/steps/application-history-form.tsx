import { CollegeApplications } from "../surveyTypes"
import { Label } from "@/components/ui/label"

interface ApplicationHistoryFormProps {
  applications: CollegeApplications[]
  setApplications: React.Dispatch<React.SetStateAction<CollegeApplications[]>>
}

const ApplicationHistoryForm: React.FC<ApplicationHistoryFormProps> = ({
  applications,
  setApplications
}) => {
  return (
    <div className="w-full max-w-2xl space-y-8">
      <Label className="text-base font-semibold">
        6. What colleges and majors have you applied to? Have you received an
        offer?
      </Label>
      <div className="space-y-4"></div>
    </div>
  )
}

export default ApplicationHistoryForm
