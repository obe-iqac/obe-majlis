"use client";

import { SERVER_URL } from "@/constants";
import { FormEvent, useEffect, useState } from "react";

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
  id: string;
  name: string;
  hodId: string | null;
};

type Hod = {
  id: string;
  name: string;
  loginCode: string;
};

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
) => {
  try {
    const response = await fetch(`${SERVER_URL}${endpoint}`, {
      method: "POST",
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
  const [hods, setHods] = useState<Hod[]>([]);
  const [minLevel, setMinLevel] = useState(1);
  const [maxLevel, setMaxLevel] = useState(5);

  const [newPOValue, setNewPOValue] = useState("");
  const [newProgrammeName, setNewProgrammeName] = useState("");
  const [newHod, setNewHod] = useState({ name: "", loginCode: "" });
  const [assignment, setAssignment] = useState({
    programmeId: "",
    hodId: "",
  });
  const [pageMessage, setPageMessage] = useState("");
  const [rangeValidationMessage, setRangeValidationMessage] = useState(
    validateAttainmentRanges(attainmentRanges, minLevel, maxLevel),
  );

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
      ).catch(() => null);

      if (!res?.ok) {
        setPageMessage("Failed to load initial data. Using defaults.");
        return;
      }

      const data = await res.json().catch(() => null);

      if (!data) {
        setPageMessage("Invalid initial data format. Using defaults.");
        return;
      }

      const collegeAttainmentConfig = data.college?.attainmentConfig ?? {};
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
      setAttainmentRanges(data.college?.attainmentRanges ?? []);
      const fetchedPos = data.college?.pos ?? data.pos ?? [];
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
      setProgrammes(data.college.programmes ?? []);
      setHods(data.hods ?? []);
    }

    fetchInitialData();
  }, []);
  useEffect(() => {
    setRangeValidationMessage(
      validateAttainmentRanges(attainmentRanges, minLevel, maxLevel),
    );
  }, [attainmentRanges, minLevel, maxLevel]);

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
      id: `range-${Date.now()}`,
      min: 0,
      max: 10,
      level: minLevel,
    };

    const nextRanges = [...attainmentRanges, nextRange];
    setAttainmentRanges(nextRanges);
    setPageMessage("New attainment range row added.");
  };

  const handleDeleteRange = (rangeId: string) => {
    const nextRanges = attainmentRanges.filter((range) => range.id !== rangeId);
    setAttainmentRanges(nextRanges);
    setPageMessage("Attainment range row deleted.");
  };

  const handleAttainmentSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const hasInvalidLevel = Object.values(attainmentValues).some(
      (value) =>
        !Number.isInteger(value) ||
        value < Math.min(minLevel, maxLevel) ||
        value > Math.max(minLevel, maxLevel),
    );

    if (hasInvalidLevel) {
      setPageMessage(
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
      setPageMessage(`Fix attainment range mapping: ${mappingValidation}`);
      return;
    }

    setPageMessage("Saving attainment configuration...");

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
      setPageMessage,
    );

    if (result.success) {
      setPageMessage("Attainment configuration saved successfully!");
    }
  };

  const handleAddPO = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!newPOValue.trim()) {
      setPageMessage("Enter a PO value before adding it.");
      return;
    }

    const nextPOId = getNextPoId(pos);
    const nextPO: ProgramOutcome = {
      id: nextPOId,
      po: newPOValue.trim(),
    };

    const updatedPOs = [...pos, nextPO];
    setPos(updatedPOs);
    setNewPOValue("");
    setPageMessage(
      `${nextPO.id} added. Save attainment configuration to submit all POs.`,
    );
  };

  const handleProgrammeCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!newProgrammeName.trim()) {
      setPageMessage("Programme name is required.");
      return;
    }

    const nextProgramme: Programme = {
      id: `programme-${programmes.length + 1}`,
      name: newProgrammeName.trim(),
      hodId: null,
    };

    setPageMessage("Creating programme...");

    const result = await submitToBackend(
      "/college_admin/add-program",
      { name: nextProgramme.name },
      setPageMessage,
    );

    if (result.success) {
      const updatedProgrammes = [...programmes, nextProgramme];
      setProgrammes(updatedProgrammes);
      setNewProgrammeName("");
      setAssignment((prev) => ({
        ...prev,
        programmeId: prev.programmeId || nextProgramme.id,
      }));
      setPageMessage("Programme created successfully!");
    }
  };

  const handleHodCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!newHod.name.trim() || !newHod.loginCode.trim()) {
      setPageMessage("HOD name and login code are required.");
      return;
    }

    const nextHod: Hod = {
      id: `hod-${hods.length + 1}`,
      name: newHod.name.trim(),
      loginCode: newHod.loginCode.trim(),
    };

    setPageMessage("Creating HOD...");

    const result = await submitToBackend(
      "/college_admin/hods",
      { name: nextHod.name, loginCode: nextHod.loginCode },
      setPageMessage,
    );

    if (result.success) {
      const updatedHods = [...hods, nextHod];
      setHods(updatedHods);
      setNewHod({ name: "", loginCode: "" });
      setAssignment((prev) => ({
        ...prev,
        hodId: prev.hodId || nextHod.id,
      }));
      setPageMessage("HOD created successfully!");
    }
  };

  const handleAssignHod = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!assignment.programmeId || !assignment.hodId) {
      setPageMessage("Select both a programme and a HOD.");
      return;
    }

    setPageMessage("Assigning HOD to programme...");

    const result = await submitToBackend(
      "/college_admin/assign-hod",
      {
        programmeId: assignment.programmeId,
        hodId: assignment.hodId,
      },
      setPageMessage,
    );

    if (result.success) {
      const updatedProgrammes = programmes.map((programme) =>
        programme.id === assignment.programmeId
          ? { ...programme, hodId: assignment.hodId }
          : programme,
      );

      setProgrammes(updatedProgrammes);
      setPageMessage("HOD assigned to programme successfully!");
    }
  };

  const assignedCount = programmes?.filter(
    (programme) => programme.hodId,
  ).length;

  const attainmentValueOptions = (currentValue: number) =>
    mergeOptionsWithCurrentValue(attainmentOptions, currentValue);

  const boundValueOptions = (currentValue: number) =>
    mergeOptionsWithCurrentValue(configuredBoundOptions, currentValue);

  return (
    <main className="min-h-screen bg-[color:var(--color-primary)] px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">
                College Admin Dashboard
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Manage attainment inputs, program outcomes, programmes, and HOD
                assignments from one place.
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-4">
            <div className="rounded-md border border-slate-200 bg-white p-3">
              <p className="text-xs text-slate-500">POs</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">
                {pos?.length ?? 0}
              </p>
            </div>
            <div className="rounded-md border border-slate-200 bg-white p-3">
              <p className="text-xs text-slate-500">Programmes</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">
                {programmes?.length ?? 0}
              </p>
            </div>
            <div className="rounded-md border border-slate-200 bg-white p-3">
              <p className="text-xs text-slate-500">HODs</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">
                {hods?.length ?? 0}
              </p>
            </div>
            <div className="rounded-md border border-slate-200 bg-white p-3">
              <p className="text-xs text-slate-500">Assigned Programmes</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">
                {assignedCount ?? 0}
              </p>
            </div>
          </div>

          {pageMessage && (
            <p className="mt-5 rounded-md border border-tertiary/50 bg-[color:var(--color-primary)] px-3 py-2 text-sm text-slate-800">
              {pageMessage}
            </p>
          )}
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <form
            onSubmit={handleAttainmentSubmit}
            className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  CO Attainment Values
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Choose attainment levels from the configurable range below.
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-md border border-slate-200 bg-[color:var(--color-primary)] p-4">
              <h3 className="text-base font-semibold text-slate-900">
                Attainment Level Settings
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                Configure the minimum and maximum attainment levels used by all
                dropdowns on this page.
              </p>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">
                    Minimum Attainment Level
                  </label>
                  <select
                    value={minLevel}
                    onChange={(event) =>
                      handleMinMaxChange("minLevel", event.currentTarget.value)
                    }
                    className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-secondary"
                  >
                    {boundValueOptions(minLevel).map((option) => (
                      <option key={`min-bound-${option}`} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">
                    Maximum Attainment Level
                  </label>
                  <select
                    value={maxLevel}
                    onChange={(event) =>
                      handleMinMaxChange("maxLevel", event.currentTarget.value)
                    }
                    className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-secondary"
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

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">
                  Direct CO Internal Attainment
                </label>
                <select
                  value={attainmentValues?.directCOInternal}
                  onChange={(event) =>
                    handleLevelChange(
                      "directCOInternal",
                      event.currentTarget.value,
                    )
                  }
                  className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-secondary"
                >
                  {attainmentValueOptions(
                    attainmentValues.directCOInternal,
                  ).map((option) => (
                    <option key={`direct-internal-${option}`} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500">
                  Select an attainment level from the configured range.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">
                  Direct CO External Attainment
                </label>
                <select
                  value={attainmentValues?.directCOExternal}
                  onChange={(event) =>
                    handleLevelChange(
                      "directCOExternal",
                      event.currentTarget.value,
                    )
                  }
                  className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-secondary"
                >
                  {attainmentValueOptions(
                    attainmentValues.directCOExternal,
                  ).map((option) => (
                    <option key={`direct-external-${option}`} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500">
                  Select an attainment level from the configured range.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">
                  Indirect CO Internal Attainment
                </label>
                <select
                  value={attainmentValues?.indirectCOInternal}
                  onChange={(event) =>
                    handleLevelChange(
                      "indirectCOInternal",
                      event.currentTarget.value,
                    )
                  }
                  className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-secondary"
                >
                  {attainmentValueOptions(
                    attainmentValues.indirectCOInternal,
                  ).map((option) => (
                    <option key={`indirect-internal-${option}`} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500">
                  Select an attainment level from the configured range.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">
                  Indirect CO External Attainment
                </label>
                <select
                  value={attainmentValues?.indirectCOExternal}
                  onChange={(event) =>
                    handleLevelChange(
                      "indirectCOExternal",
                      event.currentTarget.value,
                    )
                  }
                  className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-secondary"
                >
                  {attainmentValueOptions(
                    attainmentValues.indirectCOExternal,
                  ).map((option) => (
                    <option key={`indirect-external-${option}`} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500">
                  Select an attainment level from the configured range.
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-md border border-slate-200 bg-[color:var(--color-primary)] p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    Attainment Range Mapping
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    Define how raw percentages map to attainment levels using
                    the configured range.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddRange}
                  className="h-10 rounded-md border border-secondary px-4 text-sm font-semibold text-secondary transition hover:bg-blue-50"
                >
                  Add Range
                </button>
              </div>

              <div className="mt-4 overflow-x-auto rounded-md border border-slate-200 bg-white">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-slate-700">
                        Min %
                      </th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-700">
                        Max %
                      </th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-700">
                        Level
                      </th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {attainmentRanges?.map((range) => (
                      <tr key={range.id}>
                        <td className="px-3 py-2">
                          <select
                            value={range.min}
                            onChange={(event) =>
                              handleRangeSelectChange(
                                range.id,
                                "min",
                                event.currentTarget.value,
                              )
                            }
                            className="h-9 w-24 rounded-md border border-slate-300 bg-white px-2 outline-none transition focus:border-secondary"
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
                        <td className="px-3 py-2">
                          <select
                            value={range.max}
                            onChange={(event) =>
                              handleRangeSelectChange(
                                range.id,
                                "max",
                                event.currentTarget.value,
                              )
                            }
                            className="h-9 w-24 rounded-md border border-slate-300 bg-white px-2 outline-none transition focus:border-secondary"
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
                        <td className="px-3 py-2">
                          <select
                            value={range.level}
                            onChange={(event) =>
                              handleRangeSelectChange(
                                range.id,
                                "level",
                                event.currentTarget.value,
                              )
                            }
                            className="h-9 w-20 rounded-md border border-slate-300 bg-white px-2 outline-none transition focus:border-secondary"
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
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            onClick={() => handleDeleteRange(range.id)}
                            className="rounded-md border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {rangeValidationMessage ? (
                <p className="mt-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  Range mapping issue: {rangeValidationMessage}
                </p>
              ) : (
                <p className="mt-3 rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                  Range mapping is valid and covers 0% to 100% without overlap.
                </p>
              )}
            </div>

            <button
              type="submit"
              className="mt-5 h-10 rounded-md bg-secondary px-4 text-sm font-semibold text-white transition hover:brightness-95"
            >
              Save Attainment Configuration
            </button>
          </form>

          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Program Outcomes
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Add as many POs as needed. Labels are generated automatically.
              </p>
            </div>

            <form
              onSubmit={handleAddPO}
              className="mt-5 flex flex-col gap-4 sm:flex-row"
            >
              <input
                type="text"
                value={newPOValue}
                onChange={(event) => setNewPOValue(event.target.value)}
                placeholder="Enter PO description"
                className="h-10 flex-1 rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-secondary"
              />
              <button
                type="submit"
                className="h-10 rounded-md bg-secondary px-4 text-sm font-semibold text-white transition hover:brightness-95"
              >
                Add PO
              </button>
            </form>

            <div className="mt-5 grid grid-cols-1 gap-3">
              {pos?.map((po) => (
                <div
                  key={po.id}
                  className="rounded-md border border-slate-200 bg-[color:var(--color-primary)] px-4 py-3"
                >
                  <p className="text-sm font-semibold text-slate-900">
                    {po.id}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">{po.po}</p>
                </div>
              ))}
            </div>
          </section>
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Create Programmes
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Add programme names and keep the list local for now.
              </p>
            </div>

            <form
              onSubmit={handleProgrammeCreate}
              className="mt-5 flex flex-col gap-4 sm:flex-row"
            >
              <input
                type="text"
                value={newProgrammeName}
                onChange={(event) => setNewProgrammeName(event.target.value)}
                placeholder="Enter programme name"
                className="h-10 flex-1 rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-secondary"
              />
              <button
                type="submit"
                className="h-10 rounded-md bg-secondary px-4 text-sm font-semibold text-white transition hover:brightness-95"
              >
                Create Programme
              </button>
            </form>

            <div className="mt-5 space-y-3">
              {programmes?.map((programme) => {
                const assignedHod = hods.find(
                  (hod) => hod.id === programme.hodId,
                );

                return (
                  <div
                    key={programme.id}
                    className="rounded-md border border-slate-200 bg-[color:var(--color-primary)] px-4 py-3"
                  >
                    <p className="text-sm font-semibold text-slate-900">
                      {programme.name}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {assignedHod
                        ? `Assigned HOD: ${assignedHod.name}`
                        : "Assigned HOD: Not assigned yet"}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Create HOD
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Create HOD entries with a name and login code.
              </p>
            </div>

            <form
              onSubmit={handleHodCreate}
              className="mt-5 grid grid-cols-1 gap-4"
            >
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">
                  HOD Name
                </label>
                <input
                  type="text"
                  value={newHod.name}
                  onChange={(event) =>
                    setNewHod((prev) => ({ ...prev, name: event.target.value }))
                  }
                  placeholder="Enter HOD name"
                  className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-secondary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">
                  Login Code
                </label>
                <input
                  type="text"
                  value={newHod.loginCode}
                  onChange={(event) =>
                    setNewHod((prev) => ({
                      ...prev,
                      loginCode: event.target.value,
                    }))
                  }
                  placeholder="Enter login code"
                  className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-secondary"
                />
              </div>

              <button
                type="submit"
                className="h-10 rounded-md bg-secondary px-4 text-sm font-semibold text-white transition hover:brightness-95"
              >
                Create HOD
              </button>
            </form>

            <div className="mt-5 space-y-3">
              {hods?.map((hod) => (
                <div
                  key={hod.id}
                  className="rounded-md border border-slate-200 bg-[color:var(--color-primary)] px-4 py-3"
                >
                  <p className="text-sm font-semibold text-slate-900">
                    {hod.name}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Login Code: {hod.loginCode}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Assign HOD To Programme
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Choose a programme and connect it to an HOD. Submission only logs
              the payload for now.
            </p>
          </div>

          <form
            onSubmit={handleAssignHod}
            className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3"
          >
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">
                Programme
              </label>
              <select
                value={assignment.programmeId}
                onChange={(event) =>
                  setAssignment((prev) => ({
                    ...prev,
                    programmeId: event.target.value,
                  }))
                }
                className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-secondary"
              >
                {programmes?.map((programme) => (
                  <option key={programme.id} value={programme.id}>
                    {programme.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">HOD</label>
              <select
                value={assignment.hodId}
                onChange={(event) =>
                  setAssignment((prev) => ({
                    ...prev,
                    hodId: event.target.value,
                  }))
                }
                className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-secondary"
              >
                {hods?.map((hod) => (
                  <option key={hod.id} value={hod.id}>
                    {hod.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="h-10 w-full rounded-md bg-secondary px-4 text-sm font-semibold text-white transition hover:brightness-95"
              >
                Assign HOD
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
