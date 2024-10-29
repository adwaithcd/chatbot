import { Label } from "@/components/ui/label"
import { SurveyForm, ImpactFactors } from "../surveyTypes"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { v4 as uuidv4 } from "uuid"
import { Button } from "@/components/ui/button"

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
  const [newFactor, setNewFactor] = useState("")
  const [draggedItemRank, setDraggedItemRank] = useState<number | null>(null)

  const handleDragStart = (
    e: React.DragEvent<HTMLElement>,
    id: string,
    rank: number | null
  ) => {
    e.dataTransfer.setData("impact_factor_id", id)
    setDraggedItemRank(rank)
  }

  const handleDragOver = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault()
  }

  const reorderRanks = (factors: ImpactFactors[]): ImpactFactors[] => {
    const importantFactors = factors
      .filter(f => f.is_important)
      .sort((a, b) => (a.rank || 0) - (b.rank || 0))

    return factors.map(factor => {
      if (!factor.is_important) return factor
      const newRank =
        importantFactors.findIndex(
          f => f.impact_factor_id === factor.impact_factor_id
        ) + 1
      return { ...factor, rank: newRank }
    })
  }

  const handleDropOnImportant = (
    e: React.DragEvent<HTMLElement>,
    dropIndex?: number
  ) => {
    e.preventDefault()
    const itemId = e.dataTransfer.getData("impact_factor_id")

    setImpactFactors(prev => {
      let updatedFactors = [...prev]
      const droppedItem = prev.find(f => f.impact_factor_id === itemId)

      if (!droppedItem) return prev

      // If it's a new item being added to important section
      if (!droppedItem.is_important) {
        // If dropping at a specific index
        if (typeof dropIndex === "number") {
          // Update the dropped item
          updatedFactors = updatedFactors.map(factor => {
            if (factor.impact_factor_id === itemId) {
              return { ...factor, is_important: true, rank: dropIndex + 1 }
            }
            // Shift other items' ranks
            if (factor.is_important && factor.rank && factor.rank > dropIndex) {
              return { ...factor, rank: factor.rank + 1 }
            }
            return factor
          })
        } else {
          // Dropping in the general area (add to end)
          const maxRank = Math.max(
            ...prev.filter(f => f.is_important).map(f => f.rank || 0),
            0
          )
          updatedFactors = updatedFactors.map(factor =>
            factor.impact_factor_id === itemId
              ? { ...factor, is_important: true, rank: maxRank + 1 }
              : factor
          )
        }
      } else {
        // Reordering existing important items
        if (typeof dropIndex === "number") {
          const oldRank = droppedItem.rank || 0
          const newRank = dropIndex + 1

          updatedFactors = updatedFactors.map(factor => {
            if (factor.impact_factor_id === itemId) {
              return { ...factor, rank: newRank }
            }
            if (factor.is_important && factor.rank) {
              if (oldRank < newRank) {
                if (factor.rank > oldRank && factor.rank <= newRank) {
                  return { ...factor, rank: factor.rank - 1 }
                }
              } else if (oldRank > newRank) {
                if (factor.rank >= newRank && factor.rank < oldRank) {
                  return { ...factor, rank: factor.rank + 1 }
                }
              }
            }
            return factor
          })
        }
      }

      return reorderRanks(updatedFactors)
    })
  }

  const handleDropOnUnimportant = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const itemId = e.dataTransfer.getData("impact_factor_id")

    setImpactFactors(prev => {
      let updatedFactors = prev.map(factor => {
        if (factor.impact_factor_id === itemId) {
          return { ...factor, is_important: false, rank: null }
        }
        return factor
      })

      return reorderRanks(updatedFactors)
    })
  }

  const handleDropBetweenItems = (
    e: React.DragEvent<HTMLLIElement>,
    index: number
  ) => {
    handleDropOnImportant(e, index)
  }

  const handleFinancialSupportChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSurveyFormData(prev => ({
      ...prev,
      financial_support_details: e.target.value
    }))
  }

  const factorItemClasses =
    "rounded-md border p-3 mb-2 hover:border-gray-400 cursor-grab active:cursor-grabbing shadow-sm"

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
          value={surveyFormData.financial_support_details || ""}
          onChange={handleFinancialSupportChange}
          className="max-w-sm"
        />
      </div>

      <button onClick={() => console.log(impactFactors)}>test</button>

      <div className="space-y-2">
        <Label className="text-base font-semibold">
          9. What are your top priorities when choosing a college?
        </Label>
      </div>

      <div className="flex gap-6">
        <div className="w-1/2 space-y-4">
          <h3 className="mb-4 font-semibold">
            Drag and rank the important factors here
          </h3>
          <div
            className="bg-muted min-h-[120px] rounded-lg border p-4"
            onDragOver={handleDragOver}
            onDrop={e => handleDropOnImportant(e)}
          >
            <ul className="space-y-2">
              {impactFactors
                .filter(factor => factor.is_important)
                .sort((a, b) => (a.rank || 0) - (b.rank || 0))
                .map((factor, index) => (
                  <li
                    key={factor.impact_factor_id}
                    draggable
                    className={factorItemClasses}
                    onDragStart={e =>
                      handleDragStart(e, factor.impact_factor_id, factor.rank)
                    }
                    onDragOver={handleDragOver}
                    onDrop={e => handleDropBetweenItems(e, index)}
                  >
                    {factor.rank}. {factor.impact_factor}
                  </li>
                ))}
            </ul>
          </div>

          <h3 className="mb-4 font-semibold">Unimportant Factors</h3>
          <div
            className="bg-muted min-h-[120px] rounded-lg border p-4"
            onDragOver={handleDragOver}
            onDrop={handleDropOnUnimportant}
          >
            <ul className="space-y-2">
              {impactFactors
                .filter(factor => factor.is_important === false)
                .map(factor => (
                  <li
                    key={factor.impact_factor_id}
                    draggable
                    className={factorItemClasses}
                    onDragStart={e =>
                      handleDragStart(e, factor.impact_factor_id, factor.rank)
                    }
                  >
                    {factor.impact_factor}
                  </li>
                ))}
            </ul>
          </div>
        </div>

        <div className="w-1/2 rounded-lg p-4">
          <ul className="space-y-2">
            {impactFactors
              .filter(factor => factor.is_important === null)
              .map(factor => (
                <li
                  key={factor.impact_factor_id}
                  draggable
                  className={factorItemClasses}
                  onDragStart={e =>
                    handleDragStart(e, factor.impact_factor_id, factor.rank)
                  }
                >
                  {factor.impact_factor}
                </li>
              ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

export default ImpactFactorsForm
