import { FormEvent } from "react";
import { Filter, Plus, Search } from "lucide-react";
import { AssignmentStatusFilter, ProgrammeRow } from "../types";

type Props = {
  captionClass: string;
  panelTitleClass: string;
  fieldClass: string;
  primaryButtonClass: string;
  tableHeadClass: string;
  programmeSearch: string;
  setProgrammeSearch: React.Dispatch<React.SetStateAction<string>>;
  programmeStatusFilter: AssignmentStatusFilter;
  setProgrammeStatusFilter: React.Dispatch<
    React.SetStateAction<AssignmentStatusFilter>
  >;
  newProgrammeName: string;
  setNewProgrammeName: React.Dispatch<React.SetStateAction<string>>;
  programmeMessage: string;
  filteredProgrammeRows: ProgrammeRow[];
  handleProgrammeCreate: (event: FormEvent<HTMLFormElement>) => Promise<void>;
};

export default function ProgrammeManagementWorkspace({
  captionClass,
  panelTitleClass,
  fieldClass,
  primaryButtonClass,
  tableHeadClass,
  programmeSearch,
  setProgrammeSearch,
  programmeStatusFilter,
  setProgrammeStatusFilter,
  newProgrammeName,
  setNewProgrammeName,
  programmeMessage,
  filteredProgrammeRows,
  handleProgrammeCreate,
}: Props) {
  return (
    <div className="space-y-7">
      <div className="border-b border-slate-300/70 pb-5">
        <p className={captionClass}>Programme Registry</p>
        <h3 className={panelTitleClass}>Programme management</h3>
      </div>

      <form
        onSubmit={handleProgrammeCreate}
        className="grid grid-cols-1 gap-4 border-b border-slate-300/70 pb-6 xl:grid-cols-[minmax(0,1fr)_420px]"
      >
        <div>
          <p className={`${captionClass} mb-2`}>Explore Records</p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_190px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={programmeSearch}
                onChange={(e) => setProgrammeSearch(e.target.value)}
                placeholder="Search programme name"
                className={`${fieldClass} pl-9`}
              />
            </div>
            <div className="relative">
              <Filter className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <select
                value={programmeStatusFilter}
                onChange={(e) =>
                  setProgrammeStatusFilter(
                    e.target.value as "all" | "assigned" | "unassigned",
                  )
                }
                className={`${fieldClass} pl-9`}
              >
                <option value="all">All Statuses</option>
                <option value="assigned">Assigned</option>
                <option value="unassigned">Unassigned</option>
              </select>
            </div>
          </div>
        </div>

        <div>
          <p className={`${captionClass} mb-2`}>Quick Create</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
            <input
              type="text"
              value={newProgrammeName}
              onChange={(e) => setNewProgrammeName(e.target.value)}
              placeholder="New programme name"
              className={fieldClass}
            />
            <button type="submit" className={primaryButtonClass}>
              <Plus className="h-4 w-4" />
              Add
            </button>
          </div>
        </div>
      </form>
      {programmeMessage && (
        <p className="text-sm font-medium text-slate-600">{programmeMessage}</p>
      )}

      <div className="overflow-auto border-y border-slate-200 bg-[#fcfdfd]">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-[#f5f7f9]">
              <th className={tableHeadClass}>Programme</th>
              <th className={tableHeadClass}>Assignment Status</th>
              <th className={tableHeadClass}>Faculty Members</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/70">
            {filteredProgrammeRows.map((row) => (
              <tr key={row.programme._id} className="hover:bg-[#f7fafc]">
                <td className="px-3 py-4 font-medium text-[#111827]">
                  {row.programme.name}
                </td>
                <td className="px-3 py-4 text-slate-700">
                  {row.isAssigned ? "Assigned" : "Unassigned"}
                </td>
                <td className="px-3 py-4 text-slate-700">
                  {row.isAssigned
                    ? row.assignedTeachers
                        .map((teacher) => teacher.name)
                        .join(", ")
                    : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredProgrammeRows.length === 0 && (
          <p className="px-3 py-8 text-sm text-slate-500">
            No programme records found for current filters.
          </p>
        )}
      </div>
    </div>
  );
}
