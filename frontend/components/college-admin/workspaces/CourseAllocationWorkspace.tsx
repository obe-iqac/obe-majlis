import { FormEvent } from "react";
import { ListChecks, Search } from "lucide-react";
import { Course, CourseRow, Programme, Teacher } from "../types";

type Props = {
  captionClass: string;
  panelTitleClass: string;
  fieldClass: string;
  primaryButtonClass: string;
  tableHeadClass: string;
  courseAllocationSearch: string;
  setCourseAllocationSearch: React.Dispatch<React.SetStateAction<string>>;
  courseAllocationProgrammeFilter: string;
  setCourseAllocationProgrammeFilter: React.Dispatch<
    React.SetStateAction<string>
  >;
  courseAllocationSemesterFilter: string;
  setCourseAllocationSemesterFilter: React.Dispatch<
    React.SetStateAction<string>
  >;
  uniqueSemesters: number[];
  programmes: Programme[];
  courses: Course[];
  teachers: Teacher[];
  courseAssignment: {
    courseId: string;
    teacherId: string;
  };
  setCourseAssignment: React.Dispatch<
    React.SetStateAction<{
      courseId: string;
      teacherId: string;
    }>
  >;
  courseAllocationMessage: string;
  filteredCourseAllocationRows: CourseRow[];
  handleCourseAssignment: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  handleRevokeCourse: (courseId: string, teacherId: string) => Promise<void>;
};

export default function CourseAllocationWorkspace({
  captionClass,
  panelTitleClass,
  fieldClass,
  primaryButtonClass,
  tableHeadClass,
  courseAllocationSearch,
  setCourseAllocationSearch,
  courseAllocationProgrammeFilter,
  setCourseAllocationProgrammeFilter,
  courseAllocationSemesterFilter,
  setCourseAllocationSemesterFilter,
  uniqueSemesters,
  programmes,
  courses,
  teachers,
  courseAssignment,
  setCourseAssignment,
  courseAllocationMessage,
  filteredCourseAllocationRows,
  handleCourseAssignment,
  handleRevokeCourse,
}: Props) {
  return (
    <div className="space-y-7">
      <div className="border-b border-slate-300/70 pb-5">
        <p className={captionClass}>Allocation Matrix</p>
        <h3 className={panelTitleClass}>Course allocation</h3>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Assign faculty members and HODs to courses. Manage course teaching
          assignments, specify instructors for each course across semesters.
        </p>
      </div>

      <div className="border-b border-slate-300/70 pb-6">
        <p className={`${captionClass} mb-2`}>Explore Records</p>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={courseAllocationSearch}
              onChange={(e) => setCourseAllocationSearch(e.target.value)}
              placeholder="Search course name"
              className={`${fieldClass} pl-9`}
            />
          </div>
          <select
            value={courseAllocationProgrammeFilter}
            onChange={(e) => setCourseAllocationProgrammeFilter(e.target.value)}
            className={fieldClass}
          >
            <option value="all">All Programmes</option>
            {programmes.map((programme) => (
              <option key={programme._id} value={programme._id}>
                {programme.name}
              </option>
            ))}
          </select>
          <select
            value={courseAllocationSemesterFilter}
            onChange={(e) => setCourseAllocationSemesterFilter(e.target.value)}
            className={fieldClass}
          >
            <option value="all">All Semesters</option>
            {uniqueSemesters.map((sem) => (
              <option key={sem} value={sem}>
                Semester {sem}
              </option>
            ))}
          </select>
        </div>
      </div>

      <form
        onSubmit={handleCourseAssignment}
        className="border-b border-slate-300/70 pb-6"
      >
        <p className={`${captionClass} mb-2`}>Assign faculty to course</p>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
          <select
            value={courseAssignment.courseId}
            onChange={(e) =>
              setCourseAssignment((prev) => ({
                ...prev,
                courseId: e.target.value,
              }))
            }
            className={fieldClass}
          >
            <option value="">Choose Course</option>
            {courses.map((course) => (
              <option key={course._id} value={course._id}>
                {course.name} (Semester {course.semester})
              </option>
            ))}
          </select>
          <select
            value={courseAssignment.teacherId}
            onChange={(e) =>
              setCourseAssignment((prev) => ({
                ...prev,
                teacherId: e.target.value,
              }))
            }
            className={fieldClass}
          >
            <option value="">Choose Faculty Member</option>
            {teachers
              .filter(
                (teacher) =>
                  teacher.role === "TEACHER" || teacher.role === "HOD",
              )
              .map((teacher) => (
                <option key={teacher._id} value={teacher._id}>
                  {teacher.name} ({teacher.role})
                </option>
              ))}
          </select>
          <button type="submit" className={primaryButtonClass}>
            <ListChecks className="h-4 w-4" />
            Assign
          </button>
        </div>
      </form>
      {courseAllocationMessage && (
        <p className="text-sm font-medium text-slate-600">
          {courseAllocationMessage}
        </p>
      )}

      <div className="overflow-auto border-y border-slate-200 bg-[#fcfdfd]">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-[#f5f7f9]">
              <th className={tableHeadClass}>Course</th>
              <th className={tableHeadClass}>Semester</th>
              <th className={tableHeadClass}>Programme</th>
              <th className={tableHeadClass}>Assigned Faculty</th>
              <th className={tableHeadClass}>Status</th>
              <th className={tableHeadClass}>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/70">
            {filteredCourseAllocationRows.map((row) => (
              <tr key={row.course._id} className="hover:bg-[#f7fafc]">
                <td className="px-3 py-4 font-medium text-[#111827]">
                  {row.course.name}
                </td>
                <td className="px-3 py-4 text-slate-700">
                  Semester {row.course.semester}
                </td>
                <td className="px-3 py-4 text-slate-700">
                  {typeof row.course.programmeId === "object"
                    ? row.course.programmeId.name
                    : "-"}
                </td>
                <td className="px-3 py-4 text-slate-700">
                  {row.assignedTeachers.length > 0
                    ? row.assignedTeachers
                        .map((teacher) => teacher.name)
                        .join(", ")
                    : "-"}
                </td>
                <td className="px-3 py-4 text-slate-700">
                  {row.isAssigned ? "Assigned" : "Unassigned"}
                </td>
                <td
                  onClick={() => {
                    if (!row.isAssigned) {
                      alert("No faculty assigned to revoke for this course.");
                      return;
                    } else {
                      handleRevokeCourse(
                        row.course._id,
                        row.assignedTeachers[0]?._id || "",
                      );
                    }
                  }}
                  className="px-3 py-4 font-bold text-red-500 cursor-pointer"
                >
                  UNASSIGN
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredCourseAllocationRows.length === 0 && (
          <p className="px-3 py-8 text-sm text-slate-500">
            No course allocation records found for current filters.
          </p>
        )}
      </div>
    </div>
  );
}
