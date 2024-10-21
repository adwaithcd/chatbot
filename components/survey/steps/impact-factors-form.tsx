import { Label } from "@/components/ui/label"
import { SurveyForm, ImpactFactors } from "../surveyTypes"
import { Input } from "@/components/ui/input"
import { de } from "date-fns/locale"

interface ImpactFactorsFormProps {
  surveyFormData: SurveyForm
  setSurveyFormData: React.Dispatch<React.SetStateAction<SurveyForm>>
  impactFactors: ImpactFactors[]
  setImpactFactors: React.Dispatch<React.SetStateAction<ImpactFactors[]>>
}

const ImpactFactorsForm: React.FC<ImpactFactorsFormProps> = ({
  surveyFormData,
  setSurveyFormData,
  impactFactors,
  setImpactFactors
}) => {
  const handleFinancialSupportChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSurveyFormData(prev => ({ ...prev, financial_support: e.target.value }))
  }

  return (
    <div className="w-full max-w-2xl space-y-8">
      <div className="space-y-2">
        <Label htmlFor="financial_support" className="text-base font-semibold">
          8. Among the offers you have received, what kinds of financial support
          have you been granted? For example: scholarship, tuition waiver,
          financial aid, stipend.
        </Label>
        <Input
          id="financial_support"
          value={surveyFormData.financial_support || ""}
          onChange={handleFinancialSupportChange}
          className="max-w-sm"
        />
      </div>
    </div>
  )
}

export default ImpactFactorsForm
