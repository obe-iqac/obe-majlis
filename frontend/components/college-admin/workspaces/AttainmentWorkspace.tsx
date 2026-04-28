import { AttainmentRange, AttainmentValues } from "../types";
import { Plus, Save } from "lucide-react";

type Props = {
  captionClass: string;
  panelTitleClass: string;
  fieldClass: string;
  compactFieldClass: string;
  primaryButtonClass: string;
  secondaryButtonClass: string;
  tableHeadClass: string;
  minLevel: number;
  maxLevel: number;
  attainmentValues: AttainmentValues;
  attainmentRanges: AttainmentRange[];
  attainmentOptions: number[];
  percentageOptions: number[];
  rangeValidationMessage: string;
  attainmentMessage: string;
  boundValueOptions: (currentValue: number) => number[];
  attainmentValueOptions: (currentValue: number) => number[];
  mergeOptionsWithCurrentValue: (
    options: number[],
    currentValue: number,
  ) => number[];
  handleMinMaxChange: (
    field: "minLevel" | "maxLevel",
    rawValue: string,
  ) => void;
  handleLevelChange: (key: keyof AttainmentValues, rawValue: string) => void;
  handleRangeSelectChange: (
    rangeId: string,
    field: "min" | "max" | "level",
    rawValue: string,
  ) => void;
  handleAddRange: () => void;
  handleDeleteRange: (rangeId: string) => void;
  handleAttainmentSubmit: () => void;
};

export default function AttainmentWorkspace({
  captionClass,
  panelTitleClass,
  fieldClass,
  compactFieldClass,
  primaryButtonClass,
  secondaryButtonClass,
  tableHeadClass,
  minLevel,
  maxLevel,
  attainmentValues,
  attainmentRanges,
  attainmentOptions,
  percentageOptions,
  rangeValidationMessage,
  attainmentMessage,
  boundValueOptions,
  attainmentValueOptions,
  mergeOptionsWithCurrentValue,
  handleMinMaxChange,
  handleLevelChange,
  handleRangeSelectChange,
  handleAddRange,
  handleDeleteRange,
  handleAttainmentSubmit,
}: Props) {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 border-b border-slate-300/70 pb-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className={captionClass}>Attainment Policy</p>
          <h3 className={panelTitleClass}>
            Configure institutional attainment rules
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Set the academic level boundaries, course outcome target levels, and
            the percentage range mapping used across the programme.
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
                    handleMinMaxChange("minLevel", event.currentTarget.value)
                  }
                  className={fieldClass}
                >
                  {boundValueOptions(minLevel).map((option) => (
                    <option key={`min-bound-${option}`} value={option}>
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
                    handleMinMaxChange("maxLevel", event.currentTarget.value)
                  }
                  className={fieldClass}
                >
                  {boundValueOptions(maxLevel).map((option) => (
                    <option key={`max-bound-${option}`} value={option}>
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
                    <option key={`direct-internal-${option}`} value={option}>
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
                    <option key={`direct-external-${option}`} value={option}>
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
                    <option key={`indirect-internal-${option}`} value={option}>
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
                    <option key={`indirect-external-${option}`} value={option}>
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
                <th className={`${tableHeadClass} text-right`}>Action</th>
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
              Range mapping is valid and covers 0% to 100% without overlap.
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
  );
}
