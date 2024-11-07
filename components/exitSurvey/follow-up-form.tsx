import React, { useEffect, useState } from "react"
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
  const [otherGiftCard, setOtherGiftCard] = useState("")
  const [selectedOption, setSelectedOption] = useState(
    formData.gift_card_preference || ""
  )

  // Initialize the other gift card input if there's a custom value
  useEffect(() => {
    if (
      formData.gift_card_preference &&
      !giftCardOptions.some(opt => opt.value === formData.gift_card_preference)
    ) {
      setOtherGiftCard(formData.gift_card_preference)
      setSelectedOption("other")
    } else {
      setSelectedOption(formData.gift_card_preference || "")
    }
  }, [formData.gift_card_preference])

  const handleGiftCardChange = (value: string) => {
    setSelectedOption(value)

    if (value === "other") {
      // When "other" is selected, keep the existing other gift card value
      setFormData((prev: any) => ({
        ...prev,
        gift_card_preference: otherGiftCard || "other",
        follow_up_contact: true
      }))
    } else {
      setFormData((prev: any) => ({
        ...prev,
        gift_card_preference: value,
        follow_up_contact: value !== "no_contact"
      }))
    }
  }

  const handleOtherGiftCardChange = (value: string) => {
    setOtherGiftCard(value)
    setFormData((prev: any) => ({
      ...prev,
      gift_card_preference: value || "other",
      follow_up_contact: true
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
          value={selectedOption}
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
              {option.value === "other" && selectedOption === "other" && (
                <Input
                  className="ml-2 w-[200px]"
                  placeholder="Specify"
                  value={otherGiftCard}
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
