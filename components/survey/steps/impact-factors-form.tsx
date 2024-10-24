import { Label } from "@/components/ui/label"
import { SurveyForm, ImpactFactors } from "../surveyTypes"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { v4 as uuidv4 } from "uuid"
import { Button } from "@/components/ui/button"
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd"

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

  const handleDragStart = (e: React.DragEvent<HTMLElement>, id: string) => {
    e.dataTransfer.setData("impact_factor_id", id)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  const handleDropOnImportant = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()

    const target = e.target as Element
    const itemId = e.dataTransfer.getData("impact_factor_id")
    console.log(itemId)

    setImpactFactors(prev =>
      prev.map(factor =>
        factor.impact_factor_id === itemId
          ? { ...factor, is_important: true }
          : factor
      )
    )
  }

  const handleDropOnUnimportant = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()

    const target = e.target as Element
    const itemId = e.dataTransfer.getData("impact_factor_id")
    console.log(itemId)

    setImpactFactors(prev =>
      prev.map(factor =>
        factor.impact_factor_id === itemId
          ? { ...factor, is_important: false }
          : factor
      )
    )
  }

  const handleFinancialSupportChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSurveyFormData(prev => ({
      ...prev,
      financial_support_details: e.target.value
    }))
  }

  const handleAddFactor = () => {
    if (newFactor.trim()) {
      setImpactFactors(prev => [
        ...prev,
        {
          impact_factor_id: uuidv4(),
          impact_factor: newFactor.trim(),
          is_important: null,
          rank: null,
          user_added_factor: true
        }
      ])
      setNewFactor("")
    }
  }

  // const onDragEnd = result => {
  //   if (!result.destination) return

  //   const items = Array.from(impactFactors)
  //   const [reorderedItem] = items.splice(result.source.index, 1)
  //   items.splice(result.destination.index, 0, reorderedItem)

  //   const updatedItems = items.map((item, index) => ({
  //     ...item,
  //     is_important:
  //       result.destination.droppableId === "important"
  //         ? true
  //         : result.destination.droppableId === "unimportant"
  //           ? false
  //           : null,
  //     rank: result.destination.droppableId === "important" ? index + 1 : null
  //   }))

  //   setImpactFactors(updatedItems)
  // }

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

      <div className="space-y-2">
        <Label className="text-base font-semibold">
          9. What are your top priorities when choosing a college?
        </Label>
        {/* <div className="flex space-x-2">
          <Input
            value={newFactor}
            onChange={e => setNewFactor(e.target.value)}
            placeholder="Add a new factor"
          />
          <Button onClick={handleAddFactor}>Add</Button>
        </div> */}
      </div>

      <div className="flex gap-6">
        <div className="w-1/2 rounded-lg p-4">
          <ul className="space-y-2">
            {impactFactors
              .filter(factor => factor.is_important === null)
              .map(factor => (
                <li
                  key={factor.impact_factor_id}
                  draggable
                  className="rounded p-2"
                  onDragStart={e => {
                    console.log(factor)
                    handleDragStart(e, factor.impact_factor_id)
                  }}
                >
                  {factor.impact_factor}
                </li>
              ))}
          </ul>
        </div>

        <div className="w-1/2 space-y-4">
          {/* Important Factors */}
          <h3 className="mb-4 font-semibold">
            Drag and rank the important factors here
          </h3>
          <div
            className="bg-muted min-h-[120px] rounded-lg border p-4"
            onDragOver={handleDragOver}
            onDrop={handleDropOnImportant}
          >
            {/* Important factors will go here */}

            <ul>
              {impactFactors
                .filter(factor => factor.is_important)
                .map(factor => (
                  <li
                    key={factor.impact_factor_id}
                    draggable
                    className="rounded p-2"
                  >
                    {factor.impact_factor}
                  </li>
                ))}
            </ul>
          </div>

          {/* Unimportant Factors */}
          <h3 className="mb-4 font-semibold">Unimportant Factors</h3>
          <div
            className="bg-muted min-h-[120px] rounded-lg border p-4"
            onDragOver={handleDragOver}
          >
            <div
              className="bg-muted min-h-[120px] rounded-lg border p-4"
              onDragOver={handleDragOver}
              onDrop={handleDropOnUnimportant}
            >
              {/* Important factors will go here */}

              <ul>
                {impactFactors
                  .filter(factor => factor.is_important === false)
                  .map(factor => (
                    <li
                      key={factor.impact_factor_id}
                      draggable
                      className="rounded p-2"
                    >
                      {factor.impact_factor}
                    </li>
                  ))}
              </ul>
            </div>
            {/* Important factors will go here */}
          </div>
        </div>
      </div>
    </div>
    // {/* <DragDropContext onDragEnd={onDragEnd}>
    //   <div className="flex space-x-4">
    //     <Droppable droppableId="important">
    //       {(provided) => (
    //         <div
    //           {...provided.droppableProps}
    //           ref={provided.innerRef}
    //           className="w-1/3 min-h-[200px] p-4 border rounded"
    //         >
    //           <h3 className="font-semibold mb-2">Important Factors</h3>
    //           {impactFactors
    //             .filter((factor) => factor.is_important === true)
    //             .map((factor, index) => (
    //               <Draggable key={factor.impact_factor_id} draggableId={factor.impact_factor_id} index={index}>
    //                 {(provided) => (
    //                   <div
    //                     ref={provided.innerRef}
    //                     {...provided.draggableProps}
    //                     {...provided.dragHandleProps}
    //                     className="bg-white p-2 mb-2 rounded shadow"
    //                   >
    //                     {factor.impact_factor}
    //                   </div>
    //                 )}
    //               </Draggable>
    //             ))}
    //           {provided.placeholder}
    //         </div>
    //       )}
    //     </Droppable>
    //     <Droppable droppableId="unimportant">
    //       {(provided) => (
    //         <div
    //           {...provided.droppableProps}
    //           ref={provided.innerRef}
    //           className="w-1/3 min-h-[200px] p-4 border rounded"
    //         >
    //           <h3 className="font-semibold mb-2">Unimportant Factors</h3>
    //           {impactFactors
    //             .filter((factor) => factor.is_important === false)
    //             .map((factor, index) => (
    //               <Draggable key={factor.impact_factor_id} draggableId={factor.impact_factor_id} index={index}>
    //                 {(provided) => (
    //                   <div
    //                     ref={provided.innerRef}
    //                     {...provided.draggableProps}
    //                     {...provided.dragHandleProps}
    //                     className="bg-white p-2 mb-2 rounded shadow"
    //                   >
    //                     {factor.impact_factor}
    //                   </div>
    //                 )}
    //               </Draggable>
    //             ))}
    //           {provided.placeholder}
    //         </div>
    //       )}
    //     </Droppable>
    //     <Droppable droppableId="available">
    //       {(provided) => (
    //         <div
    //           {...provided.droppableProps}
    //           ref={provided.innerRef}
    //           className="w-1/3 min-h-[200px] p-4 border rounded"
    //         >
    //           <h3 className="font-semibold mb-2">Available Factors</h3>
    //           {impactFactors
    //             .filter((factor) => factor.is_important === null)
    //             .map((factor, index) => (
    //               <Draggable key={factor.impact_factor_id} draggableId={factor.impact_factor_id} index={index}>
    //                 {(provided) => (
    //                   <div
    //                     ref={provided.innerRef}
    //                     {...provided.draggableProps}
    //                     {...provided.dragHandleProps}
    //                     className="bg-white p-2 mb-2 rounded shadow"
    //                   >
    //                     {factor.impact_factor}
    //                   </div>
    //                 )}
    //               </Draggable>
    //             ))}
    //           {provided.placeholder}
    //         </div>
    //       )}
    //     </Droppable>
    //   </div>
    // </DragDropContext> */}
  )
}

export default ImpactFactorsForm
