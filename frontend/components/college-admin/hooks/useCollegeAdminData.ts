import { SERVER_URL } from "@/constants";
import { useEffect, useState } from "react";
import {
  ATTTAINMENT_BOUND_MAX,
  ATTTAINMENT_BOUND_MIN,
  generateAttainmentOptions,
  generateNumericOptions,
  getConfiguredAttainmentBounds,
  normalizeAttainmentRanges,
} from "../utils/attainmentHelpers";
import {
  AttainmentRange,
  AttainmentValues,
  CollegeInfo,
  Course,
  ProgramOutcome,
  Programme,
  Teacher,
} from "../types";

export const useCollegeAdminData = () => {
  const [attainmentValues, setAttainmentValues] = useState<AttainmentValues>({
    directCOInternal: 1,
    directCOExternal: 1,
    indirectCOInternal: 1,
    indirectCOExternal: 1,
  });
  const [attainmentRanges, setAttainmentRanges] = useState<AttainmentRange[]>(
    [],
  );
  const [pos, setPos] = useState<ProgramOutcome[]>([]);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [minLevel, setMinLevel] = useState(1);
  const [maxLevel, setMaxLevel] = useState(5);

  const [newPOValue, setNewPOValue] = useState("");
  const [newProgrammeName, setNewProgrammeName] = useState("");
  const [newTeacher, setNewTeacher] = useState({
    name: "",
    code: "",
    password: "",
    role: "TEACHER" as "TEACHER" | "HOD",
  });
  const [assignment, setAssignment] = useState({
    programmeId: "",
    teacherId: "",
  });

  const [attainmentMessage, setAttainmentMessage] = useState("");
  const [poMessage, setPoMessage] = useState("");
  const [programmeMessage, setProgrammeMessage] = useState("");
  const [facultyMessage, setFacultyMessage] = useState("");
  const [assignmentMessage, setAssignmentMessage] = useState("");

  const [courses, setCourses] = useState<Course[]>([]);
  const [newCourse, setNewCourse] = useState({
    name: "",
    programmeId: "",
    semester: 1,
  });
  const [courseMessage, setCourseMessage] = useState("");

  const [courseAssignment, setCourseAssignment] = useState({
    courseId: "",
    teacherId: "",
  });
  const [courseAllocationMessage, setCourseAllocationMessage] = useState("");

  const [collegeInfo, setCollegeInfo] = useState<CollegeInfo>();

  const attainmentOptions = generateAttainmentOptions(minLevel, maxLevel);
  const percentageOptions = generateNumericOptions(0, 100);
  const configuredBoundOptions = generateNumericOptions(
    ATTTAINMENT_BOUND_MIN,
    ATTTAINMENT_BOUND_MAX,
  );

  useEffect(() => {
    async function fetchInitialData() {
      const res = await fetch(
        `${SERVER_URL}/college_admin/get-full-college-info`,
        {
          credentials: "include",
        },
      );

      const data = await res.json();
      if (!res?.ok) {
        setAttainmentMessage(
          data.message || "Failed to load initial data. Using defaults.",
        );
        return;
      }

      if (!data) {
        setAttainmentMessage("Invalid initial data format. Using defaults.");
        return;
      }

      const collegeAttainmentConfig = data.data.college?.attainmentConfig ?? {};
      const configuredBounds = getConfiguredAttainmentBounds(
        collegeAttainmentConfig,
      );

      setAttainmentValues({
        directCOInternal: collegeAttainmentConfig.directCOInternal ?? 1,
        directCOExternal: collegeAttainmentConfig.directCOExternal ?? 1,
        indirectCOInternal: collegeAttainmentConfig.indirectCOInternal ?? 1,
        indirectCOExternal: collegeAttainmentConfig.indirectCOExternal ?? 1,
      });
      setMinLevel(configuredBounds.minLevel);
      setMaxLevel(configuredBounds.maxLevel);
      setAttainmentRanges(
        normalizeAttainmentRanges(data.data.college?.attainmentRanges ?? []),
      );
      const fetchedPos = data.data.college?.pos ?? data.pos ?? [];
      setPos(
        fetchedPos
          .map(
            (
              poItem: {
                _id?: string;
                id?: string;
                po?: string;
                label?: string;
                value?: string;
              },
              index: number,
            ) => ({
              _id: poItem._id ?? poItem.label ?? "",
              id: poItem.id ?? poItem.label ?? `PO${index + 1}`,
              po: poItem.po ?? poItem.value ?? "",
            }),
          )
          .filter((poItem: ProgramOutcome) => Boolean(poItem.id && poItem.po)),
      );
      setProgrammes(data.data.programmes ?? []);
      setTeachers(data.data.teachers ?? []);
      setCourses(data.data.courses ?? []);
      setCollegeInfo(data.data.college ?? null);
    }

    fetchInitialData();
  }, []);

  return {
    attainmentValues,
    setAttainmentValues,
    attainmentRanges,
    setAttainmentRanges,
    pos,
    setPos,
    programmes,
    setProgrammes,
    teachers,
    setTeachers,
    minLevel,
    setMinLevel,
    maxLevel,
    setMaxLevel,
    newPOValue,
    setNewPOValue,
    newProgrammeName,
    setNewProgrammeName,
    newTeacher,
    setNewTeacher,
    assignment,
    setAssignment,
    attainmentMessage,
    setAttainmentMessage,
    poMessage,
    setPoMessage,
    programmeMessage,
    setProgrammeMessage,
    facultyMessage,
    setFacultyMessage,
    assignmentMessage,
    setAssignmentMessage,
    courses,
    setCourses,
    newCourse,
    setNewCourse,
    courseMessage,
    setCourseMessage,
    courseAssignment,
    setCourseAssignment,
    courseAllocationMessage,
    setCourseAllocationMessage,
    collegeInfo,
    setCollegeInfo,
    attainmentOptions,
    percentageOptions,
    configuredBoundOptions,
  };
};
