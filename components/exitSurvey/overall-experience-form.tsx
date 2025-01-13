import React from "react"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
// import StarRating from "../components/star-rating"
import StarRating from "./star-rating"

interface OverallExperienceFormProps {
  formData: {
    helpfulness_rating: number | null
    helpfulness_feedback: string | null
    trustworthiness_rating: number | null
    trustworthiness_feedback: string | null
    additional_feedback: string | null
  }
  setFormData: React.Dispatch<React.SetStateAction<any>>
}

const OverallExperienceForm: React.FC<OverallExperienceFormProps> = ({
  formData,
  setFormData
}) => {
  const handleInputChange = (field: string, value: string | number | null) => {
    setFormData((prev: OverallExperienceFormProps["formData"]) => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <div className="w-full max-w-2xl space-y-6 px-2 md:space-y-8 md:px-0">
      <div className="space-y-4">
        <Label className="text-sm font-semibold md:text-base">
          1. Was the college application bot helpful for your college
          application?
        </Label>
        <StarRating
          rating={formData.helpfulness_rating || 0}
          onRatingChange={rating =>
            handleInputChange("helpfulness_rating", rating)
          }
          className="mt-2"
        />
      </div>

      <div className="space-y-4">
        <Label className="text-sm font-semibold md:text-base">
          2. Please explain your rating on the helpfulness of the college
          application bot. Please provide any suggestions for improvement.
        </Label>
        <Textarea
          value={formData.helpfulness_feedback || ""}
          onChange={e =>
            handleInputChange("helpfulness_feedback", e.target.value)
          }
          className="min-h-[100px] resize-none"
          placeholder="Enter your feedback here"
        />
      </div>

      <div className="space-y-4">
        <Label className="text-sm font-semibold md:text-base">
          3. Do you find the college application bot trustworthy?
        </Label>
        <StarRating
          rating={formData.trustworthiness_rating || 0}
          onRatingChange={rating =>
            handleInputChange("trustworthiness_rating", rating)
          }
          className="mt-2"
        />
      </div>

      <div className="space-y-4">
        <Label className="text-sm font-semibold md:text-base">
          4. Please explain your rating on the trustworthiness of the college
          application bot. Please provide any suggestions for improvement.
        </Label>
        <Textarea
          value={formData.trustworthiness_feedback || ""}
          onChange={e =>
            handleInputChange("trustworthiness_feedback", e.target.value)
          }
          className="min-h-[100px] resize-none"
          placeholder="Enter your feedback here"
        />
      </div>

      <div className="space-y-4">
        <Label className="text-sm font-semibold md:text-base">
          5. Do you have any additional comments or suggestions to improve the
          college application bot?
        </Label>
        <Textarea
          value={formData.additional_feedback || ""}
          onChange={e =>
            handleInputChange("additional_feedback", e.target.value)
          }
          className="min-h-[100px] resize-none"
          placeholder="Enter your additional feedback here"
        />
      </div>
    </div>
  )
}

export default OverallExperienceForm
