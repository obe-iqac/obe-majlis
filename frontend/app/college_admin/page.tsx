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
      const loadedRanges = (data.data.college?.attainmentRanges ?? []).map(
        (range: any) => ({
          id: range.id || crypto.randomUUID(),
          min: Number(range.min),
          max: Number(range.max),
          level: Number(range.level),
        }),
      );

      setAttainmentRanges(loadedRanges);
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

  return (
    <main className="min-h-screen bg-[color:var(--color-primary)] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl space-y-3">
        <header className="rounded-lg border border-slate-200 bg-white px-4 py-2.5">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-sm font-semibold text-slate-900 sm:text-base">
                OBE College Administration
              </h1>
              <span className="hidden h-4 w-px bg-slate-300 sm:block" />
              <p className="text-xs text-slate-500 sm:text-sm">
                {
                  workspaceTabs.find(
                    (workspace) => workspace.id === activeWorkspace,
                  )?.label
                }
              </p>
            </div>

            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              {kpis.map((kpi) => {
                const Icon = kpi.icon;
                return (
                  <div
                    key={kpi.title}
                    className="flex items-center gap-2 rounded-md bg-slate-50 px-2 py-1.5"
                  >
                    <Icon className="h-3.5 w-3.5 text-slate-500" />
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-slate-500">
                        {kpi.title}
                      </p>
                      <p className="text-xs font-semibold text-slate-900 sm:text-sm">
                        {kpi.value}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[240px_minmax(0,1fr)]">
          <nav className="rounded-lg border border-slate-200 bg-white p-2">
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-1">
              {workspaceTabs.map((workspace) => {
                const Icon = workspace.icon;
                const isActive = activeWorkspace === workspace.id;

                return (
                  <button
                    key={workspace.id}
                    type="button"
                    onClick={() => setActiveWorkspace(workspace.id)}
                    className={`inline-flex items-center justify-start gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${
                      isActive
                        ? "bg-secondary text-white"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {workspace.label}
                  </button>
                );
              })}
            </div>
          </nav>

          <section className="rounded-lg border border-slate-200 bg-white p-4">
            {activeWorkspace === "attainment" && (
              <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                {/* Section Header */}
                <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10">
                      <Layers className="h-5 w-5 text-secondary" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">
                        Attainment Configuration
                      </h2>
                      <p className="text-sm text-slate-500">
                        Configure attainment levels, CO target thresholds, and
                        percentage mapping rules for this programme.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleAttainmentSubmit}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-secondary px-5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
                  >
                    <Save className="h-4 w-4" />
                    Save Configuration
                  </button>
                </div>

                {/* Global Config Grid */}
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                  {/* Academic Boundaries */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Academic Boundaries
                    </p>

                    <div className="space-y-3">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-600">
                          Minimum Level
                        </label>
                        <select
                          value={minLevel}
                          onChange={(event) =>
                            handleMinMaxChange(
                              "minLevel",
                              event.currentTarget.value,
                            )
                          }
                          className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
                        >
                          {boundValueOptions(minLevel).map((option) => (
                            <option key={`min-bound-${option}`} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-600">
                          Maximum Level
                        </label>
                        <select
                          value={maxLevel}
                          onChange={(event) =>
                            handleMinMaxChange(
                              "maxLevel",
                              event.currentTarget.value,
                            )
                          }
                          className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
                        >
                          {boundValueOptions(maxLevel).map((option) => (
                            <option key={`max-bound-${option}`} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Direct CO */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Direct CO Targets
                    </p>

                    <div className="space-y-3">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-600">
                          Direct Internal
                        </label>
                        <select
                          value={attainmentValues.directCOInternal}
                          onChange={(event) =>
                            handleLevelChange(
                              "directCOInternal",
                              event.currentTarget.value,
                            )
                          }
                          className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
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
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-600">
                          Direct External
                        </label>
                        <select
                          value={attainmentValues.directCOExternal}
                          onChange={(event) =>
                            handleLevelChange(
                              "directCOExternal",
                              event.currentTarget.value,
                            )
                          }
                          className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
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
                      </div>
                    </div>
                  </div>

                  {/* Indirect CO */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Indirect CO Targets
                    </p>

                    <div className="space-y-3">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-600">
                          Indirect Internal
                        </label>
                        <select
                          value={attainmentValues.indirectCOInternal}
                          onChange={(event) =>
                            handleLevelChange(
                              "indirectCOInternal",
                              event.currentTarget.value,
                            )
                          }
                          className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
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
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-600">
                          Indirect External
                        </label>
                        <select
                          value={attainmentValues.indirectCOExternal}
                          onChange={(event) =>
                            handleLevelChange(
                              "indirectCOExternal",
                              event.currentTarget.value,
                            )
                          }
                          className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
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
                      </div>
                    </div>
                  </div>
                </div>

                {/* Range Mapping */}
                <div className="overflow-hidden rounded-2xl border border-slate-200">
                  <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-800">
                        Attainment Range Mapping
                      </h3>
                      <p className="text-xs text-slate-500">
                        Define percentage ranges and their corresponding
                        attainment levels.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddRange}
                      className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                    >
                      <Plus className="h-4 w-4" />
                      Add Range
                    </button>
                  </div>

                  <div className="max-h-80 overflow-auto">
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                      <thead className="bg-white">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Min %
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Max %
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Level
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Remove
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-200 bg-white">
                        {attainmentRanges.map((range) => (
                          <tr key={range.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3">
                              <select
                                value={range.min}
                                onChange={(event) =>
                                  handleRangeSelectChange(
                                    range.id,
                                    "min",
                                    event.currentTarget.value,
                                  )
                                }
                                className="h-9 w-24 rounded-lg border border-slate-300 bg-white px-2 text-sm"
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

                            <td className="px-4 py-3">
                              <select
                                value={range.max}
                                onChange={(event) =>
                                  handleRangeSelectChange(
                                    range.id,
                                    "max",
                                    event.currentTarget.value,
                                  )
                                }
                                className="h-9 w-24 rounded-lg border border-slate-300 bg-white px-2 text-sm"
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

                            <td className="px-4 py-3">
                              <select
                                value={range.level}
                                onChange={(event) =>
                                  handleRangeSelectChange(
                                    range.id,
                                    "level",
                                    event.currentTarget.value,
                                  )
                                }
                                className="h-9 w-24 rounded-lg border border-slate-300 bg-white px-2 text-sm"
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

                            <td className="px-4 py-3">
                              <button
                                type="button"
                                onClick={() => handleDeleteRange(range.id)}
                                className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="border-t border-slate-200 px-4 py-3">
                    {rangeValidationMessage ? (
                      <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                        Range mapping issue: {rangeValidationMessage}
                      </p>
                    ) : (
                      <p className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">
                        Range mapping is valid and covers 0% to 100% without
                        overlap.
                      </p>
                    )}
                  </div>
                </div>

                {attainmentMessage && (
                  <p className="text-sm font-medium text-slate-600">
                    {attainmentMessage}
                  </p>
                )}
              </div>
            )}

            {activeWorkspace === "programOutcomes" && (
              <div className="space-y-4">
                <header className="flex items-center gap-2 border-b border-slate-200 pb-2.5">
                  <Target className="h-4 w-4 text-secondary" />
                  <h2 className="text-base font-semibold text-slate-900">
                    Program Outcomes
                  </h2>
                </header>

                <form
                  onSubmit={handleAddPO}
                  className="rounded-md border border-slate-200 bg-slate-50/60 p-2"
                >
                  <p className="mb-1.5 text-[0.65rem] font-semibold uppercase tracking-wide text-slate-500">
                    Quick Create
                  </p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                    <input
                      type="text"
                      value={newPOValue}
                      onChange={(event) => setNewPOValue(event.target.value)}
                      placeholder="Enter program outcome statement"
                      className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm"
                    />
                    <button
                      type="submit"
                      className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-secondary px-4 text-sm font-semibold text-white"
                    >
                      <GitBranchPlus className="h-4 w-4" />
                      Add Program Outcome
                    </button>
                  </div>
                </form>
                {poMessage && (
                  <p className="text-sm text-slate-600">{poMessage}</p>
                )}

                <div className="overflow-hidden rounded-md border border-slate-200">
                  <div className="max-h-[32rem] overflow-auto">
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            ID
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Outcome Statement
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {pos.map((po) => (
                          <tr key={po.id}>
                            <td className="px-3 py-2.5 font-semibold text-slate-700">
                              {po.id}
                            </td>
                            <td className="px-3 py-2.5 text-slate-700">
                              {po.po}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {pos.length === 0 && (
                      <p className="px-3 py-5 text-sm text-slate-500">
                        No program outcomes added yet.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeWorkspace === "programmeManagement" && (
              <div className="space-y-4">
                <header className="flex items-center gap-2 border-b border-slate-200 pb-2.5">
                  <GraduationCap className="h-4 w-4 text-secondary" />
                  <h2 className="text-base font-semibold text-slate-900">
                    Programme Management
                  </h2>
                </header>

                <form
                  onSubmit={handleProgrammeCreate}
                  className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_auto]"
                >
                  <div className="rounded-md border border-slate-200 bg-slate-50/60 p-2">
                    <p className="mb-1.5 text-[0.65rem] font-semibold uppercase tracking-wide text-slate-500">
                      Explore Records
                    </p>
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-[minmax(0,1fr)_190px]">
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          value={programmeSearch}
                          onChange={(e) => setProgrammeSearch(e.target.value)}
                          placeholder="Search programme name"
                          className="h-9 w-full rounded-md border border-slate-300 bg-white pl-8 pr-3 text-sm"
                        />
                      </div>
                      <div className="relative">
                        <Filter className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
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
                          className="h-9 w-full rounded-md border border-slate-300 bg-white pl-8 pr-3 text-sm"
                        >
                          <option value="all">All Statuses</option>
                          <option value="assigned">Assigned</option>
                          <option value="unassigned">Unassigned</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-md border border-slate-200 bg-white p-2">
                    <p className="mb-1.5 text-[0.65rem] font-semibold uppercase tracking-wide text-slate-500">
                      Quick Create
                    </p>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-[220px_auto]">
                      <input
                        type="text"
                        value={newProgrammeName}
                        onChange={(e) => setNewProgrammeName(e.target.value)}
                        placeholder="New programme name"
                        className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm"
                      />
                      <button
                        type="submit"
                        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-secondary px-3 text-sm font-semibold text-white"
                      >
                        <Plus className="h-4 w-4" />
                        Add
                      </button>
                    </div>
                  </div>
                </form>
                {programmeMessage && (
                  <p className="text-sm text-slate-600">{programmeMessage}</p>
                )}

                <div className="overflow-hidden rounded-md border border-slate-200">
                  <div className="max-h-[32rem] overflow-auto">
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Programme
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Assignment Status
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Faculty Members
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {filteredProgrammeRows.map((row) => (
                          <tr key={row.programme._id}>
                            <td className="px-3 py-2.5 font-medium text-slate-800">
                              {row.programme.name}
                            </td>
                            <td className="px-3 py-2.5 text-slate-700">
                              {row.isAssigned ? "Assigned" : "Unassigned"}
                            </td>
                            <td className="px-3 py-2.5 text-slate-700">
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
                      <p className="px-3 py-5 text-sm text-slate-500">
                        No programme records found for current filters.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeWorkspace === "facultyManagement" && (
              <div className="space-y-4">
                <header className="flex items-center gap-2 border-b border-slate-200 pb-2.5">
                  <UserRound className="h-4 w-4 text-secondary" />
                  <h2 className="text-base font-semibold text-slate-900">
                    Faculty Management
                  </h2>
                </header>

                <div className="rounded-md border border-slate-200 bg-slate-50/60 p-2">
                  <p className="mb-1.5 text-[0.65rem] font-semibold uppercase tracking-wide text-slate-500">
                    Filter Records
                  </p>
                  <div className="grid grid-cols-1 gap-2 lg:grid-cols-3">
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        value={facultySearch}
                        onChange={(e) => setFacultySearch(e.target.value)}
                        placeholder="Search faculty name"
                        className="h-9 w-full rounded-md border border-slate-300 bg-white pl-8 pr-3 text-sm"
                      />
                    </div>
                    <select
                      value={facultyRoleFilter}
                      onChange={(e) =>
                        setFacultyRoleFilter(
                          e.target.value as "all" | "TEACHER" | "HOD",
                        )
                      }
                      className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm"
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
                      className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm"
                    >
                      <option value="all">All Assignments</option>
                      <option value="assigned">Assigned</option>
                      <option value="unassigned">Unassigned</option>
                    </select>
                  </div>
                </div>

                <form
                  onSubmit={handleTeacherCreate}
                  className="rounded-md border border-slate-200 bg-white p-2"
                >
                  <p className="mb-1.5 text-[0.65rem] font-semibold uppercase tracking-wide text-slate-500">
                    Quick Create
                  </p>
                  <div className="grid grid-cols-1 gap-2 lg:grid-cols-[minmax(0,1fr)_160px_160px_170px_auto]">
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
                      className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm"
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
                      className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm"
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
                      placeholder="Password (optional)"
                      className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm"
                    />
                    <select
                      value={newTeacher.role}
                      onChange={(e) =>
                        setNewTeacher((prev) => ({
                          ...prev,
                          role: e.target.value as "TEACHER" | "HOD",
                        }))
                      }
                      className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm"
                    >
                      <option value="TEACHER">Faculty Member</option>
                      <option value="HOD">Head Of Department</option>
                    </select>
                    <button
                      type="submit"
                      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-secondary px-3 text-sm font-semibold text-white"
                    >
                      <UserSquare2 className="h-4 w-4" />
                      Create
                    </button>
                  </div>
                </form>
                {facultyMessage && (
                  <p className="text-sm text-slate-600">{facultyMessage}</p>
                )}

                <div className="overflow-hidden rounded-md border border-slate-200">
                  <div className="max-h-[32rem] overflow-auto">
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Faculty Member
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Login Code
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Role
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Assigned Programmes
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {filteredFacultyRows.map((row) => (
                          <tr key={row.teacher._id}>
                            <td className="px-3 py-2.5 font-medium text-slate-800">
                              {row.teacher.name}
                            </td>
                            <td className="px-3 py-2.5 text-slate-700">
                              {row.teacher.code}
                            </td>
                            <td className="px-3 py-2.5 text-slate-700">
                              {row.teacher.role === "HOD"
                                ? "Head Of Department"
                                : "Faculty Member"}
                            </td>
                            <td className="px-3 py-2.5 text-slate-700">
                              {row.assignedProgrammes.length}
                            </td>
                            <td className="px-3 py-2.5 text-slate-700">
                              {row.isAssigned ? "Assigned" : "Unassigned"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {filteredFacultyRows.length === 0 && (
                      <p className="px-3 py-5 text-sm text-slate-500">
                        No faculty records found for current filters.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeWorkspace === "facultyAssignment" && (
              <div className="space-y-4">
                <header className="flex items-center gap-2 border-b border-slate-200 pb-2.5">
                  <Briefcase className="h-4 w-4 text-secondary" />
                  <h2 className="text-base font-semibold text-slate-900">
                    Faculty Assignment
                  </h2>
                </header>

                <div className="rounded-md border border-slate-200 bg-slate-50/60 p-2">
                  <p className="mb-1.5 text-[0.65rem] font-semibold uppercase tracking-wide text-slate-500">
                    Explore Records
                  </p>
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-[minmax(0,1fr)_180px]">
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        value={assignmentSearch}
                        onChange={(e) => setAssignmentSearch(e.target.value)}
                        placeholder="Search programme mapping"
                        className="h-9 w-full rounded-md border border-slate-300 bg-white pl-8 pr-3 text-sm"
                      />
                    </div>
                    <select
                      value={assignmentStatusFilter}
                      onChange={(e) =>
                        setAssignmentStatusFilter(
                          e.target.value as "all" | "assigned" | "unassigned",
                        )
                      }
                      className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm"
                    >
                      <option value="all">All Statuses</option>
                      <option value="assigned">Assigned</option>
                      <option value="unassigned">Unassigned</option>
                    </select>
                  </div>
                </div>

                <form
                  onSubmit={handleAssignTeacher}
                  className="rounded-md border border-slate-200 bg-white p-2"
                >
                  <p className="mb-1.5 text-[0.65rem] font-semibold uppercase tracking-wide text-slate-500">
                    Assign Action
                  </p>
                  <div className="grid grid-cols-1 gap-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                    <select
                      value={assignment.programmeId}
                      onChange={(e) =>
                        setAssignment((prev) => ({
                          ...prev,
                          programmeId: e.target.value,
                        }))
                      }
                      className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm"
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
                      className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm"
                    >
                      <option value="">Choose Faculty Member</option>
                      {teachers.map((teacher) => (
                        <option key={teacher._id} value={teacher._id}>
                          {teacher.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-secondary px-3 text-sm font-semibold text-white"
                    >
                      <ListChecks className="h-4 w-4" />
                      Assign
                    </button>
                  </div>
                </form>
                {assignmentMessage && (
                  <p className="text-sm text-slate-600">{assignmentMessage}</p>
                )}

                <div className="overflow-hidden rounded-md border border-slate-200">
                  <div className="max-h-[32rem] overflow-auto">
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Programme
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Assigned Faculty
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {filteredAssignmentRows.map((row) => (
                          <tr key={row.programme._id}>
                            <td className="px-3 py-2.5 font-medium text-slate-800">
                              {row.programme.name}
                            </td>
                            <td className="px-3 py-2.5 text-slate-700">
                              {row.assignedTeachers.length > 0
                                ? row.assignedTeachers
                                    .map((teacher) => teacher.name)
                                    .join(", ")
                                : "-"}
                            </td>
                            <td className="px-3 py-2.5 text-slate-700">
                              {row.isAssigned ? "Assigned" : "Unassigned"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {filteredAssignmentRows.length === 0 && (
                      <p className="px-3 py-5 text-sm text-slate-500">
                        No assignment records found for current filters.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
