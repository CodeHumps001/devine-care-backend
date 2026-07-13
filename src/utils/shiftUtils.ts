// utils/shiftUtils.ts

/**
 * Generate a personal cycle for a staff member based on their position and department
 */
export function generatePersonalCycle(
  position: string,
  departmentName: string,
): { cycle: string[]; cycleLength: number; referenceDate: string } {
  const defaultCycle = ["M", "M", "M", "M", "M", "O", "O"];
  const referenceDate = "2026-06-01";

  // For Pharmacy staff - specific cycles
  if (departmentName.toLowerCase() === "pharmacy") {
    if (position === "PHARMACIST") {
      // Morning shift cycle for pharmacists
      return {
        cycle: ["M", "M", "M", "M", "M", "O", "O"],
        cycleLength: 7,
        referenceDate: "2026-06-01",
      };
    } else if (position === "LAB_TECHNICIAN" || position === "NURSE") {
      // Night shift cycle
      return {
        cycle: ["N", "N", "N", "N", "O", "O", "O", "O"],
        cycleLength: 8,
        referenceDate: "2026-06-01",
      };
    } else {
      // Rotating cycle for other pharmacy staff
      return {
        cycle: ["M", "M", "A", "A", "N", "N", "O", "O"],
        cycleLength: 8,
        referenceDate: "2026-06-01",
      };
    }
  }

  // For Records department
  if (departmentName.toLowerCase() === "records") {
    return {
      cycle: ["M", "M", "M", "M", "M", "O", "O"],
      cycleLength: 7,
      referenceDate: "2026-06-01",
    };
  }

  // For Maternity department
  if (departmentName.toLowerCase() === "maternity") {
    return {
      cycle: ["M", "M", "M", "M", "M", "O", "O"],
      cycleLength: 7,
      referenceDate: "2026-06-01",
    };
  }

  // Default cycle for other departments
  return {
    cycle: defaultCycle,
    cycleLength: defaultCycle.length,
    referenceDate: "2026-06-01",
  };
}

/**
 * Calculate the cycle offset for a staff member
 */
export function calculateCycleOffset(
  personalCycle: string[],
  cycleLength: number,
  referenceDate: string,
  startDate: string,
): number {
  if (!personalCycle || personalCycle.length === 0) {
    return 0;
  }

  const refDate = new Date(referenceDate);
  const start = new Date(startDate);

  // Calculate days between reference date and start date
  const diffTime = start.getTime() - refDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  // Calculate offset based on cycle length
  const offset = diffDays % cycleLength;

  return offset >= 0 ? offset : offset + cycleLength;
}
