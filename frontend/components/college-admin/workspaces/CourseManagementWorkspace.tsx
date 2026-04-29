import { FormEvent } from "react";
import { Plus, Search } from "lucide-react";
import { CourseByProgramme, Programme } from "../types";

type Props = {
  captionClass: string;
  panelTitleClass: string;
  fieldClass: string;
  primaryButtonClass: string;
  tableHeadClass: string;
  newCourse: {
    name: string;
    programmeId: string;
    semester: number;
  };
  setNewCourse: React.Dispatch<
    React.SetStateAction<{
      name: string;
      programmeId: string;
      semester: number;
    }>
  >;
  courseMessage: string;
  programmes: Programme[];
  courseSearch: string;
  setCourseSearch: React.Dispatch<React.SetStateAction<string>>;
  courseProgrammeFilter: string;
  setCourseProgrammeFilter: React.Dispatch<React.SetStateAction<string>>;
  courseSemesterFilter: string;
  setCourseSemesterFilter: React.Dispatch<React.SetStateAction<string>>;
  uniqueSemesters: number[];
  filteredCoursesByProgramme: CourseByProgramme[];
  handleCourseCreate: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  handleCourseDelete: (_id: string) => Promise<void>;
};

export default function CourseManagementWorkspace({
  captionClass,
  panelTitleClass,
  fieldClass,
  primaryButtonClass,
  tableHeadClass,
  newCourse,
  setNewCourse,
  courseMessage,
  programmes,
  courseSearch,
  setCourseSearch,
  courseProgrammeFilter,
  setCourseProgrammeFilter,
  courseSemesterFilter,
  setCourseSemesterFilter,
  uniqueSemesters,
  filteredCoursesByProgramme,
  handleCourseCreate,
  handleCourseDelete,
}: Props) {
  return (
    <div className="space-y-7">
      <div className="border-b border-slate-300/70 pb-5">
        <p className={captionClass}>Course Matrix</p>
        <h3 className={panelTitleClass}>Manage courses</h3>
      </div>

      <div className="border-b border-slate-300/70 pb-6">
        <p className={`${captionClass} mb-3`}>Add New Course</p>
        <form onSubmit={handleCourseCreate} className="space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_auto_auto]">
            <input
              type="text"
              value={newCourse.name}
              onChange={(e) =>
                setNewCourse((prev) => ({
                  ...prev,
                  name: e.target.value,
                }))
              }
              placeholder="Course name"
              className={fieldClass}
            />
            <select
              value={newCourse.programmeId}
              onChange={(e) =>
                setNewCourse((prev) => ({
                  ...prev,
                  programmeId: e.target.value,
                }))
              }
              className={fieldClass}
            >
              <option value="">Select Programme</option>
              {programmes.map((programme) => (
                <option key={programme._id} value={programme._id}>
                  {programme.name}
                </option>
              ))}
            </select>
            <select
              value={newCourse.semester}
              onChange={(e) =>
                setNewCourse((prev) => ({
                  ...prev,
                  semester: Number(e.target.value),
                }))
              }
              className={fieldClass}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                <option key={sem} value={sem}>
                  Semester {sem}
                </option>
              ))}
            </select>
            <button type="submit" className={primaryButtonClass}>
              <Plus className="h-4 w-4" />
              Add Course
            </button>
          </div>
        </form>
        {courseMessage && (
          <p className="mt-3 text-sm font-medium text-slate-600">
            {courseMessage}
          </p>
        )}
      </div>

      <div className="border-b border-slate-300/70 pb-6">
        <p className={`${captionClass} mb-2`}>Filter Courses</p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_1fr_1fr]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={courseSearch}
              onChange={(e) => setCourseSearch(e.target.value)}
              placeholder="Search courses"
              className={`${fieldClass} pl-9`}
            />
          </div>
          <select
            value={courseProgrammeFilter}
            onChange={(e) => setCourseProgrammeFilter(e.target.value)}
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
            value={courseSemesterFilter}
            onChange={(e) => setCourseSemesterFilter(e.target.value)}
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

      <div className="space-y-6">
        {filteredCoursesByProgramme.map((item) => (
          <div key={item.programme._id} className="space-y-3">
            <div className="rounded-lg border border-slate-300/70 bg-slate-50 px-4 py-3">
              <h4 className="font-semibold text-[#111827]">
                {item.programme.name}
              </h4>
              <p className="text-xs text-slate-500">
                {item.courses.length} course(s)
              </p>
            </div>

            <div className="overflow-auto border border-slate-200 rounded-lg bg-[#fcfdfd]">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-[#f5f7f9]">
                    <th className={tableHeadClass}>Course Name</th>
                    <th className={tableHeadClass}>Semester</th>
                    <th className={tableHeadClass}>Programme</th>
                    <th className={tableHeadClass}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70">
                  {item.courses.length > 0 ? (
                    item.courses.map((course) => (
                      <tr key={course._id} className="hover:bg-[#f7fafc]">
                        <td className="px-3 py-4 font-medium text-[#111827]">
                          {course.name}
                        </td>
                        <td className="px-3 py-4 text-slate-700">
                          Semester {course.semester}
                        </td>
                        <td className="px-3 py-4 text-slate-700">
                          {item.programme.name}
                        </td>
                        <td
                          className="px-3 py-4 text-red-500 font-bold cursor-pointer hover:text-red-700"
                          onClick={() => handleCourseDelete(course._id)}
                        >
                          Remove
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-3 py-8 text-center text-sm text-slate-500"
                      >
                        No courses assigned to this programme.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        {filteredCoursesByProgramme.length === 0 && (
          <div className="rounded-lg border border-slate-300/70 bg-slate-50 px-4 py-8 text-center">
            <p className="text-sm text-slate-500">
              No courses found for current filters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
