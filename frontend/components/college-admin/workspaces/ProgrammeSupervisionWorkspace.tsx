import { FormEvent } from "react";
import { ListChecks, Search } from "lucide-react";
import {
  AssignmentStatusFilter,
  Programme,
  ProgrammeRow,
  Teacher,
} from "../types";

type Props = {
  captionClass: string;
  panelTitleClass: string;
  fieldClass: string;
  primaryButtonClass: string;
  tableHeadClass: string;
  assignmentSearch: string;
  setAssignmentSearch: React.Dispatch<React.SetStateAction<string>>;
  assignmentStatusFilter: AssignmentStatusFilter;
  setAssignmentStatusFilter: React.Dispatch<
    React.SetStateAction<AssignmentStatusFilter>
  >;
  assignment: {
    programmeId: string;
    teacherId: string;
  };
  setAssignment: React.Dispatch<
    React.SetStateAction<{
      programmeId: string;
      teacherId: string;
    }>
  >;
  programmes: Programme[];
  teachers: Teacher[];
  assignmentMessage: string;
  filteredAssignmentRows: ProgrammeRow[];
  handleAssignTeacher: (event: FormEvent<HTMLFormElement>) => Promise<void>;
};

export default function ProgrammeSupervisionWorkspace({
  captionClass,
  panelTitleClass,
  fieldClass,
  primaryButtonClass,
  tableHeadClass,
  assignmentSearch,
  setAssignmentSearch,
  assignmentStatusFilter,
  setAssignmentStatusFilter,
  assignment,
  setAssignment,
  programmes,
  teachers,
  assignmentMessage,
  filteredAssignmentRows,
  handleAssignTeacher,
}: Props) {
  return (
    <div className="space-y-7">
      <div className="border-b border-slate-300/70 pb-5">
        <p className={captionClass}>Supervision Matrix</p>
        <h3 className={panelTitleClass}>Programme supervision</h3>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Assign Heads of Departments (HODs) to supervise and monitor academic
          programmes. HODs oversee programme delivery, quality assurance, and
          faculty coordination.
        </p>
      </div>

      <div className="border-b border-slate-300/70 pb-6">
        <p className={`${captionClass} mb-2`}>Explore Records</p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_190px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={assignmentSearch}
              onChange={(e) => setAssignmentSearch(e.target.value)}
              placeholder="Search programme"
              className={`${fieldClass} pl-9`}
            />
          </div>
          <select
            value={assignmentStatusFilter}
            onChange={(e) =>
              setAssignmentStatusFilter(
                e.target.value as "all" | "assigned" | "unassigned",
              )
            }
            className={fieldClass}
          >
            <option value="all">All Statuses</option>
            <option value="assigned">Supervised</option>
            <option value="unassigned">Unsupervised</option>
          </select>
        </div>
      </div>

      <form
        onSubmit={handleAssignTeacher}
        className="border-b border-slate-300/70 pb-6"
      >
        <p className={`${captionClass} mb-2`}>
          Assign HOD for programme supervision
        </p>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
          <select
            value={assignment.programmeId}
            onChange={(e) =>
              setAssignment((prev) => ({
                ...prev,
                programmeId: e.target.value,
              }))
            }
            className={fieldClass}
          >
            <option value="">Choose Programme</option>
            {programmes.map((programme) => (
              <option key={programme._id} value={programme._id}>
                {programme.name}
              </option>
            ))}
          </select>
          <select
            value={assignment.teacherId}
            onChange={(e) =>
              setAssignment((prev) => ({
                ...prev,
                teacherId: e.target.value,
              }))
            }
            className={fieldClass}
          >
            <option value="">Choose HOD</option>
            {teachers
              .filter((teacher) => teacher.role === "HOD")
              .map((teacher) => (
                <option key={teacher._id} value={teacher._id}>
                  {teacher.name}
                </option>
              ))}
          </select>
          <button type="submit" className={primaryButtonClass}>
            <ListChecks className="h-4 w-4" />
            Assign
          </button>
        </div>
      </form>
      {assignmentMessage && (
        <p className="text-sm font-medium text-slate-600">
          {assignmentMessage}
        </p>
      )}

      <div className="overflow-auto border-y border-slate-200 bg-[#fcfdfd]">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-[#f5f7f9]">
              <th className={tableHeadClass}>Programme</th>
              <th className={tableHeadClass}>Supervisor (HOD)</th>
              <th className={tableHeadClass}>Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/70">
            {filteredAssignmentRows.map((row) => (
              <tr key={row.programme._id} className="hover:bg-[#f7fafc]">
                <td className="px-3 py-4 font-medium text-[#111827]">
                  {row.programme.name}
                </td>
                <td className="px-3 py-4 text-slate-700">
                  {row.assignedTeachers.length > 0
                    ? row.assignedTeachers
                        .map((teacher) => teacher.name)
                        .join(", ")
                    : "-"}
                </td>
                <td className="px-3 py-4 text-slate-700">
                  {row.isAssigned ? "Supervised" : "Unsupervised"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredAssignmentRows.length === 0 && (
          <p className="px-3 py-8 text-sm text-slate-500">
            No supervision records found for current filters.
          </p>
        )}
      </div>
    </div>
  );
}
