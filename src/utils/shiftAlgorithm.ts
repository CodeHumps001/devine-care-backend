// slot map keys match what's stored in cycle arrays
export type SlotKey = "F" | "N" | "M" | "A" | "O";

// department shared cycles
export const DEPARTMENT_CYCLES: Record<
  string,
  {
    cycle: SlotKey[];
    cycleLength: number;
    referenceDate: string;
  }
> = {
  records: {
    cycle: [
      "F",
      "O",
      "F",
      "F",
      "F",
      "O",
      "F",
      "O",
      "N",
      "N",
      "N",
      "N",
      "N",
      "O",
      "O",
    ],
    cycleLength: 15,
    referenceDate: "2026-06-01",
  },
  // add more departments as you get their timetables
  // 'opd': { cycle: [...], cycleLength: X, referenceDate: '2026-06-01' }
};

// personal cycles for staff with individual patterns (e.g. Pharmacy)
export const PERSONAL_CYCLES: Record<
  string,
  {
    cycle: SlotKey[];
    cycleLength: number;
    referenceDate: string;
    offset: number;
  }
> = {
  // pharmacy staff
  rich: {
    cycle: ["M", "M", "M", "M", "M", "O", "O"],
    cycleLength: 7,
    referenceDate: "2026-06-01",
    offset: 0,
  },
  asante: {
    cycle: ["N", "N", "N", "N", "O", "O", "O", "O"],
    cycleLength: 8,
    referenceDate: "2026-06-01",
    offset: 0,
  },
  // add emelia, vic, franc once their cycles are confirmed
};

export const getSlotMapForDepartment = (
  shiftTypes: {
    id: string;
    name: string;
    isDayOff: boolean;
  }[],
) => {
  const slotMap: Partial<Record<SlotKey, string>> = {};

  shiftTypes.forEach((st) => {
    const name = st.name.toLowerCase();
    if (st.isDayOff) {
      slotMap["O"] = st.id;
    } else if (name.includes("full")) {
      slotMap["F"] = st.id;
    } else if (name.includes("night")) {
      slotMap["N"] = st.id;
    } else if (name.includes("morning")) {
      slotMap["M"] = st.id;
    } else if (name.includes("afternoon")) {
      slotMap["A"] = st.id;
    }
  });

  return slotMap;
};

export const calculateDaysSinceReference = (
  referenceDate: string,
  year: number,
  month: number,
  day: number,
) => {
  const ref = new Date(referenceDate);
  const target = new Date(year, month - 1, day);
  return Math.floor((target.getTime() - ref.getTime()) / (1000 * 60 * 60 * 24));
};

export const calculateSmartOffsets = (
  staffCount: number,
  cycleLength: number,
) => {
  const spacing = cycleLength / staffCount;
  const isBalanced = cycleLength % staffCount === 0;

  const offsets = Array.from(
    { length: staffCount },
    (_, i) => Math.round(i * spacing) % cycleLength,
  );

  return {
    offsets,
    isBalanced,
    warning: isBalanced
      ? null
      : `${staffCount} staff cannot be perfectly distributed across a ${cycleLength}-day cycle. Some days may have uneven coverage.`,
  };
};
