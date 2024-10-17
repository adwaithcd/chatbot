// forms/TestScoresForm.tsx
import React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { TestScore } from "../surveyTypes"
import { v4 as uuidv4 } from "uuid"

interface TestScoresFormProps {
  testScores: TestScore[]
  setTestScores: React.Dispatch<React.SetStateAction<TestScore[]>>
}

const DEFAULT_TESTS = ["ACT", "SAT", "AP", "IB"]

const TestScoresForm: React.FC<TestScoresFormProps> = ({
  testScores,
  setTestScores
}) => {
  const handleScoreChange = (id: string, newScore: string) => {
    setTestScores(prev =>
      prev.map(score =>
        score.score_id === id
          ? { ...score, test_score: newScore === "" ? null : newScore }
          : score
      )
    )
  }

  const handleNameChange = (id: string, newName: string) => {
    setTestScores(prev =>
      prev.map(score =>
        score.score_id === id ? { ...score, test_name: newName } : score
      )
    )
  }

  const handleCheckChange = (id: string, isChecked: boolean) => {
    setTestScores(prev =>
      prev.map(score => {
        if (score.score_id === id) {
          return {
            ...score,
            isChecked,
            test_score: isChecked ? score.test_score : null
          }
        }
        return score
      })
    )
  }

  const handleAddNewTest = () => {
    setTestScores(prev => [
      ...prev,
      {
        score_id: uuidv4(),
        test_name: "",
        test_score: null,
        isChecked: true,
        isUserAdded: true
      }
    ])
  }

  const isAddNewTestDisabled = () => {
    const nonDefaultTests = testScores.filter(
      score => !DEFAULT_TESTS.includes(score.test_name)
    )
    return nonDefaultTests.some(
      score =>
        (score.isChecked && (!score.test_name || score.test_score === null)) ||
        (!score.isChecked && score.isUserAdded)
    )
  }

  return (
    <div className="w-full max-w-2xl space-y-8">
      <Label className="text-base font-semibold">
        5. Did you take any of the following standardized tests?
      </Label>
      <p className="text-sm text-gray-500">
        Select all that apply and specify your scores for each test taken.
      </p>

      <div className="space-y-4">
        {testScores.map(score => (
          <div key={score.score_id} className="flex items-center space-x-4">
            <Checkbox
              checked={score.isChecked}
              onCheckedChange={checked =>
                handleCheckChange(score.score_id, checked as boolean)
              }
              className="size-5"
            />
            {DEFAULT_TESTS.includes(score.test_name) ? (
              <span className="w-1/3">{score.test_name}</span>
            ) : score.isChecked ? (
              <Input
                type="text"
                value={score.test_name}
                onChange={e => handleNameChange(score.score_id, e.target.value)}
                className="w-1/3 border-none focus:outline-none"
                placeholder="Test Name"
              />
            ) : (
              <span className="w-1/3">{score.test_name}</span>
            )}
            <Input
              type="text"
              value={score.test_score ?? ""}
              onChange={e => handleScoreChange(score.score_id, e.target.value)}
              disabled={!score.isChecked}
              className="w-1/3"
              placeholder="Score"
            />
          </div>
        ))}
      </div>

      <Button
        type="button"
        onClick={handleAddNewTest}
        variant="outline"
        className="mt-4"
        disabled={isAddNewTestDisabled()}
      >
        + Add a new test
      </Button>
    </div>
  )
}

export default TestScoresForm
