import { useMemo, useState } from "react";
import {
  AssignmentStatusFilter,
  AttainmentRange,
  Course,
  CourseByProgramme,
  CourseRow,
  FacultyRoleFilter,
  FacultyRow,
  Programme,
  ProgrammeRow,
  Teacher,
} from "../types";
import { validateAttainmentRanges } from "../utils/attainmentHelpers";
import {
  getCourseAssignedTeachers,
  getProgrammeAssignedTeachers,
  getTeacherAssignedProgrammesResolved,
} from "../utils/filteringHelpers";

type FilterHookProps = {
  programmes: Programme[];
  teachers: Teacher[];
  courses: Course[];
  attainmentRanges: AttainmentRange[];
  minLevel: number;
  maxLevel: number;
};

export const useCollegeAdminFilters = ({
  programmes,
  teachers,
  courses,
  attainmentRanges,
  minLevel,
  maxLevel,
}: FilterHookProps) => {
  const [facultySearch, setFacultySearch] = useState("");
  const [facultyRoleFilter, setFacultyRoleFilter] =
    useState<FacultyRoleFilter>("all");
  const [facultyAssignmentFilter, setFacultyAssignmentFilter] =
    useState<AssignmentStatusFilter>("all");

  const [programmeSearch, setProgrammeSearch] = useState("");
  const [programmeStatusFilter, setProgrammeStatusFilter] =
    useState<AssignmentStatusFilter>("all");

  const [assignmentSearch, setAssignmentSearch] = useState("");
  const [assignmentStatusFilter, setAssignmentStatusFilter] =
    useState<AssignmentStatusFilter>("all");

  const [courseSearch, setCourseSearch] = useState("");
  const [courseProgrammeFilter, setCourseProgrammeFilter] = useState("all");
  const [courseSemesterFilter, setCourseSemesterFilter] = useState("all");

  const [courseAllocationSearch, setCourseAllocationSearch] = useState("");
  const [courseAllocationProgrammeFilter, setCourseAllocationProgrammeFilter] =
    useState("all");
  const [courseAllocationSemesterFilter, setCourseAllocationSemesterFilter] =
    useState("all");

  const rangeValidationMessage = useMemo(
    () => validateAttainmentRanges(attainmentRanges, minLevel, maxLevel),
    [attainmentRanges, minLevel, maxLevel],
  );

  const programmeRows = useMemo<ProgrammeRow[]>(() => {
    return programmes.map((programme) => {
      const assignedTeachers = getProgrammeAssignedTeachers(
        teachers,
        programme,
      );
      return {
        programme,
        assignedTeachers,
        isAssigned: assignedTeachers.length > 0,
      };
    });
  }, [programmes, teachers]);

  const filteredProgrammeRows = useMemo(() => {
    return programmeRows.filter((row) => {
      const searchMatch = row.programme.name
        .toLowerCase()
        .includes(programmeSearch.trim().toLowerCase());

      const statusMatch =
        programmeStatusFilter === "all" ||
        (programmeStatusFilter === "assigned" && row.isAssigned) ||
        (programmeStatusFilter === "unassigned" && !row.isAssigned);

      return searchMatch && statusMatch;
    });
  }, [programmeRows, programmeSearch, programmeStatusFilter]);

  const facultyRows = useMemo<FacultyRow[]>(() => {
    return teachers.map((teacher) => {
      const assignedProgrammes = getTeacherAssignedProgrammesResolved(
        programmes,
        teacher,
      );
      return {
        teacher,
        assignedProgrammes,
        isAssigned: assignedProgrammes.length > 0,
      };
    });
  }, [teachers, programmes]);

  const filteredFacultyRows = useMemo(() => {
    return facultyRows.filter((row) => {
      const searchMatch = row.teacher.name
        .toLowerCase()
        .includes(facultySearch.trim().toLowerCase());

      const roleMatch =
        facultyRoleFilter === "all" || row.teacher.role === facultyRoleFilter;

      const assignmentMatch =
        facultyAssignmentFilter === "all" ||
        (facultyAssignmentFilter === "assigned" && row.isAssigned) ||
        (facultyAssignmentFilter === "unassigned" && !row.isAssigned);

      return searchMatch && roleMatch && assignmentMatch;
    });
  }, [facultyRows, facultySearch, facultyRoleFilter, facultyAssignmentFilter]);

  const filteredAssignmentRows = useMemo(() => {
    return programmeRows.filter((row) => {
      const searchMatch = row.programme.name
        .toLowerCase()
        .includes(assignmentSearch.trim().toLowerCase());

      const statusMatch =
        assignmentStatusFilter === "all" ||
        (assignmentStatusFilter === "assigned" && row.isAssigned) ||
        (assignmentStatusFilter === "unassigned" && !row.isAssigned);

      return searchMatch && statusMatch;
    });
  }, [programmeRows, assignmentSearch, assignmentStatusFilter]);
  const extractProgrammeId = (programmeId: string | Programme) => {
    return typeof programmeId === "string" ? programmeId : programmeId._id;
  };
  const coursesByProgramme = useMemo<CourseByProgramme[]>(() => {
    return programmes.map((programme) => ({
      programme,
      courses: courses.filter(
        (course) => extractProgrammeId(course.programmeId) === programme._id,
      ),
    }));
  }, [programmes, courses]);

  const filteredCoursesByProgramme = useMemo(() => {
    return coursesByProgramme.filter((item) => {
      const courseSearchMatch = item.courses.some((course) =>
        course.name.toLowerCase().includes(courseSearch.trim().toLowerCase()),
      );
      const programmesMatch =
        courseProgrammeFilter === "all" ||
        item.programme._id === courseProgrammeFilter;
      const semesterMatch =
        courseSemesterFilter === "all" ||
        item.courses.some(
          (course) => course.semester === Number(courseSemesterFilter),
        );
      return courseSearchMatch && programmesMatch && semesterMatch;
    });
  }, [
    coursesByProgramme,
    courseSearch,
    courseProgrammeFilter,
    courseSemesterFilter,
  ]);

  const uniqueSemesters = useMemo(
    () =>
      Array.from(new Set(courses.map((course) => course.semester))).sort(
        (a, b) => a - b,
      ),
    [courses],
  );

  const courseRows = useMemo<CourseRow[]>(() => {
    return courses.map((course) => {
      const assignedTeachers = getCourseAssignedTeachers(teachers, course);
      return {
        course,
        assignedTeachers,
        isAssigned: assignedTeachers.length > 0,
      };
    });
  }, [courses, teachers]);

  const filteredCourseAllocationRows = useMemo(() => {
    return courseRows.filter((row) => {
      const searchMatch = row.course.name
        .toLowerCase()
        .includes(courseAllocationSearch.trim().toLowerCase());

      const programmesMatch =
        courseAllocationProgrammeFilter === "all" ||
        (typeof row.course.programmeId === "object" &&
          row.course.programmeId._id === courseAllocationProgrammeFilter);

      const semesterMatch =
        courseAllocationSemesterFilter === "all" ||
        row.course.semester === Number(courseAllocationSemesterFilter);

      return searchMatch && programmesMatch && semesterMatch;
    });
  }, [
    courseRows,
    courseAllocationSearch,
    courseAllocationProgrammeFilter,
    courseAllocationSemesterFilter,
  ]);

  return {
    facultySearch,
    setFacultySearch,
    facultyRoleFilter,
    setFacultyRoleFilter,
    facultyAssignmentFilter,
    setFacultyAssignmentFilter,
    programmeSearch,
    setProgrammeSearch,
    programmeStatusFilter,
    setProgrammeStatusFilter,
    assignmentSearch,
    setAssignmentSearch,
    assignmentStatusFilter,
    setAssignmentStatusFilter,
    courseSearch,
    setCourseSearch,
    courseProgrammeFilter,
    setCourseProgrammeFilter,
    courseSemesterFilter,
    setCourseSemesterFilter,
    courseAllocationSearch,
    setCourseAllocationSearch,
    courseAllocationProgrammeFilter,
    setCourseAllocationProgrammeFilter,
    courseAllocationSemesterFilter,
    setCourseAllocationSemesterFilter,
    rangeValidationMessage,
    programmeRows,
    filteredProgrammeRows,
    facultyRows,
    filteredFacultyRows,
    filteredAssignmentRows,
    coursesByProgramme,
    filteredCoursesByProgramme,
    uniqueSemesters,
    courseRows,
    filteredCourseAllocationRows,
  };
};
