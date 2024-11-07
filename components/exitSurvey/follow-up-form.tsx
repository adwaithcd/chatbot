import React from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface FollowUpFormProps {
  formData: {
    follow_up_contact: boolean
    gift_card_preference: string | null
  }
  setFormData: React.Dispatch<React.SetStateAction<any>>
}

const giftCardOptions = [
  { value: "no_contact", label: "I don't want to be contacted" },
  { value: "amazon", label: "Amazon gift card" },
  { value: "netflix", label: "Netflix gift card" },
  { value: "uber", label: "Uber gift card" },
  { value: "starbucks", label: "Starbucks gift card" },
  { value: "target", label: "Target gift card" },
  { value: "other", label: "Other gift card" }
]

const FollowUpForm: React.FC<FollowUpFormProps> = ({
  formData,
  setFormData
}) => {
  const handleGiftCardChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      gift_card_preference: value,
      follow_up_contact: value !== "no_contact"
    }))
  }

  const handleOtherGiftCardChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      gift_card_preference: value
    }))
  }

  return (
    <div className="w-full max-w-2xl space-y-8">
      <div className="space-y-4">
        <Label className="text-base">
          6. Are you willing to be contacted for follow-up questions to discuss
          your experience with the college application bot (e.g., 15 minutes
          Zoom meeting)? If so, we will provide a gift card for your
          cooperation. Could you please select your favorite gift card?
        </Label>

        <RadioGroup
          value={formData.gift_card_preference || ""}
          onValueChange={handleGiftCardChange}
          className="mt-4 space-y-4"
        >
          {giftCardOptions.map(option => (
            <div key={option.value} className="flex items-center space-x-2">
              <RadioGroupItem value={option.value} id={option.value} />
              <Label
                htmlFor={option.value}
                className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {option.label}
              </Label>
              {option.value === "other" &&
                formData.gift_card_preference === "other" && (
                  <Input
                    className="ml-2 w-[200px]"
                    placeholder="Specify"
                    onChange={e => handleOtherGiftCardChange(e.target.value)}
                  />
                )}
            </div>
          ))}
        </RadioGroup>
      </div>
    </div>
  )
}

export default FollowUpForm
