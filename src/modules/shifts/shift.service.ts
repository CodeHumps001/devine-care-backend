import { SwapStatus } from "@prisma/client";
import prisma from "../../config/prisma";
import { AppError } from "../../middlewares/error.middleware";
import { allowedNodeEnvironmentFlags } from "node:process";
import {
  calculateDaysSinceReference,
  DEPARTMENT_CYCLES,
  getSlotMapForDepartment,
  SlotKey,
} from "../../utils/shiftAlgorithm";

const postShiftType = async (
  name: string,
  startTime: string,
  endTime: string,
  departmentId: string,
  isDayOff: boolean = false,
) => {
  const dep = await prisma.department.findUnique({
    where: { id: departmentId },
  });
  if (!dep) {
    throw new AppError("Selected department dont exist", 404);
  }
  const shift = await prisma.shiftType.findFirst({
    where: { name, departmentId },
  });
  if (shift) {
    throw new AppError(
      "Shift type with this name already exists in this department",
      400,
    );
  }
  const data = await prisma.shiftType.create({
    data: {
      name,
      startTime,
      endTime,
      departmentId,
      isDayOff,
    },
  });

  return data;
};
const getSingleShiftType = async (departmentId: string) => {
  const department = await prisma.department.findUnique({
    where: { id: departmentId },
    include: {
      shiftTypes: true,
    },
  });

  if (!department) {
    throw new AppError("Department not found", 404);
  }

  return department.shiftTypes;
};
const putShiftType = async (
  id: string,
  name: string,
  startTime: string,
  endTime: string,
) => {
  const shiftType = await prisma.shiftType.findUnique({ where: { id } });

  if (!shiftType) {
    throw new AppError("Shift type not found", 404);
  }

  const data = await prisma.shiftType.update({
    where: { id },
    data: { name, startTime, endTime },
  });

  return data;
};
const delShiftType = async (id: string) => {
  const shift = await prisma.shiftType.findUnique({ where: { id } });
  if (!shift) {
    throw new AppError("Shift type not found", 404);
  }

  const data = await prisma.shiftType.delete({ where: { id } });
  return data;
};

// SHIFT CONTROLLER //
// ===================== ============================================
const generateShift = async (
  departmentId: string,
  month: number,
  year: number,
  mode: "auto" | "manual",
  assignments?: { userId: string; shiftTypeId: string; days: number[] }[],
  staffGroups?: {
    morning?: string[];
    night?: string[];
    rotating?: string[];
  },
) => {
  const department = await prisma.department.findUnique({
    where: { id: departmentId },
    include: {
      users: true,
      shiftTypes: true,
    },
  });

  if (!department) {
    throw new AppError("Department not found", 404);
  }

  if (department.users.length === 0) {
    throw new AppError("No staff found in this department", 400);
  }

  if (department.shiftTypes.length === 0) {
    throw new AppError("No shift types found for this department", 400);
  }

  // get number of days in the month
  const daysInMonth = new Date(year, month, 0).getDate();

  const shiftsToCreate: {
    userId: string;
    departmentId: string;
    shiftTypeId: string;
    date: Date;
  }[] = [];

  if (mode === "auto") {
    const staff = department.users;
    const shiftTypes = department.shiftTypes;
    const slotMap = getSlotMapForDepartment(shiftTypes);
    const departmentCycle = DEPARTMENT_CYCLES[department.name.toLowerCase()];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);

      staff.forEach((member, staffIndex) => {
        let shiftTypeId: string | undefined;

        if (departmentCycle) {
          // departments with a defined shared cycle e.g. Records
          const { cycle, cycleLength, referenceDate } = departmentCycle;
          const dayIndex = calculateDaysSinceReference(
            referenceDate,
            year,
            month,
            day,
          );
          const cyclePosition = (member.cycleOffset + dayIndex) % cycleLength;
          const slot = cycle[cyclePosition] as SlotKey;
          shiftTypeId = slotMap[slot];
        } else if (staffGroups) {
          // departments with staff groups e.g. Pharmacy
          const isMorning = staffGroups.morning?.includes(member.id);
          const isNight = staffGroups.night?.includes(member.id);
          const isRotating = staffGroups.rotating?.includes(member.id);

          const rotatingStaff = staff.filter((s) =>
            staffGroups.rotating?.includes(s.id),
          );
          const rotatingIndex = rotatingStaff.findIndex(
            (s) => s.id === member.id,
          );

          if (isMorning) {
            // 5 Morning, 2 Off cycle
            const morningCycle: SlotKey[] = ["M", "M", "M", "M", "M", "O", "O"];
            const morningStaff = staff.filter((s) =>
              staffGroups.morning?.includes(s.id),
            );
            const morningIndex = morningStaff.findIndex(
              (s) => s.id === member.id,
            );
            const dayIndex = calculateDaysSinceReference(
              "2026-06-01",
              year,
              month,
              day,
            );
            const offset = Math.round((morningIndex * 7) / morningStaff.length);
            const cyclePosition = (offset + dayIndex) % 7;
            shiftTypeId = slotMap[morningCycle[cyclePosition]];
          } else if (isNight) {
            // 4 Night, 4 Off cycle
            const nightCycle: SlotKey[] = [
              "N",
              "N",
              "N",
              "N",
              "O",
              "O",
              "O",
              "O",
            ];
            const nightStaff = staff.filter((s) =>
              staffGroups.night?.includes(s.id),
            );
            const nightIndex = nightStaff.findIndex((s) => s.id === member.id);
            const dayIndex = calculateDaysSinceReference(
              "2026-06-01",
              year,
              month,
              day,
            );
            const offset = Math.round((nightIndex * 8) / nightStaff.length);
            const cyclePosition = (offset + dayIndex) % 8;
            shiftTypeId = slotMap[nightCycle[cyclePosition]];
          } else if (isRotating) {
            // rotating staff go through M, A, N, O fairly
            // build rotation slots based on available shift types
            const workingShifts = shiftTypes.filter((s) => !s.isDayOff);
            const offShift = shiftTypes.find((s) => s.isDayOff);
            const totalRotating = rotatingStaff.length;

            // each rotating staff member gets a fair offset
            const rotatingCycleLength = workingShifts.length * 2 + 2; // e.g. M,M,A,A,N,N,O,O
            const slots: SlotKey[] = [];

            workingShifts.forEach((st) => {
              const key = st.name.toLowerCase().includes("morning")
                ? "M"
                : st.name.toLowerCase().includes("afternoon")
                  ? "A"
                  : st.name.toLowerCase().includes("night")
                    ? "N"
                    : "F";
              slots.push(key, key); // 2 days each
            });
            slots.push("O", "O"); // 2 off days

            const dayIndex = calculateDaysSinceReference(
              "2026-06-01",
              year,
              month,
              day,
            );
            const spacing = Math.round(slots.length / totalRotating);
            const offset = (rotatingIndex * spacing) % slots.length;
            const cyclePosition = (offset + dayIndex) % slots.length;
            shiftTypeId = slotMap[slots[cyclePosition]];
          }
        } else {
          // generic fallback for departments with no configuration
          const workingShifts = shiftTypes.filter((s) => !s.isDayOff);
          const offShift = shiftTypes.find((s) => s.isDayOff);
          const totalStaff = staff.length;
          const slots: string[] = [];

          workingShifts.forEach((shiftType) => {
            for (let i = 0; i < department.minStaffPerShift; i++) {
              slots.push(shiftType.id);
            }
          });

          while (slots.length < totalStaff) {
            if (offShift) slots.push(offShift.id);
          }

          const rotationCycle = Math.floor((day - 1) / 2);
          const slotIndex = (staffIndex + rotationCycle) % totalStaff;
          shiftTypeId = slots[slotIndex];
        }

        if (shiftTypeId) {
          shiftsToCreate.push({
            userId: member.id,
            departmentId,
            shiftTypeId,
            date,
          });
        }
      });
    }
  } else {
    // manual mode
    if (!assignments || assignments.length === 0) {
      throw new AppError("Assignments are required for manual mode", 400);
    }

    for (const assignment of assignments) {
      for (const day of assignment.days) {
        const date = new Date(year, month - 1, day);
        shiftsToCreate.push({
          userId: assignment.userId,
          departmentId,
          shiftTypeId: assignment.shiftTypeId,
          date,
        });
      }
    }
  }

  // delete existing swap requests linked to this department's shifts first
  const existingShifts = await prisma.shift.findMany({
    where: {
      departmentId,
      date: {
        gte: new Date(year, month - 1, 1),
        lte: new Date(year, month - 1, daysInMonth),
      },
    },
    select: { id: true },
  });

  const shiftIds = existingShifts.map((s) => s.id);

  await prisma.$transaction([
    prisma.shiftSwapRequest.deleteMany({
      where: {
        OR: [
          { originalShiftId: { in: shiftIds } },
          { targetShiftId: { in: shiftIds } },
        ],
      },
    }),
    prisma.shift.deleteMany({
      where: {
        departmentId,
        date: {
          gte: new Date(year, month - 1, 1),
          lte: new Date(year, month - 1, daysInMonth),
        },
      },
    }),
  ]);

  await prisma.shift.createMany({
    data: shiftsToCreate,
  });

  return {
    message: `${shiftsToCreate.length} shifts generated for ${department.name}`,
    month,
    year,
    totalShifts: shiftsToCreate.length,
  };
};
const getSingleShift = async (departmentId: string) => {
  const data = await prisma.shift.findMany({
    where: { departmentId },
    include: {
      user: {
        select: { firstName: true, lastName: true },
      },
      shiftType: {
        select: { name: true, startTime: true, endTime: true },
      },
    },
  });

  if (!data) {
    throw new AppError("Selected Department is not available", 404);
  }

  return data;
};
const getMyShifts = async (userId: string) => {
  const data = await prisma.shift.findMany({
    where: { userId },
    include: {
      user: {
        select: { firstName: true, lastName: true },
      },
      shiftType: {
        select: { name: true, startTime: true, endTime: true },
      },
    },
  });

  return data;
};
const postSwapRequest = async (
  requesterId: string,
  targetStaffId: string,
  originalShiftId: string,
  targetShiftId: string,
) => {
  const originalShift = await prisma.shift.findUnique({
    where: { id: originalShiftId },
  });
  if (!originalShift) throw new AppError("Original shift not found", 404);

  const targetShift = await prisma.shift.findUnique({
    where: { id: targetShiftId },
  });
  if (!targetShift) throw new AppError("Target shift not found", 404);

  if (originalShift.userId !== requesterId) {
    throw new AppError("You can only swap your own shifts", 403);
  }

  const swapRequest = await prisma.shiftSwapRequest.create({
    data: {
      requesterId,
      targetStaffId,
      originalShiftId,
      targetShiftId,
    },
  });

  return swapRequest;
};

const patchSwapRequest = async (id: string, status: SwapStatus) => {
  const swapRequest = await prisma.shiftSwapRequest.findUnique({
    where: { id },
  });

  if (!swapRequest) throw new AppError("Swap request not found", 404);

  if (status === "APPROVED") {
    await prisma.$transaction([
      prisma.shift.update({
        where: { id: swapRequest.originalShiftId },
        data: { userId: swapRequest.targetStaffId },
      }),
      prisma.shift.update({
        where: { id: swapRequest.targetShiftId },
        data: { userId: swapRequest.requesterId },
      }),
      prisma.shiftSwapRequest.update({
        where: { id },
        data: { status: "APPROVED" },
      }),
    ]);
  } else {
    await prisma.shiftSwapRequest.update({
      where: { id },
      data: { status: "REJECTED" },
    });
  }

  return { message: `Swap request ${status.toLowerCase()}` };
};

export {
  postShiftType,
  postSwapRequest,
  getMyShifts,
  getSingleShift,
  getSingleShiftType,
  putShiftType,
  delShiftType,
  generateShift,
  patchSwapRequest,
};
