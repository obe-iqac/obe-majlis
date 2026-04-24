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
  label: string;
  value: string;
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

const initialAttainmentValues: AttainmentValues = {
  directCOInternal: 3,
  directCOExternal: 4,
  indirectCOInternal: 3,
  indirectCOExternal: 4,
};

const initialAttainmentRanges: AttainmentRange[] = [
  { id: "range-1", min: 0, max: 50, level: 1 },
  { id: "range-2", min: 50, max: 70, level: 2 },
  { id: "range-3", min: 70, max: 85, level: 3 },
  { id: "range-4", min: 85, max: 100, level: 4 },
];

const initialPOs: ProgramOutcome[] = [
  { id: "po-1", label: "PO1", value: "Engineering knowledge" },
  { id: "po-2", label: "PO2", value: "Problem analysis" },
  { id: "po-3", label: "PO3", value: "Design and development" },
];

const initialProgrammes: Programme[] = [
  { id: "programme-1", name: "B.Tech Computer Science", hodId: "hod-1" },
  { id: "programme-2", name: "B.Tech Electronics", hodId: null },
];

const initialHods: Hod[] = [
  { id: "hod-1", name: "Dr. Meera Nair", loginCode: "HODCSE01" },
  { id: "hod-2", name: "Prof. Arjun Rao", loginCode: "HODECE01" },
];

const logDummyEndpoint = (endpoint: string, payload: unknown) => {
  console.log(`[DUMMY API] ${endpoint}`, payload);
};

const clampLevel = (value: number) =>
  Math.min(5, Math.max(1, Math.trunc(value)));

const clampPercentage = (value: number) =>
  Math.min(100, Math.max(0, Math.trunc(value)));

const validateAttainmentRanges = (ranges: AttainmentRange[]) => {
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

    if (!Number.isInteger(range.level) || range.level < 1 || range.level > 5) {
      return "Attainment level must be an integer between 1 and 5.";
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
  const [attainmentValues, setAttainmentValues] = useState<AttainmentValues>(
    initialAttainmentValues,
  );
  const [attainmentRanges, setAttainmentRanges] = useState<AttainmentRange[]>(
    initialAttainmentRanges,
  );
  const [pos, setPos] = useState<ProgramOutcome[]>(initialPOs);
  const [programmes, setProgrammes] = useState<Programme[]>(initialProgrammes);
  const [hods, setHods] = useState<Hod[]>(initialHods);

  const [newPOValue, setNewPOValue] = useState("");
  const [newProgrammeName, setNewProgrammeName] = useState("");
  const [newHod, setNewHod] = useState({ name: "", loginCode: "" });
  const [assignment, setAssignment] = useState({
    programmeId: initialProgrammes[0]?.id ?? "",
    hodId: initialHods[0]?.id ?? "",
  });
  const [pageMessage, setPageMessage] = useState("");
  const [rangeValidationMessage, setRangeValidationMessage] = useState(
    validateAttainmentRanges(initialAttainmentRanges),
  );
  useEffect(() => {
    async function fetchInitialData() {
      const res = await fetch(`${SERVER_URL}/college_admin/get-college-info`, {
        credentials: "include",
      }).catch(() => null);

      if (!res?.ok) {
        setPageMessage("Failed to load initial data. Using defaults.");
        return;
      }

      const data = await res.json().catch(() => null);

      if (!data) {
        setPageMessage("Invalid initial data format. Using defaults.");
        return;
      }

      setAttainmentValues(data.attainmentValues ?? initialAttainmentValues);
      setAttainmentRanges(data.attainmentRanges ?? initialAttainmentRanges);
      setPos(data.pos ?? initialPOs);
      setProgrammes(data.programmes ?? initialProgrammes);
      setHods(data.hods ?? initialHods);
    }

    fetchInitialData();
  }, []);
  const handleLevelChange = (key: keyof AttainmentValues, rawValue: number) => {
    if (Number.isNaN(rawValue)) {
      return;
    }

    setAttainmentValues((prev) => ({
      ...prev,
      [key]: clampLevel(rawValue),
    }));
  };

  const handleRangeFieldChange = (
    rangeId: string,
    field: "min" | "max" | "level",
    rawValue: number,
  ) => {
    if (Number.isNaN(rawValue)) {
      return;
    }

    const nextRanges = attainmentRanges.map((range) => {
      if (range.id !== rangeId) {
        return range;
      }

      if (field === "level") {
        return { ...range, level: clampLevel(rawValue) };
      }

      return { ...range, [field]: clampPercentage(rawValue) };
    });

    setAttainmentRanges(nextRanges);
    setRangeValidationMessage(validateAttainmentRanges(nextRanges));
  };

  const handleAddRange = () => {
    const nextRange: AttainmentRange = {
      id: `range-${Date.now()}`,
      min: 0,
      max: 10,
      level: 1,
    };

    const nextRanges = [...attainmentRanges, nextRange];
    setAttainmentRanges(nextRanges);
    setRangeValidationMessage(validateAttainmentRanges(nextRanges));
    setPageMessage("New attainment range row added.");
  };

  const handleDeleteRange = (rangeId: string) => {
    const nextRanges = attainmentRanges.filter((range) => range.id !== rangeId);
    setAttainmentRanges(nextRanges);
    setRangeValidationMessage(validateAttainmentRanges(nextRanges));
    setPageMessage("Attainment range row deleted.");
  };

  const handleAttainmentSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const hasInvalidLevel = Object.values(attainmentValues).some(
      (value) => !Number.isInteger(value) || value < 1 || value > 5,
    );

    if (hasInvalidLevel) {
      setPageMessage(
        "All CO attainment fields must be integer levels between 1 and 5.",
      );
      return;
    }

    const mappingValidation = validateAttainmentRanges(attainmentRanges);

    if (mappingValidation) {
      setPageMessage(`Fix attainment range mapping: ${mappingValidation}`);
      return;
    }

    logDummyEndpoint("/college_admin/attainment", {
      attainmentValues,
      attainmentRangeMapping: attainmentRanges,
    });
    setPageMessage(
      "Attainment levels and range mapping logged to the console.",
    );
  };

  const handleAddPO = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!newPOValue.trim()) {
      setPageMessage("Enter a PO value before adding it.");
      return;
    }

    const nextPO: ProgramOutcome = {
      id: `po-${pos.length + 1}`,
      label: `PO${pos.length + 1}`,
      value: newPOValue.trim(),
    };

    const updatedPOs = [...pos, nextPO];
    setPos(updatedPOs);
    setNewPOValue("");
    logDummyEndpoint("/college_admin/program-outcomes", nextPO);
    setPageMessage(`${nextPO.label} added and logged to the console.`);
  };

  const handleProgrammeCreate = (event: FormEvent<HTMLFormElement>) => {
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

    const updatedProgrammes = [...programmes, nextProgramme];
    setProgrammes(updatedProgrammes);
    setNewProgrammeName("");
    setAssignment((prev) => ({
      ...prev,
      programmeId: prev.programmeId || nextProgramme.id,
    }));
    logDummyEndpoint("/college_admin/programmes", nextProgramme);
    setPageMessage("Programme created and logged to the console.");
  };

  const handleHodCreate = (event: FormEvent<HTMLFormElement>) => {
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

    const updatedHods = [...hods, nextHod];
    setHods(updatedHods);
    setNewHod({ name: "", loginCode: "" });
    setAssignment((prev) => ({
      ...prev,
      hodId: prev.hodId || nextHod.id,
    }));
    logDummyEndpoint("/college_admin/hods", nextHod);
    setPageMessage("HOD created and logged to the console.");
  };

  const handleAssignHod = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!assignment.programmeId || !assignment.hodId) {
      setPageMessage("Select both a programme and a HOD.");
      return;
    }

    const updatedProgrammes = programmes.map((programme) =>
      programme.id === assignment.programmeId
        ? { ...programme, hodId: assignment.hodId }
        : programme,
    );

    setProgrammes(updatedProgrammes);
    logDummyEndpoint("/college_admin/assign-hod", assignment);
    setPageMessage("HOD assignment prepared and logged to the console.");
  };

  const assignedCount = programmes.filter(
    (programme) => programme.hodId,
  ).length;

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
                {pos.length}
              </p>
            </div>
            <div className="rounded-md border border-slate-200 bg-white p-3">
              <p className="text-xs text-slate-500">Programmes</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">
                {programmes.length}
              </p>
            </div>
            <div className="rounded-md border border-slate-200 bg-white p-3">
              <p className="text-xs text-slate-500">HODs</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">
                {hods.length}
              </p>
            </div>
            <div className="rounded-md border border-slate-200 bg-white p-3">
              <p className="text-xs text-slate-500">Assigned Programmes</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">
                {assignedCount}
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
                  Enter attainment levels for each CO input using values from 1
                  to 5.
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">
                  Direct CO Internal Attainment
                </label>
                <input
                  type="number"
                  value={attainmentValues.directCOInternal}
                  onChange={(event) =>
                    handleLevelChange(
                      "directCOInternal",
                      event.currentTarget.valueAsNumber,
                    )
                  }
                  min={1}
                  max={5}
                  step={1}
                  className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-secondary"
                />
                <p className="text-xs text-slate-500">
                  Enter attainment level (1-5).
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">
                  Direct CO External Attainment
                </label>
                <input
                  type="number"
                  value={attainmentValues.directCOExternal}
                  onChange={(event) =>
                    handleLevelChange(
                      "directCOExternal",
                      event.currentTarget.valueAsNumber,
                    )
                  }
                  min={1}
                  max={5}
                  step={1}
                  className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-secondary"
                />
                <p className="text-xs text-slate-500">
                  Enter attainment level (1-5).
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">
                  Indirect CO Internal Attainment
                </label>
                <input
                  type="number"
                  value={attainmentValues.indirectCOInternal}
                  onChange={(event) =>
                    handleLevelChange(
                      "indirectCOInternal",
                      event.currentTarget.valueAsNumber,
                    )
                  }
                  min={1}
                  max={5}
                  step={1}
                  className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-secondary"
                />
                <p className="text-xs text-slate-500">
                  Enter attainment level (1-5).
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">
                  Indirect CO External Attainment
                </label>
                <input
                  type="number"
                  value={attainmentValues.indirectCOExternal}
                  onChange={(event) =>
                    handleLevelChange(
                      "indirectCOExternal",
                      event.currentTarget.valueAsNumber,
                    )
                  }
                  min={1}
                  max={5}
                  step={1}
                  className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-secondary"
                />
                <p className="text-xs text-slate-500">
                  Enter attainment level (1-5).
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
                    Define how raw percentages map to attainment levels (1-5).
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
                    {attainmentRanges.map((range) => (
                      <tr key={range.id}>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            value={range.min}
                            onChange={(event) =>
                              handleRangeFieldChange(
                                range.id,
                                "min",
                                event.currentTarget.valueAsNumber,
                              )
                            }
                            min={0}
                            max={100}
                            step={1}
                            className="h-9 w-24 rounded-md border border-slate-300 px-2 outline-none transition focus:border-secondary"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            value={range.max}
                            onChange={(event) =>
                              handleRangeFieldChange(
                                range.id,
                                "max",
                                event.currentTarget.valueAsNumber,
                              )
                            }
                            min={0}
                            max={100}
                            step={1}
                            className="h-9 w-24 rounded-md border border-slate-300 px-2 outline-none transition focus:border-secondary"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            value={range.level}
                            onChange={(event) =>
                              handleRangeFieldChange(
                                range.id,
                                "level",
                                event.currentTarget.valueAsNumber,
                              )
                            }
                            min={1}
                            max={5}
                            step={1}
                            className="h-9 w-20 rounded-md border border-slate-300 px-2 outline-none transition focus:border-secondary"
                          />
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
              {pos.map((po) => (
                <div
                  key={po.id}
                  className="rounded-md border border-slate-200 bg-[color:var(--color-primary)] px-4 py-3"
                >
                  <p className="text-sm font-semibold text-slate-900">
                    {po.label}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">{po.value}</p>
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
              {programmes.map((programme) => {
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
              {hods.map((hod) => (
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
                {programmes.map((programme) => (
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
                {hods.map((hod) => (
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
