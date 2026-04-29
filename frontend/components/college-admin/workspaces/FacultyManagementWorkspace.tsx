import { FormEvent, Fragment, useState } from "react";
import { Edit3, Save, Search, UserSquare2, X } from "lucide-react";
import {
  AssignmentStatusFilter,
  FacultyRoleFilter,
  FacultyRow,
} from "../types";

type EditableFaculty = {
  name: string;
  code: string;
  password: string;
  role: "TEACHER" | "HOD";
  isActive: boolean;
};

type FacultyUpdatePayload = Partial<FacultyRow["teacher"]> & {
  password?: string;
};

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
  handleTeacherUpdate: (
    teacherId: string,
    updatedData: FacultyUpdatePayload,
  ) => Promise<void>;
};

const emptyEditableFaculty: EditableFaculty = {
  name: "",
  code: "",
  password: "",
  role: "TEACHER",
  isActive: true,
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
  handleTeacherUpdate,
}: Props) {
  const [editingTeacherId, setEditingTeacherId] = useState<string | null>(null);
  const [editableFaculty, setEditableFaculty] = useState<EditableFaculty>(
    emptyEditableFaculty,
  );

  const beginEdit = (row: FacultyRow) => {
    setEditingTeacherId(row.teacher._id);
    setEditableFaculty({
      name: row.teacher.name,
      code: row.teacher.code,
      password: "",
      role: row.teacher.role ?? "TEACHER",
      isActive: row.teacher.isActive,
    });
  };

  const cancelEdit = () => {
    setEditingTeacherId(null);
    setEditableFaculty(emptyEditableFaculty);
  };

  const submitEdit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!editingTeacherId) {
      return;
    }

    const payload: FacultyUpdatePayload = {
      name: editableFaculty.name.trim(),
      code: editableFaculty.code.trim(),
      role: editableFaculty.role,
      isActive: editableFaculty.isActive,
    };

    const nextPassword = editableFaculty.password.trim();
    if (nextPassword) {
      payload.password = nextPassword;
    }

    await handleTeacherUpdate(editingTeacherId, payload);
    cancelEdit();
  };

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
        <div className="mb-2 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <p className={captionClass}>Quick Create</p>
          <p className="text-xs font-medium text-slate-500">
            Passwords are write-only. Once set, they cannot be viewed again.
          </p>
        </div>
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
            required
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
            required
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
            placeholder="Set password"
            className={fieldClass}
            aria-describedby="new-faculty-password-note"
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
            <option value="TEACHER">Faculty</option>
            <option value="HOD">HOD</option>
          </select>
          <button type="submit" className={primaryButtonClass}>
            <UserSquare2 className="h-4 w-4" />
            Create
          </button>
        </div>
        <p id="new-faculty-password-note" className="mt-2 text-xs text-slate-500">
          The password can be set here, but it will not be shown after saving.
          To change it later, use the edit password setter.
        </p>
      </form>
      {facultyMessage && (
        <p className="text-sm font-medium text-slate-600">{facultyMessage}</p>
      )}

      <div className="overflow-auto border-y border-slate-200 bg-[#fcfdfd]">
        <p className="px-3 py-3 text-xs font-medium text-slate-500">
          Passwords are never displayed in the faculty table. Use Edit to set a
          new password when needed.
        </p>
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-[#f5f7f9]">
              <th className={tableHeadClass}>Faculty Member</th>
              <th className={tableHeadClass}>Login Code</th>
              <th className={tableHeadClass}>Role</th>
              <th className={tableHeadClass}>Assigned Programmes</th>
              <th className={tableHeadClass}>Status</th>
              <th className={tableHeadClass}>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/70">
            {filteredFacultyRows.map((row) => {
              const isEditing = editingTeacherId === row.teacher._id;
              const editFormId = `edit-faculty-${row.teacher._id}`;

              return (
                <Fragment key={row.teacher._id}>
                  <tr className={isEditing ? "bg-[#f7fafc]" : "hover:bg-[#f7fafc]"}>
                    <td className="px-3 py-4 font-medium text-[#111827]">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editableFaculty.name}
                          onChange={(e) =>
                            setEditableFaculty((prev) => ({
                              ...prev,
                              name: e.target.value,
                            }))
                          }
                          className={fieldClass}
                          form={editFormId}
                          placeholder="Faculty full name"
                          required
                        />
                      ) : (
                        row.teacher.name
                      )}
                    </td>
                    <td className="px-3 py-4 text-slate-700">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editableFaculty.code}
                          onChange={(e) =>
                            setEditableFaculty((prev) => ({
                              ...prev,
                              code: e.target.value,
                            }))
                          }
                          className={fieldClass}
                          form={editFormId}
                          placeholder="Login code"
                          required
                        />
                      ) : (
                        row.teacher.code
                      )}
                    </td>
                    <td className="px-3 py-4 text-slate-700">
                      {isEditing ? (
                        <select
                          value={editableFaculty.role}
                          onChange={(e) =>
                            setEditableFaculty((prev) => ({
                              ...prev,
                              role: e.target.value as "TEACHER" | "HOD",
                            }))
                          }
                          className={fieldClass}
                          form={editFormId}
                        >
                          <option value="TEACHER">Faculty</option>
                          <option value="HOD">HOD</option>
                        </select>
                      ) : row.teacher.role === "HOD" ? (
                        "HOD"
                      ) : (
                        "Faculty"
                      )}
                    </td>
                    <td className="px-3 py-4 text-slate-700">
                      {row.assignedProgrammes.length}
                    </td>
                    <td className="px-3 py-4 text-slate-700">
                      {isEditing ? (
                        <select
                          value={
                            editableFaculty.isActive ? "active" : "inactive"
                          }
                          onChange={(e) =>
                            setEditableFaculty((prev) => ({
                              ...prev,
                              isActive: e.target.value === "active",
                            }))
                          }
                          className={fieldClass}
                          form={editFormId}
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      ) : row.teacher.isActive ? (
                        "Active"
                      ) : (
                        "Inactive"
                      )}
                    </td>
                    <td className="px-3 py-4 text-slate-700">
                      {isEditing ? (
                        <span className="inline-flex h-9 items-center rounded-md bg-[#e7eef3] px-3 text-sm font-semibold text-[#25425a]">
                          Editing
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => beginEdit(row)}
                          className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-[#eef3f6] px-3 text-sm font-semibold text-[#25425a] transition hover:bg-[#e3ebf1] focus:outline-none focus:ring-2 focus:ring-[#2f5f86]/20"
                        >
                          <Edit3 className="h-4 w-4" />
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                  {isEditing && (
                    <tr className="bg-[#f7fafc]">
                      <td colSpan={6} className="px-3 pb-4">
                        <form
                          id={editFormId}
                          onSubmit={submitEdit}
                          className="border-t border-slate-200 pt-4"
                        >
                          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(260px,0.65fr)_minmax(260px,1fr)_auto] lg:items-start">
                            <div>
                              <label
                                htmlFor={`${editFormId}-password`}
                                className={captionClass}
                              >
                                New Password Setter
                              </label>
                              <input
                                id={`${editFormId}-password`}
                                type="password"
                                value={editableFaculty.password}
                                onChange={(e) =>
                                  setEditableFaculty((prev) => ({
                                    ...prev,
                                    password: e.target.value,
                                  }))
                                }
                                placeholder="Set new password"
                                className={`${fieldClass} mt-1`}
                              />
                            </div>
                            <p className="text-xs font-medium leading-5 text-slate-500 lg:pt-6">
                              Leave blank to keep the current password.
                              Passwords are saved securely and never shown
                              afterwards.
                            </p>
                            <div className="flex flex-wrap gap-2 lg:justify-end lg:pt-5">
                              <button
                                type="submit"
                                className={primaryButtonClass}
                              >
                                <Save className="h-4 w-4" />
                                Save Changes
                              </button>
                              <button
                                type="button"
                                onClick={cancelEdit}
                                className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-[#eef3f6] px-3 text-sm font-semibold text-[#25425a] transition hover:bg-[#e3ebf1] focus:outline-none focus:ring-2 focus:ring-[#2f5f86]/20"
                              >
                                <X className="h-4 w-4" />
                                Cancel
                              </button>
                            </div>
                          </div>
                        </form>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
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
