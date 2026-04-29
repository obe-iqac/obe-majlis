export type AttainmentValues = {
  directCOInternal: number;
  directCOExternal: number;
  indirectCOInternal: number;
  indirectCOExternal: number;
};

export type AttainmentRange = {
  id: string;
  min: number;
  max: number;
  level: number;
};

export type ProgramOutcome = {
  _id?: string;
  id: string;
  po: string;
};

export type Programme = {
  _id: string;
  name: string;
};

export type Teacher = {
  _id: string;
  name: string;
  code: string;
  role?: "TEACHER" | "HOD";
  programmes?: string[];
  courses?: string[];
  isActive: boolean;
};

export type CollegeInfo = {
  name: string;
  attainmentConfig?: Partial<AttainmentValues>;
  attainmentRanges?: Partial<AttainmentRange>[];
};

export type Course = {
  _id: string;
  name: string;
  programmeId: string | Programme;
  semester: number;
  collegeId: string;
};

export type WorkspaceMode =
  | "attainment"
  | "programOutcomes"
  | "programmeManagement"
  | "facultyManagement"
  | "programmeSuperv"
  | "courseAllocation"
  | "courseManagement";

export type AssignmentStatusFilter = "all" | "assigned" | "unassigned";
export type FacultyRoleFilter = "all" | "TEACHER" | "HOD";

export type ProgrammeRow = {
  programme: Programme;
  assignedTeachers: Teacher[];
  isAssigned: boolean;
};

export type FacultyRow = {
  teacher: Teacher;
  assignedProgrammes: Programme[];
  isAssigned: boolean;
};

export type CourseByProgramme = {
  programme: Programme;
  courses: Course[];
};

export type CourseRow = {
  course: Course;
  assignedTeachers: Teacher[];
  isAssigned: boolean;
};
