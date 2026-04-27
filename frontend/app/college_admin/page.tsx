"use client";

import { SERVER_URL } from "@/constants";
import { FormEvent, useEffect, useState } from "react";
import {
  BadgeCheck,
  BookOpen,
  Briefcase,
  Filter,
  GitBranchPlus,
  GraduationCap,
  Layers,
  ListChecks,
  Plus,
  Save,
  Search,
  Target,
  UserRound,
  UserSquare2,
  Users,
} from "lucide-react";

type AttainmentValues = {
  directCOInternal: number;
  directCOExternal: number;
  indirectCOInternal: number;
  indirectCOExternal: number;
};

type AttainmentRange = {
  id: string;
  min: number;
  max: number;
  level: number;
};

type ProgramOutcome = {
  id: string;
  po: string;
};

type Programme = {
  _id: string;
  name: string;
  teacherId: string | null;
};

type Teacher = {
  _id: string;
  name: string;
  code: string;
  role?: "TEACHER" | "HOD";
  programmes?: string[];
};

type CollegeInfo = {
  name: string;

  attainmentConfig?: Partial<AttainmentValues>;
  attainmentRanges?: Partial<AttainmentRange>[];
};
type WorkspaceMode =
  | "attainment"
  | "programOutcomes"
  | "programmeManagement"
  | "facultyManagement"
  | "facultyAssignment";

const ATTTAINMENT_BOUND_MIN = 1;
const ATTTAINMENT_BOUND_MAX = 20;

const generateNumericOptions = (min: number, max: number) => {
  const lowerBound = Math.min(min, max);
  const upperBound = Math.max(min, max);

  return Array.from(
    { length: upperBound - lowerBound + 1 },
    (_, index) => lowerBound + index,
  );
};

const generateAttainmentOptions = (min: number, max: number) =>
  generateNumericOptions(min, max);

const getConfiguredAttainmentBounds = (
  attainmentConfig?: Partial<AttainmentValues>,
) => {
  const configuredValues = Object.values(attainmentConfig ?? {}).filter(
    (value): value is number =>
      typeof value === "number" && !Number.isNaN(value),
  );

  if (configuredValues.length === 0) {
    return {
      minLevel: 1,
      maxLevel: 5,
    };
  }

  return {
    minLevel: Math.min(...configuredValues),
    maxLevel: Math.max(...configuredValues),
  };
};

const mergeOptionsWithCurrentValue = (
  options: number[],
  currentValue: number,
) => {
  if (options.includes(currentValue)) {
    return options;
  }

  return [...options, currentValue].sort((left, right) => left - right);
};

const normalizeAttainmentRanges = (
  ranges: Partial<AttainmentRange>[] = [],
): AttainmentRange[] => {
  const usedIds = new Set<string>();

  return ranges.map((range, index) => {
    const id =
      range.id && !usedIds.has(range.id)
        ? range.id
        : `range-${index}-${range.min ?? 0}-${range.max ?? 0}-${
            range.level ?? 1
          }`;

    usedIds.add(id);

    return {
      id,
      min: range.min ?? 0,
      max: range.max ?? 10,
      level: range.level ?? 1,
    };
  });
};

const getNextPoId = (existingPos: ProgramOutcome[]) => {
  const maxPoNumber = existingPos.reduce((maxSoFar, currentPo) => {
    const matchedNumber = Number(currentPo.id.replace(/^PO/i, ""));

    if (Number.isNaN(matchedNumber)) {
      return maxSoFar;
    }

    return Math.max(maxSoFar, matchedNumber);
  }, 0);

  return `PO${maxPoNumber + 1}`;
};

const submitToBackend = async (
  endpoint: string,
  payload: unknown,
  setPageMessage: (message: string) => void,
  method: "POST" | "PUT" | "PATCH" = "POST",
) => {
  try {
    const response = await fetch(`${SERVER_URL}${endpoint}`, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        error.message || `Request failed with status ${response.status}`,
      );
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "An error occurred";
    setPageMessage(`Error: ${errorMessage}`);
    return { success: false, error: errorMessage };
  }
};

const validateAttainmentRanges = (
  ranges: AttainmentRange[],
  minLevel: number,
  maxLevel: number,
) => {
  if (ranges.length === 0) {
    return "Add at least one attainment range.";
  }

  for (const range of ranges) {
    if (!Number.isInteger(range.min) || !Number.isInteger(range.max)) {
      return "Minimum and maximum percentages must be integers.";
    }

    if (range.min < 0 || range.max > 100) {
      return "Each range must stay within 0% to 100%.";
    }

    if (range.min >= range.max) {
      return "Each range must have Min % less than Max %.";
    }

    if (
      !Number.isInteger(range.level) ||
      range.level < Math.min(minLevel, maxLevel) ||
      range.level > Math.max(minLevel, maxLevel)
    ) {
      return `Attainment level must be an integer between ${Math.min(
        minLevel,
        maxLevel,
      )} and ${Math.max(minLevel, maxLevel)}.`;
    }
  }

  const sortedRanges = [...ranges].sort((a, b) => a.min - b.min);

  if (sortedRanges[0].min !== 0) {
    return "Ranges must start from 0%.";
  }

  if (sortedRanges[sortedRanges.length - 1].max !== 100) {
    return "Ranges must end at 100%.";
  }

  for (let index = 1; index < sortedRanges.length; index += 1) {
    const previous = sortedRanges[index - 1];
    const current = sortedRanges[index];

    if (current.min < previous.max) {
      return `Ranges overlap between ${previous.min}-${previous.max} and ${current.min}-${current.max}.`;
    }

    if (current.min > previous.max) {
      return `Ranges must be continuous. Gap found between ${previous.max}% and ${current.min}%.`;
    }
  }

  return "";
};

export default function CollegeAdminPage() {
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

  const [activeWorkspace, setActiveWorkspace] =
    useState<WorkspaceMode>("attainment");

  const [facultySearch, setFacultySearch] = useState("");
  const [facultyRoleFilter, setFacultyRoleFilter] = useState<
    "all" | "TEACHER" | "HOD"
  >("all");
  const [facultyAssignmentFilter, setFacultyAssignmentFilter] = useState<
    "all" | "assigned" | "unassigned"
  >("all");

  const [programmeSearch, setProgrammeSearch] = useState("");
  const [programmeStatusFilter, setProgrammeStatusFilter] = useState<
    "all" | "assigned" | "unassigned"
  >("all");

  const [assignmentSearch, setAssignmentSearch] = useState("");
  const [assignmentStatusFilter, setAssignmentStatusFilter] = useState<
    "all" | "assigned" | "unassigned"
  >("all");

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
                id?: string;
                po?: string;
                label?: string;
                value?: string;
              },
              index: number,
            ) => ({
              id: poItem.id ?? poItem.label ?? `PO${index + 1}`,
              po: poItem.po ?? poItem.value ?? "",
            }),
          )
          .filter((poItem: ProgramOutcome) => Boolean(poItem.id && poItem.po)),
      );
      setProgrammes(data.data.programmes ?? []);
      setTeachers(data.data.teachers ?? []);
      setCollegeInfo(data.data.college ?? null);
    }

    fetchInitialData();
  }, []);

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
      teacherId: null,
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
      "/college_admin/assign-teacher",
      {
        programmeId: assignment.programmeId,
        teacherId: assignment.teacherId,
      },
      setAssignmentMessage,
    );

    if (result.success) {
      setProgrammes(
        programmes.map((programme) =>
          programme._id === assignment.programmeId
            ? { ...programme, teacherId: assignment.teacherId }
            : programme,
        ),
      );
      setAssignmentMessage(
        "Faculty member assigned to programme successfully!",
      );
    }
  };

  const getTeacherAssignedProgrammes = (teacherProgrammeIds: string[] = []) =>
    programmes.filter((programme) =>
      teacherProgrammeIds.includes(programme._id),
    );

  const attainmentValueOptions = (currentValue: number) =>
    mergeOptionsWithCurrentValue(attainmentOptions, currentValue);

  const boundValueOptions = (currentValue: number) =>
    mergeOptionsWithCurrentValue(configuredBoundOptions, currentValue);

  const rangeValidationMessage = validateAttainmentRanges(
    attainmentRanges,
    minLevel,
    maxLevel,
  );

  const getProgrammeAssignedTeachers = (programme: Programme) =>
    teachers.filter(
      (teacher) =>
        teacher._id === programme.teacherId ||
        Boolean(
          teacher.programmes?.some(
            (progId) => progId.toString() === programme._id.toString(),
          ),
        ),
    );

  const getTeacherAssignedProgrammesResolved = (teacher: Teacher) => {
    const fromTeacherProgrammes = getTeacherAssignedProgrammes(
      teacher.programmes,
    );
    const fromProgrammeOwner = programmes.filter(
      (programme) => programme.teacherId === teacher._id,
    );

    const unique = new Map<string, Programme>();
    [...fromTeacherProgrammes, ...fromProgrammeOwner].forEach((programme) => {
      unique.set(programme._id, programme);
    });

    return Array.from(unique.values());
  };

  const programmeRows = programmes.map((programme) => {
    const assignedTeachers = getProgrammeAssignedTeachers(programme);
    return {
      programme,
      assignedTeachers,
      isAssigned: assignedTeachers.length > 0,
    };
  });

  const filteredProgrammeRows = programmeRows.filter((row) => {
    const searchMatch = row.programme.name
      .toLowerCase()
      .includes(programmeSearch.trim().toLowerCase());

    const statusMatch =
      programmeStatusFilter === "all" ||
      (programmeStatusFilter === "assigned" && row.isAssigned) ||
      (programmeStatusFilter === "unassigned" && !row.isAssigned);

    return searchMatch && statusMatch;
  });

  const facultyRows = teachers.map((teacher) => {
    const assignedProgrammes = getTeacherAssignedProgrammesResolved(teacher);
    return {
      teacher,
      assignedProgrammes,
      isAssigned: assignedProgrammes.length > 0,
    };
  });

  const filteredFacultyRows = facultyRows.filter((row) => {
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

  const filteredAssignmentRows = programmeRows.filter((row) => {
    const searchMatch = row.programme.name
      .toLowerCase()
      .includes(assignmentSearch.trim().toLowerCase());

    const statusMatch =
      assignmentStatusFilter === "all" ||
      (assignmentStatusFilter === "assigned" && row.isAssigned) ||
      (assignmentStatusFilter === "unassigned" && !row.isAssigned);

    return searchMatch && statusMatch;
  });

  const workspaceTabs: {
    id: WorkspaceMode;
    label: string;
    icon: typeof Layers;
  }[] = [
    {
      id: "attainment",
      label: "Attainment Configuration",
      icon: Layers,
    },
    {
      id: "programOutcomes",
      label: "Program Outcomes",
      icon: Target,
    },
    {
      id: "programmeManagement",
      label: "Programme Management",
      icon: GraduationCap,
    },
    {
      id: "facultyManagement",
      label: "Faculty Management",
      icon: UserRound,
    },
    {
      id: "facultyAssignment",
      label: "Faculty Assignment",
      icon: Briefcase,
    },
  ];

  const kpis = [
    {
      title: "Program Outcomes",
      value: pos.length,
      icon: Target,
    },
    {
      title: "Programmes",
      value: programmes.length,
      icon: BookOpen,
    },
    {
      title: "Faculty Members",
      value: teachers.length,
      icon: Users,
    },
    {
      title: "Assigned Programmes",
      value: programmeRows.filter((row) => row.isAssigned).length,
      icon: BadgeCheck,
    },
  ];

  const activeWorkspaceMeta = workspaceTabs.find(
    (workspace) => workspace.id === activeWorkspace,
  );
  const fieldClass =
    "h-10 w-full rounded-md border-0 bg-[#f4f6f8] px-3 text-sm font-medium text-slate-900 outline-none ring-1 ring-inset ring-slate-300/70 transition placeholder:font-normal placeholder:text-slate-400 hover:bg-white focus:bg-white focus:ring-2 focus:ring-[#2f5f86]/35";
  const compactFieldClass =
    "h-9 w-full rounded-md border-0 bg-[#f4f6f8] px-2.5 text-sm font-medium text-slate-900 outline-none ring-1 ring-inset ring-slate-300/70 transition hover:bg-white focus:bg-white focus:ring-2 focus:ring-[#2f5f86]/35";
  const primaryButtonClass =
    "inline-flex h-9 items-center justify-center gap-2 rounded-md bg-[#17324a] px-3.5 text-sm font-semibold text-white transition hover:bg-[#10263a] focus:outline-none focus:ring-2 focus:ring-[#17324a]/20";
  const secondaryButtonClass =
    "inline-flex h-9 items-center justify-center gap-2 rounded-md bg-[#eef3f6] px-3 text-sm font-semibold text-[#25425a] transition hover:bg-[#e3ebf1] focus:outline-none focus:ring-2 focus:ring-[#2f5f86]/20";
  const captionClass = "text-[0.68rem] font-bold uppercase text-[#587089]";
  const panelTitleClass = "mt-1 text-xl font-semibold text-[#111827]";
  const tableHeadClass =
    "px-3 py-3 text-left text-[0.68rem] font-bold uppercase text-[#64748b]";

  return (
    <main className="min-h-screen bg-[#eef1f4] text-slate-950">
      <div className="mx-auto grid min-h-screen w-full max-w-[1440px] grid-cols-1 lg:grid-cols-[228px_minmax(0,1fr)]">
        <aside className="border-b border-slate-200 bg-white px-4 py-5 lg:border-b-0 lg:border-r lg:px-3 lg:py-6">
          {/* HEADER */}
          <div className="mb-5 px-1">
            <p className={captionClass}>Workspace</p>
            <h1 className="mt-1 text-lg font-semibold text-[#101827]">
              {collegeInfo?.name ?? "College"} Admin
            </h1>
          </div>

          {/* KPI SECTION */}
          <div className="grid grid-cols-2 gap-2 border-t border-slate-200 pt-4 lg:hidden">
            {kpis.map((kpi) => {
              const Icon = kpi.icon;
              return (
                <div
                  key={kpi.title}
                  className="rounded-xl border border-slate-200 bg-[#f8fafc] px-3 py-3"
                >
                  <div className="flex items-center gap-2 text-[#64748b]">
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <p className="truncate text-[0.62rem] font-bold uppercase tracking-wide">
                      {kpi.title}
                    </p>
                  </div>
                  <p className="mt-1 text-xl font-semibold text-[#0f172a]">
                    {kpi.value}
                  </p>
                </div>
              );
            })}
          </div>
          <div className="mt-5 mb-2 px-1">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-slate-400">
              Admin Modules
            </p>
          </div>
          {/* NAVIGATION */}
          <nav className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1">
            {workspaceTabs.map((workspace) => {
              const Icon = workspace.icon;
              const isActive = activeWorkspace === workspace.id;

              return (
                <button
                  key={workspace.id}
                  type="button"
                  onClick={() => setActiveWorkspace(workspace.id)}
                  className={`group relative flex h-12 w-full items-center gap-3 rounded-xl border px-3 text-left text-sm transition-all duration-200 ${
                    isActive
                      ? "border-[#c8d9e8] bg-[#eaf2f8] font-semibold text-[#14324a] shadow-sm before:absolute before:left-0 before:top-2 before:h-8 before:w-1 before:rounded-r-full before:bg-[#2f5f86]"
                      : "border-slate-200 bg-white font-medium text-slate-600 hover:border-slate-300 hover:bg-[#f8fafc] hover:text-[#14324a]"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 shrink-0 transition-colors ${
                      isActive
                        ? "text-[#2f5f86]"
                        : "text-slate-400 group-hover:text-[#2f5f86]"
                    }`}
                  />
                  <span className="truncate">{workspace.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        <div className="min-w-0 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
          <header className="mb-6">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <p className={captionClass}>College Administration</p>
                <h2 className="mt-1 text-2xl font-semibold text-[#0f172a] sm:text-3xl">
                  {activeWorkspaceMeta?.label}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  Govern outcomes, attainment policy, programmes, and faculty
                  assignments from one institutional control surface.
                </p>
              </div>

              <div className="hidden lg:grid gap-x-7 gap-y-4 border-t border-slate-300/70 pt-4 grid-cols-4 border-t-0 pt-0">
                {kpis.map((kpi) => {
                  const Icon = kpi.icon;
                  return (
                    <div
                      key={kpi.title}
                      className="min-w-0 border-l border-slate-300/80 pl-3"
                    >
                      <div className="flex items-center gap-2 text-[#64748b]">
                        <Icon className="h-3.5 w-3.5" />
                        <p className="truncate text-[0.68rem] font-bold uppercase">
                          {kpi.title}
                        </p>
                      </div>
                      <p className="mt-1 text-2xl font-semibold text-[#0f172a]">
                        {kpi.value}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </header>

          <section className="min-w-0 bg-[#fbfbfa] px-4 py-5 ring-1 ring-slate-200/80 sm:px-6 lg:px-8 lg:py-7">
            {activeWorkspace === "attainment" && (
              <div className="space-y-8">
                <div className="flex flex-col gap-4 border-b border-slate-300/70 pb-6 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className={captionClass}>Attainment Policy</p>
                    <h3 className={panelTitleClass}>
                      Configure institutional attainment rules
                    </h3>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                      Set the academic level boundaries, course outcome target
                      levels, and the percentage range mapping used across the
                      programme.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAttainmentSubmit}
                    className={primaryButtonClass}
                  >
                    <Save className="h-4 w-4" />
                    Save Configuration
                  </button>
                </div>

                <div className="bg-[#f3f6f8] px-4 py-5 ring-1 ring-inset ring-slate-200/80 sm:px-5">
                  <div className="grid grid-cols-1 divide-y divide-slate-300/70 lg:grid-cols-3 lg:divide-x lg:divide-y-0">
                    <div className="pb-6 lg:pb-0 lg:pr-7">
                      <p className={captionClass}>Academic Boundaries</p>
                      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
                        <label className="block">
                          <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                            Minimum Level
                          </span>
                          <select
                            value={minLevel}
                            onChange={(event) =>
                              handleMinMaxChange(
                                "minLevel",
                                event.currentTarget.value,
                              )
                            }
                            className={fieldClass}
                          >
                            {boundValueOptions(minLevel).map((option) => (
                              <option
                                key={`min-bound-${option}`}
                                value={option}
                              >
                                {option}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="block">
                          <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                            Maximum Level
                          </span>
                          <select
                            value={maxLevel}
                            onChange={(event) =>
                              handleMinMaxChange(
                                "maxLevel",
                                event.currentTarget.value,
                              )
                            }
                            className={fieldClass}
                          >
                            {boundValueOptions(maxLevel).map((option) => (
                              <option
                                key={`max-bound-${option}`}
                                value={option}
                              >
                                {option}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                    </div>

                    <div className="py-6 lg:px-7 lg:py-0">
                      <p className={captionClass}>Direct CO Targets</p>
                      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
                        <label className="block">
                          <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                            Direct Internal
                          </span>
                          <select
                            value={attainmentValues.directCOInternal}
                            onChange={(event) =>
                              handleLevelChange(
                                "directCOInternal",
                                event.currentTarget.value,
                              )
                            }
                            className={fieldClass}
                          >
                            {attainmentValueOptions(
                              attainmentValues.directCOInternal,
                            ).map((option) => (
                              <option
                                key={`direct-internal-${option}`}
                                value={option}
                              >
                                {option}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="block">
                          <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                            Direct External
                          </span>
                          <select
                            value={attainmentValues.directCOExternal}
                            onChange={(event) =>
                              handleLevelChange(
                                "directCOExternal",
                                event.currentTarget.value,
                              )
                            }
                            className={fieldClass}
                          >
                            {attainmentValueOptions(
                              attainmentValues.directCOExternal,
                            ).map((option) => (
                              <option
                                key={`direct-external-${option}`}
                                value={option}
                              >
                                {option}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                    </div>

                    <div className="pt-6 lg:pl-7 lg:pt-0">
                      <p className={captionClass}>Indirect CO Targets</p>
                      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
                        <label className="block">
                          <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                            Indirect Internal
                          </span>
                          <select
                            value={attainmentValues.indirectCOInternal}
                            onChange={(event) =>
                              handleLevelChange(
                                "indirectCOInternal",
                                event.currentTarget.value,
                              )
                            }
                            className={fieldClass}
                          >
                            {attainmentValueOptions(
                              attainmentValues.indirectCOInternal,
                            ).map((option) => (
                              <option
                                key={`indirect-internal-${option}`}
                                value={option}
                              >
                                {option}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="block">
                          <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                            Indirect External
                          </span>
                          <select
                            value={attainmentValues.indirectCOExternal}
                            onChange={(event) =>
                              handleLevelChange(
                                "indirectCOExternal",
                                event.currentTarget.value,
                              )
                            }
                            className={fieldClass}
                          >
                            {attainmentValueOptions(
                              attainmentValues.indirectCOExternal,
                            ).map((option) => (
                              <option
                                key={`indirect-external-${option}`}
                                value={option}
                              >
                                {option}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-300/70 pt-7">
                  <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className={captionClass}>Mapping Rules</p>
                      <h3 className="mt-1 text-lg font-semibold text-[#111827]">
                        Attainment range mapping
                      </h3>
                      <p className="mt-1 text-sm text-slate-600">
                        Define percentage bands and the level each band earns.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddRange}
                      className={secondaryButtonClass}
                    >
                      <Plus className="h-4 w-4" />
                      Add Range
                    </button>
                  </div>

                  <div className="overflow-auto border-y border-slate-200 bg-[#fcfdfd]">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 bg-[#f5f7f9]">
                          <th className={tableHeadClass}>Min %</th>
                          <th className={tableHeadClass}>Max %</th>
                          <th className={tableHeadClass}>Level</th>
                          <th className={`${tableHeadClass} text-right`}>
                            Action
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-200/70">
                        {attainmentRanges.map((range) => (
                          <tr key={range.id} className="hover:bg-[#f7fafc]">
                            <td className="px-3 py-3.5">
                              <select
                                value={range.min}
                                onChange={(event) =>
                                  handleRangeSelectChange(
                                    range.id,
                                    "min",
                                    event.currentTarget.value,
                                  )
                                }
                                className={`${compactFieldClass} max-w-28`}
                              >
                                {percentageOptions.map((option) => (
                                  <option
                                    key={`range-${range.id}-min-${option}`}
                                    value={option}
                                  >
                                    {option}
                                  </option>
                                ))}
                              </select>
                            </td>

                            <td className="px-3 py-3.5">
                              <select
                                value={range.max}
                                onChange={(event) =>
                                  handleRangeSelectChange(
                                    range.id,
                                    "max",
                                    event.currentTarget.value,
                                  )
                                }
                                className={`${compactFieldClass} max-w-28`}
                              >
                                {percentageOptions.map((option) => (
                                  <option
                                    key={`range-${range.id}-max-${option}`}
                                    value={option}
                                  >
                                    {option}
                                  </option>
                                ))}
                              </select>
                            </td>

                            <td className="px-3 py-3.5">
                              <select
                                value={range.level}
                                onChange={(event) =>
                                  handleRangeSelectChange(
                                    range.id,
                                    "level",
                                    event.currentTarget.value,
                                  )
                                }
                                className={`${compactFieldClass} max-w-28`}
                              >
                                {mergeOptionsWithCurrentValue(
                                  attainmentOptions,
                                  range.level,
                                ).map((option) => (
                                  <option
                                    key={`range-${range.id}-level-${option}`}
                                    value={option}
                                  >
                                    {option}
                                  </option>
                                ))}
                              </select>
                            </td>

                            <td className="px-3 py-3.5 text-right">
                              <button
                                type="button"
                                onClick={() => handleDeleteRange(range.id)}
                                className="text-sm font-semibold text-rose-600 transition hover:text-rose-700"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-4 border-t border-slate-200 pt-4">
                    {rangeValidationMessage ? (
                      <p className="text-sm font-medium text-amber-700">
                        Range mapping issue: {rangeValidationMessage}
                      </p>
                    ) : (
                      <p className="text-sm font-medium text-emerald-700">
                        Range mapping is valid and covers 0% to 100% without
                        overlap.
                      </p>
                    )}
                  </div>
                </div>

                {attainmentMessage && (
                  <p className="border-t border-slate-200 pt-4 text-sm font-medium text-slate-600">
                    {attainmentMessage}
                  </p>
                )}
              </div>
            )}

            {activeWorkspace === "programOutcomes" && (
              <div className="space-y-7">
                <div className="border-b border-slate-300/70 pb-5">
                  <p className={captionClass}>Outcomes Registry</p>
                  <h3 className={panelTitleClass}>Program outcomes</h3>
                </div>

                <form
                  onSubmit={handleAddPO}
                  className="grid grid-cols-1 gap-3 border-b border-slate-300/70 pb-6 sm:grid-cols-[minmax(0,1fr)_auto]"
                >
                  <input
                    type="text"
                    value={newPOValue}
                    onChange={(event) => setNewPOValue(event.target.value)}
                    placeholder="Enter program outcome statement"
                    className={fieldClass}
                  />
                  <button type="submit" className={primaryButtonClass}>
                    <GitBranchPlus className="h-4 w-4" />
                    Add Outcome
                  </button>
                </form>
                {poMessage && (
                  <p className="text-sm font-medium text-slate-600">
                    {poMessage}
                  </p>
                )}

                <div className="overflow-auto border-y border-slate-200 bg-[#fcfdfd]">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-[#f5f7f9]">
                        <th className={tableHeadClass}>ID</th>
                        <th className={tableHeadClass}>Outcome Statement</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/70">
                      {pos.map((po) => (
                        <tr key={po.id} className="hover:bg-[#f7fafc]">
                          <td className="px-3 py-4 font-semibold text-[#111827]">
                            {po.id}
                          </td>
                          <td className="px-3 py-4 leading-6 text-slate-700">
                            {po.po}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {pos.length === 0 && (
                    <p className="px-3 py-8 text-sm text-slate-500">
                      No program outcomes added yet.
                    </p>
                  )}
                </div>
              </div>
            )}

            {activeWorkspace === "programmeManagement" && (
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
                              e.target.value as
                                | "all"
                                | "assigned"
                                | "unassigned",
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
                  <p className="text-sm font-medium text-slate-600">
                    {programmeMessage}
                  </p>
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
                        <tr
                          key={row.programme._id}
                          className="hover:bg-[#f7fafc]"
                        >
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
            )}

            {activeWorkspace === "facultyManagement" && (
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
                        setFacultyRoleFilter(
                          e.target.value as "all" | "TEACHER" | "HOD",
                        )
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
                  <p className="text-sm font-medium text-slate-600">
                    {facultyMessage}
                  </p>
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
                        <tr
                          key={row.teacher._id}
                          className="hover:bg-[#f7fafc]"
                        >
                          <td className="px-3 py-4 font-medium text-[#111827]">
                            {row.teacher.name}
                          </td>
                          <td className="px-3 py-4 text-slate-700">
                            {row.teacher.code}
                          </td>
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
            )}

            {activeWorkspace === "facultyAssignment" && (
              <div className="space-y-7">
                <div className="border-b border-slate-300/70 pb-5">
                  <p className={captionClass}>Assignment Matrix</p>
                  <h3 className={panelTitleClass}>Faculty assignment</h3>
                </div>

                <div className="border-b border-slate-300/70 pb-6">
                  <p className={`${captionClass} mb-2`}>Explore Records</p>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_190px]">
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        value={assignmentSearch}
                        onChange={(e) => setAssignmentSearch(e.target.value)}
                        placeholder="Search programme mapping"
                        className={`${fieldClass} pl-9`}
                      />
                    </div>
                    <select
                      value={assignmentStatusFilter}
                      onChange={(e) =>
                        setAssignmentStatusFilter(
                          e.target.value as "all" | "assigned" | "unassigned",
                        )
                      }
                      className={fieldClass}
                    >
                      <option value="all">All Statuses</option>
                      <option value="assigned">Assigned</option>
                      <option value="unassigned">Unassigned</option>
                    </select>
                  </div>
                </div>

                <form
                  onSubmit={handleAssignTeacher}
                  className="border-b border-slate-300/70 pb-6"
                >
                  <p className={`${captionClass} mb-2`}>Assign Faculty</p>
                  <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                    <select
                      value={assignment.programmeId}
                      onChange={(e) =>
                        setAssignment((prev) => ({
                          ...prev,
                          programmeId: e.target.value,
                        }))
                      }
                      className={fieldClass}
                    >
                      <option value="">Choose Programme</option>
                      {programmes.map((programme) => (
                        <option key={programme._id} value={programme._id}>
                          {programme.name}
                        </option>
                      ))}
                    </select>
                    <select
                      value={assignment.teacherId}
                      onChange={(e) =>
                        setAssignment((prev) => ({
                          ...prev,
                          teacherId: e.target.value,
                        }))
                      }
                      className={fieldClass}
                    >
                      <option value="">Choose Faculty Member</option>
                      {teachers.map((teacher) => (
                        <option key={teacher._id} value={teacher._id}>
                          {teacher.name}
                        </option>
                      ))}
                    </select>
                    <button type="submit" className={primaryButtonClass}>
                      <ListChecks className="h-4 w-4" />
                      Assign
                    </button>
                  </div>
                </form>
                {assignmentMessage && (
                  <p className="text-sm font-medium text-slate-600">
                    {assignmentMessage}
                  </p>
                )}

                <div className="overflow-auto border-y border-slate-200 bg-[#fcfdfd]">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-[#f5f7f9]">
                        <th className={tableHeadClass}>Programme</th>
                        <th className={tableHeadClass}>Assigned Faculty</th>
                        <th className={tableHeadClass}>Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/70">
                      {filteredAssignmentRows.map((row) => (
                        <tr
                          key={row.programme._id}
                          className="hover:bg-[#f7fafc]"
                        >
                          <td className="px-3 py-4 font-medium text-[#111827]">
                            {row.programme.name}
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
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredAssignmentRows.length === 0 && (
                    <p className="px-3 py-8 text-sm text-slate-500">
                      No assignment records found for current filters.
                    </p>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
