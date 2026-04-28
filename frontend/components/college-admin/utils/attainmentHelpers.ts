import { AttainmentRange, AttainmentValues, ProgramOutcome } from "../types";

export const ATTTAINMENT_BOUND_MIN = 1;
export const ATTTAINMENT_BOUND_MAX = 20;

export const generateNumericOptions = (min: number, max: number) => {
  const lowerBound = Math.min(min, max);
  const upperBound = Math.max(min, max);

  return Array.from(
    { length: upperBound - lowerBound + 1 },
    (_, index) => lowerBound + index,
  );
};

export const generateAttainmentOptions = (min: number, max: number) =>
  generateNumericOptions(min, max);

export const getConfiguredAttainmentBounds = (
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

export const mergeOptionsWithCurrentValue = (
  options: number[],
  currentValue: number,
) => {
  if (options.includes(currentValue)) {
    return options;
  }

  return [...options, currentValue].sort((left, right) => left - right);
};

export const normalizeAttainmentRanges = (
  ranges: Partial<AttainmentRange>[] = [],
): AttainmentRange[] => {
  const usedIds = new Set<string>();

  return ranges.map((range, index) => {
    const id =
      range.id && !usedIds.has(range.id)
        ? range.id
        : `range-${index}-${range.min ?? 0}-${range.max ?? 0}-${range.level ?? 1}`;

    usedIds.add(id);

    return {
      id,
      min: range.min ?? 0,
      max: range.max ?? 10,
      level: range.level ?? 1,
    };
  });
};

export const getNextPoId = (existingPos: ProgramOutcome[]) => {
  const maxPoNumber = existingPos.reduce((maxSoFar, currentPo) => {
    const matchedNumber = Number(currentPo.id.replace(/^PO/i, ""));

    if (Number.isNaN(matchedNumber)) {
      return maxSoFar;
    }

    return Math.max(maxSoFar, matchedNumber);
  }, 0);

  return `PO${maxPoNumber + 1}`;
};

export const validateAttainmentRanges = (
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
      return `Attainment level must be an integer between ${Math.min(minLevel, maxLevel)} and ${Math.max(minLevel, maxLevel)}.`;
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
