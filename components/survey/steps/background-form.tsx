// forms/BackgroundForm.tsx
import React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SurveyForm } from "../surveyTypes"
import { NumericFormat } from "react-number-format"

interface BackgroundFormProps {
  formData: SurveyForm
  setFormData: React.Dispatch<React.SetStateAction<SurveyForm>>
}

const BackgroundForm: React.FC<BackgroundFormProps> = ({
  formData,
  setFormData
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }))
  }

  const handleGPAChange = (value: number | null, name: string) => {
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }))
  }

  return (
    <form className="w-full max-w-2xl space-y-8">
      <div className="flex items-center pb-4">
        <Label htmlFor="application_year" className="text-base font-semibold">
          1. Which year did you apply to college?
        </Label>
        <div className="ml-6 shrink-0">
          <Input
            type="number"
            id="application_year"
            name="application_year"
            placeholder="YYYY"
            value={formData.application_year || ""}
            onChange={handleInputChange}
            className="w-32"
          />
        </div>
      </div>
      <div className="space-y-4 pb-4">
        <Label className="text-base font-semibold">
          2. Where did you apply from?
        </Label>
        <div className="grid grid-cols-2 gap-4">
          <Input
            type="text"
            placeholder="City"
            name="city"
            value={formData.city || ""}
            onChange={handleInputChange}
          />
          <Input
            type="text"
            placeholder="State/Province"
            name="state"
            value={formData.state || ""}
            onChange={handleInputChange}
          />
          <Input
            type="text"
            placeholder="Zipcode"
            name="zipcode"
            value={formData.zipcode || ""}
            onChange={handleInputChange}
          />
          <Input
            type="text"
            placeholder="Country if non-US"
            name="country"
            value={formData.country || ""}
            onChange={handleInputChange}
          />
        </div>
      </div>
      <div className="space-y-2 pb-4">
        <Label htmlFor="high_school_name" className="text-base font-semibold">
          3. What is the name of your most recent secondary/high school?
        </Label>
        <Input
          type="text"
          id="high_school_name"
          name="high_school_name"
          value={formData.high_school_name || ""}
          onChange={handleInputChange}
          className="max-w-md"
        />
      </div>
      <div className="flex items-center pb-4">
        <Label className="text-base font-semibold">
          4. What is your secondary/high school GPA?
        </Label>
        <div className="ml-6 flex shrink-0 items-center space-x-2">
          {/* <Input
            type="number"
            className="w-20"
            placeholder="3.0"
            name="high_school_gpa"
            step={0.1}
            value={formData.high_school_gpa || ""}
            onChange={handleInputChange}
          />
          <span>out of</span>
          <Input
            type="number"
            className="w-20"
            placeholder="4.0"
            name="max_gpa"
            step={0.1}
            value={formData.max_gpa || ""}
            onChange={handleInputChange}
          /> */}
          <NumericFormat
            customInput={Input}
            className="w-20"
            placeholder="3.0"
            value={formData.high_school_gpa ?? ""}
            onValueChange={values => {
              handleGPAChange(values.floatValue ?? null, "high_school_gpa")
            }}
            decimalScale={1}
            fixedDecimalScale
            allowNegative={false}
            max={10}
          />
          <span>out of</span>
          <NumericFormat
            customInput={Input}
            className="w-20"
            placeholder="4.0"
            value={formData.max_gpa ?? ""}
            onValueChange={values => {
              handleGPAChange(values.floatValue ?? null, "max_gpa")
            }}
            decimalScale={1}
            fixedDecimalScale
            allowNegative={false}
            max={10}
          />
        </div>
      </div>
    </form>
  )
}

export default BackgroundForm
