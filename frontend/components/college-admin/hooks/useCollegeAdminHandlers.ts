import { FormEvent } from "react";
import {
  AttainmentRange,
  AttainmentValues,
  Course,
  ProgramOutcome,
  Programme,
  Teacher,
} from "../types";
import {
  getNextPoId,
  validateAttainmentRanges,
} from "../utils/attainmentHelpers";

type SubmitResult =
  | { success: true; data: any }
  | { success: false; error: string };

type SubmitToBackend = (
  endpoint: string,
  payload: unknown,
  setPageMessage: (message: string) => void,
  method?: "POST" | "PUT" | "PATCH" | "DELETE",
) => Promise<SubmitResult>;

type HookProps = {
  submitToBackend: SubmitToBackend;
  attainmentValues: AttainmentValues;
  setAttainmentValues: React.Dispatch<React.SetStateAction<AttainmentValues>>;
  attainmentRanges: AttainmentRange[];
  setAttainmentRanges: React.Dispatch<React.SetStateAction<AttainmentRange[]>>;
  minLevel: number;
  setMinLevel: React.Dispatch<React.SetStateAction<number>>;
  maxLevel: number;
  setMaxLevel: React.Dispatch<React.SetStateAction<number>>;
  pos: ProgramOutcome[];
  setPos: React.Dispatch<React.SetStateAction<ProgramOutcome[]>>;
  setAttainmentMessage: React.Dispatch<React.SetStateAction<string>>;
  setPoMessage: React.Dispatch<React.SetStateAction<string>>;
  newPOValue: string;
  setNewPOValue: React.Dispatch<React.SetStateAction<string>>;
  programmes: Programme[];
  setProgrammes: React.Dispatch<React.SetStateAction<Programme[]>>;
  newProgrammeName: string;
  setNewProgrammeName: React.Dispatch<React.SetStateAction<string>>;
  setProgrammeMessage: React.Dispatch<React.SetStateAction<string>>;
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
  teachers: Teacher[];
  setTeachers: React.Dispatch<React.SetStateAction<Teacher[]>>;
  setFacultyMessage: React.Dispatch<React.SetStateAction<string>>;
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
  setAssignmentMessage: React.Dispatch<React.SetStateAction<string>>;
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
  courses: Course[];
  setCourses: React.Dispatch<React.SetStateAction<Course[]>>;
  setCourseMessage: React.Dispatch<React.SetStateAction<string>>;
  courseAssignment: {
    courseId: string;
    teacherId: string;
  };
  setCourseAllocationMessage: React.Dispatch<React.SetStateAction<string>>;
};

export const useCollegeAdminHandlers = ({
  submitToBackend,
  attainmentValues,
  setAttainmentValues,
  attainmentRanges,
  setAttainmentRanges,
  minLevel,
  setMinLevel,
  maxLevel,
  setMaxLevel,
  pos,
  setPos,
  setAttainmentMessage,
  setPoMessage,
  newPOValue,
  setNewPOValue,
  programmes,
  setProgrammes,
  newProgrammeName,
  setNewProgrammeName,
  setProgrammeMessage,
  newTeacher,
  setNewTeacher,
  teachers,
  setTeachers,
  setFacultyMessage,
  assignment,
  setAssignment,
  setAssignmentMessage,
  newCourse,
  setNewCourse,
  courses,
  setCourses,
  setCourseMessage,
  courseAssignment,
  setCourseAllocationMessage,
}: HookProps) => {
  const handleLevelChange = (key: keyof AttainmentValues, rawValue: string) => {
    const nextValue = Number(rawValue);

    if (Number.isNaN(nextValue)) {
      return;
    }

    setAttainmentValues((prev) => ({
      ...prev,
      [key]: nextValue,
    }));
  };

  const handleMinMaxChange = (
    field: "minLevel" | "maxLevel",
    rawValue: string,
  ) => {
    const nextValue = Number(rawValue);

    if (Number.isNaN(nextValue)) {
      return;
    }

    if (field === "minLevel") {
      setMinLevel(nextValue);
      return;
    }

    setMaxLevel(nextValue);
  };

  const handleRangeSelectChange = (
    rangeId: string,
    field: "min" | "max" | "level",
    rawValue: string,
  ) => {
    const nextValue = Number(rawValue);

    if (Number.isNaN(nextValue)) {
      return;
    }

    const nextRanges = attainmentRanges.map((range) => {
      if (range.id !== rangeId) {
        return range;
      }

      return { ...range, [field]: nextValue };
    });

    setAttainmentRanges(nextRanges);
  };

  const handleAddRange = () => {
    const nextRange: AttainmentRange = {
      id: crypto.randomUUID(),
      min: 0,
      max: 10,
      level: minLevel,
    };

    setAttainmentRanges([...attainmentRanges, nextRange]);
    setAttainmentMessage("New attainment range row added.");
  };

  const handleDeleteRange = (rangeId: string) => {
    setAttainmentRanges(
      attainmentRanges.filter((range) => range.id !== rangeId),
    );
    setAttainmentMessage("Attainment range row deleted.");
  };

  const handleAttainmentSubmit = async () => {
    const hasInvalidLevel = Object.values(attainmentValues).some(
      (value) =>
        !Number.isInteger(value) ||
        value < Math.min(minLevel, maxLevel) ||
        value > Math.max(minLevel, maxLevel),
    );

    if (hasInvalidLevel) {
      setAttainmentMessage(
        `All CO attainment fields must be selected between ${Math.min(
          minLevel,
          maxLevel,
        )} and ${Math.max(minLevel, maxLevel)}.`,
      );
      return;
    }

    const mappingValidation = validateAttainmentRanges(
      attainmentRanges,
      minLevel,
      maxLevel,
    );

    if (mappingValidation) {
      setAttainmentMessage(
        `Fix attainment range mapping: ${mappingValidation}`,
      );
      return;
    }

    setAttainmentMessage("Saving attainment configuration...");

    const payload = {
      attainmentConfig: attainmentValues,
      attainmentRanges,
      pos: pos.map((poItem) => ({
        id: poItem.id,
        po: poItem.po,
      })),
      attainmentBounds: {
        minLevel,
        maxLevel,
      },
    };

    const result = await submitToBackend(
      "/college_admin/update-attainment-config",
      payload,
      setAttainmentMessage,
    );

    if (result.success) {
      setAttainmentMessage("Attainment configuration saved successfully!");
    }
  };

  const handleAddPO = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!newPOValue.trim()) {
      setPoMessage("Enter a PO value before adding it.");
      return;
    }

    const nextPOId = getNextPoId(pos);
    const nextPO: ProgramOutcome = {
      id: nextPOId,
      po: newPOValue.trim(),
    };

    const result = await submitToBackend(
      "/college_admin/update-pos",
      { pos: [...pos, nextPO] },
      setPoMessage,
      "PUT",
    );

    if (result.success) {
      setPos([...pos, nextPO]);
      setNewPOValue("");
      setPoMessage(
        `${nextPO.id} added. Save attainment configuration to submit all POs.`,
      );
      return;
    }
  };

  const handleProgrammeCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!newProgrammeName.trim()) {
      setProgrammeMessage("Programme name is required.");
      return;
    }

    const nextProgramme: Programme = {
      _id: `programme-${programmes.length + 1}`,
      name: newProgrammeName.trim(),
    };

    setProgrammeMessage("Creating programme...");

    const result = await submitToBackend(
      "/college_admin/add-program",
      { name: nextProgramme.name },
      setProgrammeMessage,
    );

    if (result.success) {
      setProgrammes([...programmes, nextProgramme]);
      setNewProgrammeName("");
      setAssignment((prev) => ({
        ...prev,
        programmeId: prev.programmeId || nextProgramme._id,
      }));
      setProgrammeMessage("Programme created successfully!");
    }
  };

  const handleTeacherCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!newTeacher.name.trim() || !newTeacher.code.trim()) {
      setFacultyMessage("Faculty member name and login code are required.");
      return;
    }

    setFacultyMessage("Creating faculty member account...");

    const result = await submitToBackend(
      "/college_admin/add-teacher",
      {
        name: newTeacher.name.trim(),
        code: newTeacher.code.trim(),
        password: newTeacher.password.trim() || null,
        role: newTeacher.role,
      },
      setFacultyMessage,
    );

    if (result.success) {
      const nextTeacher: Teacher = {
        _id: result.data.user._id,
        name: result.data.user.name,
        code: result.data.user.code,
        role: result.data.user.role,
        programmes: result.data.user.programmes ?? [],
      };

      setTeachers([...teachers, nextTeacher]);
      setNewTeacher({ name: "", code: "", password: "", role: "TEACHER" });
      setAssignment((prev) => ({
        ...prev,
        teacherId: prev.teacherId || nextTeacher._id,
      }));
      setFacultyMessage("Faculty member account created successfully!");
    }
    console.log("Teacher creation result:", result);
  };

  const handleAssignTeacher = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!assignment.programmeId || !assignment.teacherId) {
      setAssignmentMessage("Select both a programme and a faculty member.");
      return;
    }

    setAssignmentMessage("Assigning faculty member to programme...");

    const result = await submitToBackend(
      "/college_admin/assign-teacher-program",
      {
        programmeId: assignment.programmeId,
        teacherId: assignment.teacherId,
      },
      setAssignmentMessage,
    );

    if (result.success) {
      setTeachers((prevTeachers) =>
        prevTeachers.map((teacher) => {
          if (teacher._id !== assignment.teacherId) {
            return teacher;
          }

          return {
            ...teacher,
            programmes: Array.from(
              new Set([...(teacher.programmes ?? []), assignment.programmeId]),
            ),
          };
        }),
      );
      setAssignmentMessage(
        "Faculty member assigned to programme successfully!",
      );
    }
  };

  const handleCourseCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (
      !newCourse.name.trim() ||
      !newCourse.programmeId ||
      !newCourse.semester
    ) {
      setCourseMessage("Course name, programme, and semester are required.");
      return;
    }

    setCourseMessage("Creating course...");

    const result = await submitToBackend(
      "/college_admin/add-course",
      {
        name: newCourse.name.trim(),
        programmeId: newCourse.programmeId,
        semester: Number(newCourse.semester),
      },
      setCourseMessage,
    );

    if (result.success) {
      const nextCourse: Course = {
        _id: result.data.course._id,
        name: result.data.course.name,
        programmeId: result.data.course.programmeId,
        semester: result.data.course.semester,
        collegeId: result.data.course.collegeId,
      };
      setCourses([...courses, nextCourse]);
      setNewCourse({ name: "", programmeId: "", semester: 1 });
      setCourseMessage("Course created successfully!");
    }
  };

  const handleCourseAssignment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!courseAssignment.courseId || !courseAssignment.teacherId) {
      setCourseAllocationMessage("Select both a course and a faculty member.");
      return;
    }

    setCourseAllocationMessage("Assigning faculty member to course...");

    const result = await submitToBackend(
      "/college_admin/assign-teacher-course",
      {
        courseId: courseAssignment.courseId,
        teacherId: courseAssignment.teacherId,
      },
      setCourseAllocationMessage,
    );

    if (result.success) {
      setTeachers((prevTeachers) =>
        prevTeachers.map((teacher) => {
          if (teacher._id !== courseAssignment.teacherId) {
            return teacher;
          }

          return {
            ...teacher,
            courses: Array.from(
              new Set([...(teacher.courses ?? []), courseAssignment.courseId]),
            ),
          };
        }),
      );
      setCourseAllocationMessage(
        "Faculty member assigned to course successfully!",
      );
    }
  };

  const handleCourseDelete = async (_id: string) => {
    if (!_id) {
      setCourseMessage("Course id is required for deletion.");
      return;
    }

    setCourseMessage("Deleting course...");

    const result = await submitToBackend(
      `/college_admin/delete-course/${_id}`,
      {},
      setCourseMessage,
      "DELETE",
    );

    if (result.success) {
      setCourses((prevCourses) =>
        prevCourses.filter((course) => course._id !== _id),
      );
      setCourseMessage("Course deleted successfully!");
    }
  };
  const handleProgramDelete = async (_id: string) => {
    if (!_id) {
      setProgrammeMessage("Program id is required for deletion.");
      return;
    }

    setCourseMessage("Deleting course...");

    const result = await submitToBackend(
      `/college_admin/delete-program/${_id}`,
      {},
      setProgrammeMessage,
      "DELETE",
    );

    if (result.success) {
      setProgrammes((prevProgrammes) =>
        prevProgrammes.filter((program) => program._id !== _id),
      );
      setProgrammeMessage("Program and allocations deleted successfully!");
    }
  };

  const handleRevokeProgram = async (programId: string, teacherId: string) => {
    if (!programId || !teacherId) {
      setAssignmentMessage("Select both a programme and a faculty member.");
      return;
    }
    setAssignmentMessage("Assigning faculty member to programme...");

    const result = await submitToBackend(
      `/college_admin/revoke-teacher-program/${programId}`,
      {
        teacherId: teacherId,
      },
      setAssignmentMessage,
      "PUT",
    );

    if (result.success) {
      setTeachers((prevTeachers) =>
        prevTeachers.map((teacher) => {
          if (teacher._id !== teacherId) {
            return teacher;
          }

          return {
            ...teacher,
            programmes: (teacher.programmes ?? []).filter(
              (pId) => pId !== programId,
            ),
          };
        }),
      );
      setAssignmentMessage(
        "Faculty member revoked from programme successfully!",
      );
    }
  };

  const handleRevokeCourse = async (courseId: string, teacherId: string) => {
    if (!courseId || !teacherId) {
      setCourseAllocationMessage("Select both a course and a faculty member.");
      return;
    }

    setCourseAllocationMessage("Revoking faculty member from course");

    const result = await submitToBackend(
      `/college_admin/revoke-teacher-course/${courseId}`,
      {
        teacherId,
      },
      setCourseAllocationMessage,
      "PUT",
    );

    if (result.success) {
      setTeachers((prevTeachers) =>
        prevTeachers.map((teacher) => {
          if (teacher._id !== teacherId) {
            return teacher;
          }

          return {
            ...teacher,
            courses: (teacher.courses ?? []).filter((cId) => cId !== courseId),
          };
        }),
      );
      setCourseAllocationMessage(
        "Faculty member revoked from course successfully!",
      );
    }
  };
  return {
    handleLevelChange,
    handleMinMaxChange,
    handleRangeSelectChange,
    handleAddRange,
    handleDeleteRange,
    handleAttainmentSubmit,
    handleAddPO,
    handleProgrammeCreate,
    handleTeacherCreate,
    handleAssignTeacher,
    handleCourseCreate,
    handleCourseAssignment,
    handleCourseDelete,
    handleProgramDelete,
    handleRevokeProgram,
    handleRevokeCourse,
  };
};
