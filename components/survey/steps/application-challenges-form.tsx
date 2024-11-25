import React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { ApplicationChallenge, ApplicationOutcomeFactor } from "../surveyTypes"
import { v4 as uuidv4 } from "uuid"

interface ChallengesFormProps {
  challenges: ApplicationChallenge[]
  setChallenges: React.Dispatch<React.SetStateAction<ApplicationChallenge[]>>
  factors: ApplicationOutcomeFactor[]
  setFactors: React.Dispatch<React.SetStateAction<ApplicationOutcomeFactor[]>>
  defaultChallenges: ApplicationChallenge[]
  defaultFactors: ApplicationOutcomeFactor[]
}

const ChallengesForm: React.FC<ChallengesFormProps> = ({
  challenges,
  setChallenges,
  factors,
  setFactors,
  defaultChallenges,
  defaultFactors
}) => {
  const handleChallengeChange = (id: string, newChallenge: string) => {
    setChallenges(prev =>
      prev.map(challenge =>
        challenge.challenge_id === id
          ? { ...challenge, challenge: newChallenge }
          : challenge
      )
    )
  }

  const handleFactorChange = (id: string, newFactor: string) => {
    setFactors(prev =>
      prev.map(factor =>
        factor.factor_id === id ? { ...factor, factor: newFactor } : factor
      )
    )
  }

  const handleChallengeCheckChange = (id: string, isChecked: boolean) => {
    setChallenges(prev => {
      const challenge = prev.find(c => c.challenge_id === id)

      // If unchecking and challenge is empty, remove it
      if (!isChecked && challenge && !challenge.challenge.trim()) {
        return prev.filter(c => c.challenge_id !== id)
      }

      // Otherwise update the checked status
      return prev.map(challenge => {
        if (challenge.challenge_id === id) {
          return {
            ...challenge,
            isChecked
          }
        }
        return challenge
      })
    })
  }

  const handleFactorCheckChange = (id: string, isChecked: boolean) => {
    setFactors(prev => {
      const factor = prev.find(f => f.factor_id === id)

      // If unchecking and factor is empty, remove it
      if (!isChecked && factor && !factor.factor.trim()) {
        return prev.filter(f => f.factor_id !== id)
      }

      // Otherwise update the checked status
      return prev.map(factor => {
        if (factor.factor_id === id) {
          return {
            ...factor,
            isChecked
          }
        }
        return factor
      })
    })
  }

  const handleAddNewChallenge = () => {
    setChallenges(prev => [
      ...prev,
      {
        challenge_id: uuidv4(),
        challenge: "",
        isChecked: true
      }
    ])
  }

  const handleAddNewFactor = () => {
    setFactors(prev => [
      ...prev,
      {
        factor_id: uuidv4(),
        factor: "",
        isChecked: true
      }
    ])
  }

  const isAddNewChallengeDisabled = () => {
    const customChallenges = challenges.filter(
      challenge =>
        !defaultChallenges.some(dc => dc.challenge === challenge.challenge)
    )
    return customChallenges.some(
      challenge =>
        (challenge.isChecked && !challenge.challenge.trim()) ||
        (!challenge.isChecked && challenge.challenge === "")
    )
  }

  const isAddNewFactorDisabled = () => {
    const customFactors = factors.filter(
      factor => !defaultFactors.some(df => df.factor === factor.factor)
    )
    return customFactors.some(
      factor =>
        (factor.isChecked && !factor.factor.trim()) ||
        (!factor.isChecked && factor.factor === "")
    )
  }

  return (
    <div className="w-full max-w-2xl space-y-6 px-2 md:space-y-8 md:px-0">
      <div className="space-y-4">
        <Label className="text-sm font-semibold md:text-base">
          11. What challenges did you encounter in your college application
          process?
        </Label>

        <div className="space-y-3 md:space-y-4">
          {challenges.map(challenge => (
            <div
              key={challenge.challenge_id}
              className="flex items-start space-x-3 md:items-center md:space-x-4"
            >
              <Checkbox
                checked={challenge.isChecked}
                onCheckedChange={checked =>
                  handleChallengeCheckChange(
                    challenge.challenge_id,
                    checked as boolean
                  )
                }
                className="mt-1 size-4 md:mt-0 md:size-5"
              />
              {defaultChallenges.some(
                dc => dc.challenge === challenge.challenge
              ) ? (
                <span className="flex-1 text-sm md:text-base">
                  {challenge.challenge}
                </span>
              ) : challenge.isChecked ? (
                <Input
                  type="text"
                  value={challenge.challenge}
                  onChange={e =>
                    handleChallengeChange(
                      challenge.challenge_id,
                      e.target.value
                    )
                  }
                  className="flex-1 border-none text-sm focus:outline-none md:text-base"
                  placeholder="Enter challenge"
                />
              ) : (
                <span className="flex-1 text-sm md:text-base">
                  {challenge.challenge}
                </span>
              )}
            </div>
          ))}

          <Button
            type="button"
            onClick={handleAddNewChallenge}
            variant="ghost"
            className="mt-2 h-8 text-sm md:h-10 md:text-base"
            disabled={isAddNewChallengeDisabled()}
          >
            + Add a new challenge
          </Button>
        </div>
      </div>

      <div className="space-y-4 pt-4 md:pt-6">
        <Label className="block text-sm font-semibold md:text-base">
          12. In your opinion, what are the most important factors that affect
          your application outcomes?
        </Label>

        <div className="space-y-3 md:space-y-4">
          {factors.map(factor => (
            <div
              key={factor.factor_id}
              className="flex items-start space-x-3 md:items-center md:space-x-4"
            >
              <Checkbox
                checked={factor.isChecked}
                onCheckedChange={checked =>
                  handleFactorCheckChange(factor.factor_id, checked as boolean)
                }
                className="mt-1 size-4 md:mt-0 md:size-5"
              />
              {defaultFactors.some(df => df.factor === factor.factor) ? (
                <span className="flex-1 text-sm md:text-base">
                  {factor.factor}
                </span>
              ) : factor.isChecked ? (
                <Input
                  type="text"
                  value={factor.factor}
                  onChange={e =>
                    handleFactorChange(factor.factor_id, e.target.value)
                  }
                  className="flex-1 border-none text-sm focus:outline-none md:text-base"
                  placeholder="Enter factor"
                />
              ) : (
                <span className="flex-1 text-sm md:text-base">
                  {factor.factor}
                </span>
              )}
            </div>
          ))}

          <Button
            type="button"
            onClick={handleAddNewFactor}
            variant="ghost"
            className="mt-2 h-8 text-sm md:h-10 md:text-base"
            disabled={isAddNewFactorDisabled()}
          >
            + Add a new factor
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ChallengesForm
