"use client";

import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "react-beautiful-dnd";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import {
  CheckCircle2,
  CircleCheck,
  CircleEllipsis,
  MoreHorizontal,
  GripVertical,
} from "lucide-react";

interface Case {
  id: string;
  name: string;
  patient: string;
  type: string;
  date: string;
  assignedTo: string;
  status: string;
  time: string;
}

interface KanbanBoardProps {
  cases: Case[];
  onCaseUpdate: React.Dispatch<React.SetStateAction<Case[]>>;
}

export default function CasesKanbanBoard({
  cases,
  onCaseUpdate,
}: KanbanBoardProps) {
  // Get cases by status for the kanban board
  const completedCases = cases.filter(
    (caseItem) => caseItem.status === "Completed"
  );
  const reviewedCases = cases.filter(
    (caseItem) => caseItem.status === "Reviewed"
  );
  const exportedCases = cases.filter(
    (caseItem) => caseItem.status === "Exported"
  );

  // Handle drag and drop
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination } = result;

    // Get the case that was dragged
    const draggedCase = cases.find((c) => c.id === result.draggableId);
    if (!draggedCase) return;

    // Determine the new status based on the destination droppable
    let newStatus;
    switch (destination.droppableId) {
      case "completed":
        newStatus = "Completed";
        break;
      case "reviewed":
        newStatus = "Reviewed";
        break;
      case "exported":
        newStatus = "Exported";
        break;
      default:
        return;
    }

    // Update the case status
    const updatedCases = cases.map((c) =>
      c.id === draggedCase.id ? { ...c, status: newStatus } : c
    );

    onCaseUpdate(updatedCases);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Completed Column */}
        <div className="bg-[#f8fafc] rounded-lg p-4">
          <div className="flex items-center mb-4">
            <CheckCircle2 className="h-5 w-5 text-[#22c55e] mr-2" />
            <h3 className="font-medium text-[#0f172a]">Completed</h3>
            <Badge className="ml-2 bg-[#f0fdf4] text-[#22c55e]">
              {completedCases.length}
            </Badge>
          </div>

          <Droppable
            droppableId="completed"
            isDropDisabled={false}
            isCombineEnabled={true}
            ignoreContainerClipping={true}
          >
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-3 min-h-[200px]"
              >
                {completedCases.map((caseItem, index) => (
                  <Draggable
                    key={caseItem.id}
                    draggableId={caseItem.id}
                    index={index}
                  >
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className="bg-white rounded-lg p-3 border border-[#e2e8f0] shadow-sm"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <Badge className="bg-[#f0fdf4] text-[#22c55e]">
                            {caseItem.id}
                          </Badge>
                          <div className="flex items-center">
                            <div
                              {...provided.dragHandleProps}
                              className="cursor-grab mr-1"
                            >
                              <GripVertical className="h-4 w-4 text-[#94a3b8]" />
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                >
                                  <MoreHorizontal className="h-4 w-4 text-[#64748b]" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="bg-white border-[#e2e8f0] rounded-lg"
                              >
                                <DropdownMenuItem className="hover:bg-[#f1f5f9]">
                                  View Case
                                </DropdownMenuItem>
                                <DropdownMenuItem className="hover:bg-[#f1f5f9]">
                                  Edit Case
                                </DropdownMenuItem>
                                <DropdownMenuItem className="hover:bg-[#f1f5f9]">
                                  Delete Case
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        <h4 className="font-medium text-[#334155] mb-1">
                          {caseItem.name}
                        </h4>
                        <p className="text-sm text-[#64748b] mb-2">
                          {caseItem.patient}
                        </p>
                        <div className="flex justify-between items-center text-xs text-[#94a3b8]">
                          <span>{caseItem.date}</span>
                          <span>{caseItem.assignedTo.split(" ")[0]}</span>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>

        {/* Reviewed Column */}
        <div className="bg-[#f8fafc] rounded-lg p-4">
          <div className="flex items-center mb-4">
            <CircleCheck className="h-5 w-5 text-[#0ea5e9] mr-2" />
            <h3 className="font-medium text-[#0f172a]">Reviewed</h3>
            <Badge className="ml-2 bg-[#f0f9ff] text-[#0ea5e9]">
              {reviewedCases.length}
            </Badge>
          </div>

          <Droppable
            droppableId="reviewed"
            isDropDisabled={false}
            isCombineEnabled={true}
            ignoreContainerClipping={true}
          >
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-3 min-h-[200px]"
              >
                {reviewedCases.map((caseItem, index) => (
                  <Draggable
                    key={caseItem.id}
                    draggableId={caseItem.id}
                    index={index}
                  >
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className="bg-white rounded-lg p-3 border border-[#e2e8f0] shadow-sm"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <Badge className="bg-[#f0f9ff] text-[#0ea5e9]">
                            {caseItem.id}
                          </Badge>
                          <div className="flex items-center">
                            <div
                              {...provided.dragHandleProps}
                              className="cursor-grab mr-1"
                            >
                              <GripVertical className="h-4 w-4 text-[#94a3b8]" />
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                >
                                  <MoreHorizontal className="h-4 w-4 text-[#64748b]" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="bg-white border-[#e2e8f0] rounded-lg"
                              >
                                <DropdownMenuItem className="hover:bg-[#f1f5f9]">
                                  View Case
                                </DropdownMenuItem>
                                <DropdownMenuItem className="hover:bg-[#f1f5f9]">
                                  Edit Case
                                </DropdownMenuItem>
                                <DropdownMenuItem className="hover:bg-[#f1f5f9]">
                                  Delete Case
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        <h4 className="font-medium text-[#334155] mb-1">
                          {caseItem.name}
                        </h4>
                        <p className="text-sm text-[#64748b] mb-2">
                          {caseItem.patient}
                        </p>
                        <div className="flex justify-between items-center text-xs text-[#94a3b8]">
                          <span>{caseItem.date}</span>
                          <span>{caseItem.assignedTo.split(" ")[0]}</span>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>

        {/* Exported Column */}
        <div className="bg-[#f8fafc] rounded-lg p-4">
          <div className="flex items-center mb-4">
            <CircleEllipsis className="h-5 w-5 text-[#a855f7] mr-2" />
            <h3 className="font-medium text-[#0f172a]">Exported</h3>
            <Badge className="ml-2 bg-[#faf5ff] text-[#a855f7]">
              {exportedCases.length}
            </Badge>
          </div>

          <Droppable
            droppableId="exported"
            isDropDisabled={false}
            isCombineEnabled={true}
            ignoreContainerClipping={true}
          >
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-3 min-h-[200px]"
              >
                {exportedCases.map((caseItem, index) => (
                  <Draggable
                    key={caseItem.id}
                    draggableId={caseItem.id}
                    index={index}
                  >
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className="bg-white rounded-lg p-3 border border-[#e2e8f0] shadow-sm"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <Badge className="bg-[#faf5ff] text-[#a855f7]">
                            {caseItem.id}
                          </Badge>
                          <div className="flex items-center">
                            <div
                              {...provided.dragHandleProps}
                              className="cursor-grab mr-1"
                            >
                              <GripVertical className="h-4 w-4 text-[#94a3b8]" />
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                >
                                  <MoreHorizontal className="h-4 w-4 text-[#64748b]" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="bg-white border-[#e2e8f0] rounded-lg"
                              >
                                <DropdownMenuItem className="hover:bg-[#f1f5f9]">
                                  View Case
                                </DropdownMenuItem>
                                <DropdownMenuItem className="hover:bg-[#f1f5f9]">
                                  Edit Case
                                </DropdownMenuItem>
                                <DropdownMenuItem className="hover:bg-[#f1f5f9]">
                                  Delete Case
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        <h4 className="font-medium text-[#334155] mb-1">
                          {caseItem.name}
                        </h4>
                        <p className="text-sm text-[#64748b] mb-2">
                          {caseItem.patient}
                        </p>
                        <div className="flex justify-between items-center text-xs text-[#94a3b8]">
                          <span>{caseItem.date}</span>
                          <span>{caseItem.assignedTo.split(" ")[0]}</span>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>
      </div>
    </DragDropContext>
  );
}
