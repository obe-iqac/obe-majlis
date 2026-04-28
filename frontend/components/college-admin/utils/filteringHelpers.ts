import { Course, Programme, Teacher } from "../types";

export const getTeacherAssignedProgrammes = (
  programmes: Programme[],
  teacherProgrammeIds: string[] = [],
) =>
  programmes.filter((programme) => teacherProgrammeIds.includes(programme._id));

export const getProgrammeAssignedTeachers = (
  teachers: Teacher[],
  programme: Programme,
) =>
  teachers.filter((teacher) =>
    Boolean(
      teacher.programmes?.some(
        (progId) => progId.toString() === programme._id.toString(),
      ),
    ),
  );

export const getTeacherAssignedProgrammesResolved = (
  programmes: Programme[],
  teacher: Teacher,
) => getTeacherAssignedProgrammes(programmes, teacher.programmes);

export const getCourseAssignedTeachers = (
  teachers: Teacher[],
  course: Course,
) =>
  teachers.filter(
    (teacher) =>
      Array.isArray(teacher.courses) &&
      teacher.courses?.some(
        (courseId) => typeof course === "object" && courseId === course._id,
      ),
  );
