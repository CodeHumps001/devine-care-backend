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
  rich: {
    cycle: ["M", "M", "M", "M", "M", "O", "O"],
    cycleLength: 7,
    referenceDate: "2026-06-29", // Monday start aligns the 5/2 split perfectly
    offset: 0,
  },
  asante: {
    cycle: ["N", "N", "N", "N", "O", "O", "O", "O"],
    cycleLength: 8,
    referenceDate: "2026-07-01", // Aligns with Wed July 1st
    offset: 0,
  },
  // Exact July 2026 mappings for irregular weekend rotators (31 days)
  emelia: {
    cycle: [
      "O",
      "A",
      "O",
      "M",
      "A",
      "A",
      "O",
      "A",
      "A",
      "O",
      "M",
      "N",
      "N",
      "N",
      "N",
      "O",
      "O",
      "O",
      "O",
      "A",
      "O",
      "A",
      "O",
      "A",
      "M",
      "A",
      "O",
      "N",
      "N",
      "N",
      "N",
    ],
    cycleLength: 31,
    referenceDate: "2026-07-01",
    offset: 0,
  },
  vic: {
    cycle: [
      "O",
      "O",
      "O",
      "A",
      "M",
      "O",
      "A",
      "O",
      "O",
      "A",
      "A",
      "M",
      "A",
      "O",
      "A",
      "O",
      "A",
      "A",
      "M",
      "O",
      "A",
      "O",
      "A",
      "O",
      "A",
      "M",
      "A",
      "A",
      "O",
      "A",
      "O",
    ],
    cycleLength: 31,
    referenceDate: "2026-07-01",
    offset: 0,
  },
  franc: {
    cycle: [
      "A",
      "O",
      "A",
      "N",
      "N",
      "N",
      "N",
      "O",
      "O",
      "O",
      "O",
      "A",
      "O",
      "A",
      "O",
      "A",
      "O",
      "M",
      "A",
      "N",
      "N",
      "N",
      "N",
      "O",
      "O",
      "O",
      "O",
      "O",
      "A",
      "O",
      "A",
    ],
    cycleLength: 31,
    referenceDate: "2026-07-01",
    offset: 0,
  },
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

    // 🔥 CRITICAL: Map "O" for Off shifts
    // Check isDayOff flag OR name contains "off"
    if (st.isDayOff || name.includes("off") || name === "off") {
      slotMap["O"] = st.id;
    }
    // Map "F" for Full Day
    else if (name.includes("full") || name.includes("day")) {
      slotMap["F"] = st.id;
    }
    // Map "N" for Night
    else if (name.includes("night")) {
      slotMap["N"] = st.id;
    }
    // Map "M" for Morning
    else if (name.includes("morning")) {
      slotMap["M"] = st.id;
    }
    // Map "A" for Afternoon
    else if (name.includes("afternoon")) {
      slotMap["A"] = st.id;
    }
  });

  // 🔥 Debug: Log what was mapped
  console.log("🔍 SlotMap:", slotMap);

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
