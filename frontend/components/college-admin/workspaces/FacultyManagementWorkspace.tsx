import { FormEvent } from "react";
import { Search, UserSquare2 } from "lucide-react";
import {
  AssignmentStatusFilter,
  FacultyRoleFilter,
  FacultyRow,
} from "../types";

type Props = {
  captionClass: string;
  panelTitleClass: string;
  fieldClass: string;
  primaryButtonClass: string;
  tableHeadClass: string;
  facultySearch: string;
  setFacultySearch: React.Dispatch<React.SetStateAction<string>>;
  facultyRoleFilter: FacultyRoleFilter;
  setFacultyRoleFilter: React.Dispatch<React.SetStateAction<FacultyRoleFilter>>;
  facultyAssignmentFilter: AssignmentStatusFilter;
  setFacultyAssignmentFilter: React.Dispatch<
    React.SetStateAction<AssignmentStatusFilter>
  >;
  newTeacher: {
    name: string;
    code: string;
    password: string;
    role: "TEACHER" | "HOD";
  };
  setNewTeacher: React.Dispatch<
    React.SetStateAction<{
      name: string;
      code: string;
      password: string;
      role: "TEACHER" | "HOD";
    }>
  >;
  facultyMessage: string;
  filteredFacultyRows: FacultyRow[];
  handleTeacherCreate: (event: FormEvent<HTMLFormElement>) => Promise<void>;
};

export default function FacultyManagementWorkspace({
  captionClass,
  panelTitleClass,
  fieldClass,
  primaryButtonClass,
  tableHeadClass,
  facultySearch,
  setFacultySearch,
  facultyRoleFilter,
  setFacultyRoleFilter,
  facultyAssignmentFilter,
  setFacultyAssignmentFilter,
  newTeacher,
  setNewTeacher,
  facultyMessage,
  filteredFacultyRows,
  handleTeacherCreate,
}: Props) {
  return (
    <div className="space-y-7">
      <div className="border-b border-slate-300/70 pb-5">
        <p className={captionClass}>Faculty Directory</p>
        <h3 className={panelTitleClass}>Faculty management</h3>
      </div>

      <div className="border-b border-slate-300/70 pb-6">
        <p className={`${captionClass} mb-2`}>Filter Records</p>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={facultySearch}
              onChange={(e) => setFacultySearch(e.target.value)}
              placeholder="Search faculty name"
              className={`${fieldClass} pl-9`}
            />
          </div>
          <select
            value={facultyRoleFilter}
            onChange={(e) =>
              setFacultyRoleFilter(e.target.value as "all" | "TEACHER" | "HOD")
            }
            className={fieldClass}
          >
            <option value="all">All Roles</option>
            <option value="TEACHER">Faculty Members</option>
            <option value="HOD">Head Of Department</option>
          </select>
          <select
            value={facultyAssignmentFilter}
            onChange={(e) =>
              setFacultyAssignmentFilter(
                e.target.value as "all" | "assigned" | "unassigned",
              )
            }
            className={fieldClass}
          >
            <option value="all">All Assignments</option>
            <option value="assigned">Assigned</option>
            <option value="unassigned">Unassigned</option>
          </select>
        </div>
      </div>

      <form
        onSubmit={handleTeacherCreate}
        className="border-b border-slate-300/70 pb-6"
      >
        <p className={`${captionClass} mb-2`}>Quick Create</p>
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_160px_160px_180px_auto]">
          <input
            type="text"
            value={newTeacher.name}
            onChange={(e) =>
              setNewTeacher((prev) => ({
                ...prev,
                name: e.target.value,
              }))
            }
            placeholder="Faculty full name"
            className={fieldClass}
          />
          <input
            type="text"
            value={newTeacher.code}
            onChange={(e) =>
              setNewTeacher((prev) => ({
                ...prev,
                code: e.target.value,
              }))
            }
            placeholder="Login code"
            className={fieldClass}
          />
          <input
            type="password"
            value={newTeacher.password}
            onChange={(e) =>
              setNewTeacher((prev) => ({
                ...prev,
                password: e.target.value,
              }))
            }
            placeholder="Password"
            className={fieldClass}
          />
          <select
            value={newTeacher.role}
            onChange={(e) =>
              setNewTeacher((prev) => ({
                ...prev,
                role: e.target.value as "TEACHER" | "HOD",
              }))
            }
            className={fieldClass}
          >
            <option value="TEACHER">Faculty Member</option>
            <option value="HOD">Head Of Department</option>
          </select>
          <button type="submit" className={primaryButtonClass}>
            <UserSquare2 className="h-4 w-4" />
            Create
          </button>
        </div>
      </form>
      {facultyMessage && (
        <p className="text-sm font-medium text-slate-600">{facultyMessage}</p>
      )}

      <div className="overflow-auto border-y border-slate-200 bg-[#fcfdfd]">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-[#f5f7f9]">
              <th className={tableHeadClass}>Faculty Member</th>
              <th className={tableHeadClass}>Login Code</th>
              <th className={tableHeadClass}>Role</th>
              <th className={tableHeadClass}>Assigned Programmes</th>
              <th className={tableHeadClass}>Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/70">
            {filteredFacultyRows.map((row) => (
              <tr key={row.teacher._id} className="hover:bg-[#f7fafc]">
                <td className="px-3 py-4 font-medium text-[#111827]">
                  {row.teacher.name}
                </td>
                <td className="px-3 py-4 text-slate-700">{row.teacher.code}</td>
                <td className="px-3 py-4 text-slate-700">
                  {row.teacher.role === "HOD"
                    ? "Head Of Department"
                    : "Faculty Member"}
                </td>
                <td className="px-3 py-4 text-slate-700">
                  {row.assignedProgrammes.length}
                </td>
                <td className="px-3 py-4 text-slate-700">
                  {row.isAssigned ? "Assigned" : "Unassigned"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredFacultyRows.length === 0 && (
          <p className="px-3 py-8 text-sm text-slate-500">
            No faculty records found for current filters.
          </p>
        )}
      </div>
    </div>
  );
}
