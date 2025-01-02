import { Label } from "@/components/ui/label"
import { SurveyForm, ImpactFactors } from "../surveyTypes"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { v4 as uuidv4 } from "uuid"
import { Button } from "@/components/ui/button"
import { X, Check } from "lucide-react"
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
  closestCenter
} from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove
} from "@dnd-kit/sortable"

interface ImpactFactorsFormProps {
  surveyFormData: SurveyForm
  setSurveyFormData: React.Dispatch<React.SetStateAction<SurveyForm>>
  impactFactors: ImpactFactors[]
  setImpactFactors: React.Dispatch<React.SetStateAction<ImpactFactors[]>>
}

const SortableItem = ({
  id,
  children,
  onDelete
}: {
  id: string
  children: React.ReactNode
  onDelete?: () => void
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: id
  })

  const style = transform
    ? {
        transform: `translate(${transform.x}px, ${transform.y}px)`,
        transition
      }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`bg-background relative mb-2 cursor-grab rounded-md border p-2 ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <div className="pr-6">
        {children}
        {onDelete && (
          <button
            onClick={e => {
              e.stopPropagation()
              onDelete()
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  )
}

const DroppableContainer = ({
  id,
  children,
  className
}: {
  id: string
  children: React.ReactNode
  className?: string
}) => {
  const { setNodeRef } = useDroppable({
    id: id
  })

  return (
    <div ref={setNodeRef} className={className}>
      {children}
    </div>
  )
}

const ImpactFactorsForm: React.FC<ImpactFactorsFormProps> = ({
  surveyFormData,
  setSurveyFormData,
  impactFactors,
  setImpactFactors
}) => {
  const [newFactor, setNewFactor] = useState("")
  const [isAddingNewFactor, setIsAddingNewFactor] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10
      }
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 100,
        tolerance: 5
      }
    })
  )

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id)
  }

  const handleDragEnd = (event: any) => {
    const { active, over } = event

    if (!over) {
      setActiveId(null)
      return
    }

    setImpactFactors(prev => {
      const updatedFactors = [...prev]
      const activeItem = updatedFactors.find(
        f => f.impact_factor_id === active.id
      )
      if (!activeItem) return prev

      // Handle dropping onto containers
      if (["important", "unimportant", "neutral"].includes(over.id)) {
        // Update item status based on container
        if (over.id === "important") {
          activeItem.is_important = true

          // Get current important factors excluding the active item
          const currentImportantFactors = updatedFactors
            .filter(f => f.is_important && f.impact_factor_id !== active.id)
            .sort((a, b) => (a.rank || 0) - (b.rank || 0))

          // Find the highest rank
          const maxRank =
            currentImportantFactors.length > 0
              ? Math.max(...currentImportantFactors.map(f => f.rank || 0))
              : 0

          // Assign the next rank
          activeItem.rank = maxRank + 1

          // Ensure ranks are consecutive
          const allImportantFactors = updatedFactors
            .filter(f => f.is_important)
            .sort((a, b) => (a.rank || 0) - (b.rank || 0))

          // Reassign ranks to ensure they're consecutive
          allImportantFactors.forEach((factor, index) => {
            factor.rank = index + 1
          })
        } else if (over.id === "unimportant") {
          activeItem.is_important = false
          activeItem.rank = null
        } else {
          activeItem.is_important = null
          activeItem.rank = null
        }
      }
      // Handle dropping onto or between items
      else {
        const overItem = updatedFactors.find(
          f => f.impact_factor_id === over.id
        )
        if (!overItem) return prev

        const oldIndex = updatedFactors.findIndex(
          f => f.impact_factor_id === active.id
        )
        const newIndex = updatedFactors.findIndex(
          f => f.impact_factor_id === over.id
        )

        if (overItem.is_important) {
          // Moving to or within important section
          activeItem.is_important = true

          // Reorder the array
          const reorderedFactors = arrayMove(updatedFactors, oldIndex, newIndex)

          // Update ranks for all important items
          const importantItems = reorderedFactors.filter(f => f.is_important)
          importantItems.forEach((item, index) => {
            item.rank = index + 1
          })

          return reorderedFactors
        } else {
          // Moving to another section
          activeItem.is_important = overItem.is_important
          activeItem.rank = null
        }
      }

      return updatedFactors
    })
    setActiveId(null)
    console.log("Updated factors", impactFactors)
  }

  const handleFinancialSupportChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSurveyFormData(prev => ({
      ...prev,
      financial_support_details: e.target.value
    }))
  }

  const addNewFactor = () => {
    if (newFactor.trim()) {
      const newFactorItem: ImpactFactors = {
        impact_factor_id: uuidv4(),
        impact_factor: newFactor.trim(),
        is_important: null,
        rank: null,
        user_added_factor: true
      }
      setImpactFactors(prev => [...prev, newFactorItem])
      setNewFactor("")
      setIsAddingNewFactor(false)
    } else {
      setIsAddingNewFactor(false)
    }
  }

  const handleAddNewFactorKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault()
      addNewFactor()
    } else if (e.key === "Escape") {
      setIsAddingNewFactor(false)
      setNewFactor("")
    }
  }

  const handleDeleteFactor = (factorId: string) => {
    setImpactFactors(prev =>
      prev.filter(factor => factor.impact_factor_id !== factorId)
    )
  }

  const importantFactors = impactFactors
    .filter(factor => factor.is_important)
    .sort((a, b) => (a.rank || 0) - (b.rank || 0))

  const unimportantFactors = impactFactors.filter(
    factor => factor.is_important === false
  )

  const neutralFactors = impactFactors.filter(
    factor => factor.is_important === null
  )

  return (
    <div className="w-full max-w-2xl space-y-8">
      <div className="space-y-2">
        <Label htmlFor="financial_support" className="text-base font-semibold">
          9. Among the offers you have received, what kinds of financial support
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

      <div className="space-y-2">
        <Label className="text-base font-semibold">
          10. What are your top priorities when choosing a college?
        </Label>
        <p className="text-muted-foreground text-sm">
          Drag and drop factors between sections. Items in the Important Factors
          section can be reordered to show their priority.
        </p>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-6">
          <div className="w-1/2 space-y-4">
            <h3 className="mb-4 text-sm font-semibold">
              Important Factors (Ranked)
            </h3>
            <DroppableContainer
              id="important"
              className="bg-muted/10 min-h-[120px] rounded-lg border p-4"
            >
              {importantFactors.length === 0 ? (
                <p className="text-muted-foreground py-8 text-center text-sm">
                  Drag items here to mark them as important
                </p>
              ) : (
                <SortableContext
                  items={importantFactors.map(f => f.impact_factor_id)}
                  strategy={verticalListSortingStrategy}
                >
                  <ol className="list-decimal space-y-2 pb-6 pl-5">
                    {importantFactors.map(factor => (
                      <li key={factor.impact_factor_id}>
                        <SortableItem id={factor.impact_factor_id}>
                          {factor.impact_factor}
                        </SortableItem>
                      </li>
                    ))}
                  </ol>
                </SortableContext>
              )}
            </DroppableContainer>

            <h3 className="mb-4 text-sm font-semibold">Unimportant Factors</h3>
            <DroppableContainer
              id="unimportant"
              className="bg-muted/10 min-h-[120px] rounded-lg border p-4"
            >
              {unimportantFactors.length === 0 ? (
                <p className="text-muted-foreground py-8 text-center text-sm">
                  Drag items here to mark them as unimportant
                </p>
              ) : (
                <ul className="list-disc space-y-2 pb-6 pl-5">
                  {unimportantFactors.map(factor => (
                    <li key={factor.impact_factor_id}>
                      <SortableItem id={factor.impact_factor_id}>
                        {factor.impact_factor}
                      </SortableItem>
                    </li>
                  ))}
                </ul>
              )}
            </DroppableContainer>
          </div>

          <div className="w-1/2 space-y-4">
            <h3 className="mb-4 text-sm font-semibold">Available Factors</h3>
            <DroppableContainer
              id="neutral"
              className="min-h-[120px] rounded-lg border p-4"
            >
              {neutralFactors.length === 0 ? (
                <p className="text-muted-foreground py-8 text-center text-sm">
                  No factors available
                </p>
              ) : (
                <ul className="space-y-2">
                  {neutralFactors.map(factor => (
                    <li key={factor.impact_factor_id}>
                      <SortableItem
                        id={factor.impact_factor_id}
                        onDelete={
                          factor.user_added_factor
                            ? () => handleDeleteFactor(factor.impact_factor_id)
                            : undefined
                        }
                      >
                        {factor.impact_factor}
                      </SortableItem>
                    </li>
                  ))}
                </ul>
              )}

              {isAddingNewFactor ? (
                <div className="mt-4 flex items-center gap-2">
                  <Input
                    value={newFactor}
                    onChange={e => setNewFactor(e.target.value)}
                    onKeyDown={handleAddNewFactorKeyDown}
                    onBlur={addNewFactor}
                    placeholder="Enter new factor"
                    className="flex-1"
                    autoFocus
                  />
                  <Button
                    onClick={addNewFactor}
                    size="icon"
                    variant="ghost"
                    className="size-8"
                    disabled={!newFactor.trim()}
                  >
                    <Check size={16} />
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => setIsAddingNewFactor(true)}
                  variant="ghost"
                  className="mt-4 w-full"
                >
                  + Add a new factor
                </Button>
              )}
            </DroppableContainer>
          </div>
        </div>

        <DragOverlay>
          {activeId ? (
            <div className="bg-background w-[300px] rounded-md border p-2 shadow-lg">
              {
                impactFactors.find(f => f.impact_factor_id === activeId)
                  ?.impact_factor
              }
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}

export default ImpactFactorsForm
