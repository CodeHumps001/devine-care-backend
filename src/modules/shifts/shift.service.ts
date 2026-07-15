import { SwapStatus } from "@prisma/client";
import prisma from "../../config/prisma";
import { AppError } from "../../middlewares/error.middleware";
import { allowedNodeEnvironmentFlags } from "node:process";
import {
  calculateDaysSinceReference,
  DEPARTMENT_CYCLES,
  PERSONAL_CYCLES,
  getSlotMapForDepartment,
  SlotKey,
} from "../../utils/shiftAlgorithm";
import {
  sendBatchedPushNotifications,
  sendPushNotification,
} from "../../utils/pushNotifications";

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
// shift.service.ts - Updated generateShift function

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

  const daysInMonth = new Date(year, month, 0).getDate();
  const shiftsToCreate: {
    userId: string;
    departmentId: string;
    shiftTypeId: string;
    date: Date;
  }[] = [];

  const offShiftType = department.shiftTypes.find((s) => s.isDayOff);
  const defaultWorkingShift = department.shiftTypes.find((s) => !s.isDayOff);

  // ─── DEBUG: Log department info ────────────────────────────────────
  console.log(`🔍 Generating shifts for: ${department.name}`);
  console.log(`🔍 Staff count: ${department.users.length}`);
  console.log(
    `🔍 Shift types: ${department.shiftTypes.map((s) => s.name).join(", ")}`,
  );
  console.log(`🔍 staffGroups provided: ${staffGroups ? "Yes" : "No"}`);
  // ──────────────────────────────────────────────────────────────────

  if (mode === "auto") {
    const staff = department.users;
    const shiftTypes = department.shiftTypes;
    const slotMap = getSlotMapForDepartment(shiftTypes);
    const departmentCycle = DEPARTMENT_CYCLES[department.name.toLowerCase()];

    console.log(
      `🔍 Department cycle: ${departmentCycle ? "Found" : "Not found"}`,
    );
    console.log(`🔍 SlotMap:`, slotMap);

    // Setup fallback slots structure without failing due to strict staff limits
    let genericDailySlots: string[] | null = null;
    if (!departmentCycle) {
      const workingShifts = shiftTypes.filter((s) => !s.isDayOff);

      if (workingShifts.length === 0) {
        throw new AppError(
          "This department has no working shift types configured yet — add at least one (e.g. Morning, Night) before generating a schedule.",
          400,
        );
      }

      const slots: string[] = [];
      workingShifts.forEach((shiftType) => {
        for (let i = 0; i < department.minStaffPerShift; i++) {
          slots.push(shiftType.id);
        }
      });

      // Safely pad with off shifts only if we have more staff than required slots and an off shift exists
      if (offShiftType) {
        while (slots.length < staff.length) {
          slots.push(offShiftType.id);
        }
      }

      genericDailySlots = slots;
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);

      staff.forEach((member, staffIndex) => {
        let shiftTypeId: string | undefined;

        // Try to match hardcoded cycle fallback for staff (Priority 1 support)
        const hardcodedCycle = PERSONAL_CYCLES[member.firstName.toLowerCase()];

        // ─── PRIORITY 1: Personal Cycle (Pharmacy with real calendar) ───
        if (member.personalCycle || hardcodedCycle) {
          try {
            let cycle: SlotKey[];
            let referenceDate: string;
            let offset: number;

            if (member.personalCycle) {
              cycle = JSON.parse(member.personalCycle) as SlotKey[];
              referenceDate = member.cycleStartDate || "2026-06-01";
              offset = member.cycleOffset || 0;
            } else {
              cycle = hardcodedCycle.cycle;
              referenceDate = hardcodedCycle.referenceDate;
              offset = hardcodedCycle.offset;
            }

            const dayIndex = calculateDaysSinceReference(
              referenceDate,
              year,
              month,
              day,
            );

            // FIX: Safely handle negative modulo in JavaScript
            const cyclePosition =
              (((offset + dayIndex) % cycle.length) + cycle.length) %
              cycle.length;
            const slot = cycle[cyclePosition];
            shiftTypeId = slotMap[slot];

            if (!shiftTypeId) {
              throw new Error(
                `personalCycle slot "${slot}" has no matching shift type in ${department.name}`,
              );
            }

            // Debug first 3 days
            if (day <= 3) {
              console.log(
                `   📌 ${member.firstName} (personal): day=${day}, slot=${slot}, shiftTypeId=${shiftTypeId?.substring(0, 8)}...`,
              );
            }
          } catch (error) {
            throw new AppError(
              `Failed to apply personal cycle for ${member.firstName} ${member.lastName}: ${
                error instanceof Error
                  ? error.message
                  : "invalid personalCycle data"
              }. Fix their personal cycle before generating this schedule.`,
              400,
            );
          }
        }

        // ─── PRIORITY 2: Department Cycle (Records, OPD, etc.) ───
        else if (departmentCycle) {
          const { cycle, cycleLength, referenceDate } = departmentCycle;
          const dayIndex = calculateDaysSinceReference(
            referenceDate,
            year,
            month,
            day,
          );

          // FIX: Safely handle negative modulo
          const cyclePosition =
            (((member.cycleOffset + dayIndex) % cycleLength) + cycleLength) %
            cycleLength;
          const slot = cycle[cyclePosition] as SlotKey;
          shiftTypeId = slotMap[slot];

          // Debug first 3 days
          if (day <= 3) {
            console.log(
              `   📌 ${member.firstName} (dept cycle): day=${day}, slot=${slot}, shiftTypeId=${shiftTypeId?.substring(0, 8)}...`,
            );
          }
        }

        // ─── PRIORITY 3: Staff Groups (Pharmacy fallback) ───
        else if (staffGroups) {
          const isMorning = staffGroups.morning?.includes(member.id);
          const isNight = staffGroups.night?.includes(member.id);
          const isRotating = staffGroups.rotating?.includes(member.id);

          // Log group assignment on day 1
          if (day === 1) {
            console.log(
              `   📌 ${member.firstName}: Morning=${!!isMorning}, Night=${!!isNight}, Rotating=${!!isRotating}`,
            );
          }

          if (isMorning) {
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

            // FIX: Safely handle negative modulo
            const cyclePosition = (((offset + dayIndex) % 7) + 7) % 7;
            shiftTypeId = slotMap[morningCycle[cyclePosition]];
          } else if (isNight) {
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

            // FIX: Safely handle negative modulo
            const cyclePosition = (((offset + dayIndex) % 8) + 8) % 8;
            shiftTypeId = slotMap[nightCycle[cyclePosition]];
          } else if (isRotating) {
            const workingShifts = shiftTypes.filter((s) => !s.isDayOff);
            const rotatingStaff = staff.filter((s) =>
              staffGroups.rotating?.includes(s.id),
            );
            const rotatingIndex = rotatingStaff.findIndex(
              (s) => s.id === member.id,
            );
            const totalRotating = rotatingStaff.length;
            const slots: SlotKey[] = [];

            workingShifts.forEach((st) => {
              const key = st.name.toLowerCase().includes("morning")
                ? "M"
                : st.name.toLowerCase().includes("afternoon")
                  ? "A"
                  : st.name.toLowerCase().includes("night")
                    ? "N"
                    : "F";
              slots.push(key, key);
            });
            slots.push("O", "O");

            const dayIndex = calculateDaysSinceReference(
              "2026-06-01",
              year,
              month,
              day,
            );
            const spacing = Math.round(slots.length / totalRotating);
            const offset = (rotatingIndex * spacing) % slots.length;

            // FIX: Safely handle negative modulo
            const cyclePosition =
              (((offset + dayIndex) % slots.length) + slots.length) %
              slots.length;
            shiftTypeId = slotMap[slots[cyclePosition]];
          }
        }

        // ─── PRIORITY 4: Generic Fallback ───
        else if (genericDailySlots) {
          const cycleLength = genericDailySlots.length;
          const slotIndex = (staffIndex + (day - 1)) % cycleLength;
          shiftTypeId = genericDailySlots[slotIndex];

          if (day === 1) {
            console.log(
              `   📌 ${member.firstName} (generic fallback): slotIndex=${slotIndex}, cycleLength=${cycleLength}`,
            );
          }
        }

        if (shiftTypeId) {
          shiftsToCreate.push({
            userId: member.id,
            departmentId,
            shiftTypeId,
            date,
          });
        } else {
          console.error(
            `❌ No shiftTypeId resolved for ${member.firstName} on day ${day} — this staff member was NOT scheduled for this day.`,
          );
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

  console.log(`📊 Total shifts to create: ${shiftsToCreate.length}`);

  // Delete existing swap requests linked to this department's shifts first
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

  // ── Notify every staff member who actually got a shift created,
  // derived from shiftsToCreate itself rather than the input staffGroups —
  // this correctly covers auto mode (personal cycle, department cycle,
  // staffGroups, or generic fallback) and manual mode alike, since all
  // four paths converge into shiftsToCreate before this point.
  const uniqueAssignedUserIds = [
    ...new Set(shiftsToCreate.map((s) => s.userId)),
  ];

  if (uniqueAssignedUserIds.length > 0) {
    const recipients = await prisma.user.findMany({
      where: { id: { in: uniqueAssignedUserIds } },
      select: { expoPushToken: true },
    });

    void sendBatchedPushNotifications(
      recipients,
      "New Shift Schedule",
      `Your schedule for ${month}/${year} is ready. Tap to view.`,
      { type: "SHIFT_REMINDER" },
    );
  }

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
const getMySwapRequests = async (userId: string) => {
  return prisma.shiftSwapRequest.findMany({
    where: { OR: [{ requesterId: userId }, { targetStaffId: userId }] },
    include: {
      requester: { select: { firstName: true, lastName: true } },
      targetStaff: { select: { firstName: true, lastName: true } },
      originalShift: { include: { shiftType: true } },
      targetShift: { include: { shiftType: true } },
    },
    orderBy: { createdAt: "desc" },
  });
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

  const dept = await prisma.department.findUnique({
    where: { id: originalShift.departmentId },
    select: {
      id: true,
      users: { where: { role: "DEPT_HEAD" }, select: { expoPushToken: true } },
    },
  });
  const requester = await prisma.user.findUnique({
    where: { id: requesterId },
    select: { firstName: true, lastName: true },
  });
  for (const head of dept?.users || []) {
    void sendPushNotification(
      head.expoPushToken,
      "Shift Swap Request",
      `${requester?.firstName} ${requester?.lastName} requested a shift swap`,
      { type: "SWAP_REQUEST" },
    );
  }

  return swapRequest;
};
const getDepartmentSwapRequests = async (departmentId: string) => {
  return prisma.shiftSwapRequest.findMany({
    where: {
      OR: [
        { originalShift: { departmentId } },
        { targetShift: { departmentId } },
      ],
    },
    include: {
      requester: { select: { firstName: true, lastName: true } },
      targetStaff: { select: { firstName: true, lastName: true } },
      originalShift: { include: { shiftType: true } },
      targetShift: { include: { shiftType: true } },
    },
    orderBy: { createdAt: "desc" },
  });
};

const getColleagueShifts = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { departmentId: true },
  });
  if (!user?.departmentId) {
    throw new AppError("No department assigned", 400);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return prisma.shift.findMany({
    where: {
      departmentId: user.departmentId,
      userId: { not: userId },
      date: { gte: today },
    },
    include: {
      user: { select: { id: true, firstName: true, lastName: true } },
      shiftType: true,
    },
    orderBy: { date: "asc" },
  });
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

  const requesterInfo = await prisma.user.findUnique({
    where: { id: swapRequest.requesterId },
    select: { expoPushToken: true },
  });
  void sendPushNotification(
    requesterInfo?.expoPushToken,
    status === "APPROVED" ? "Swap Approved" : "Swap Rejected",
    status === "APPROVED"
      ? "Your shift swap request was approved."
      : "Your shift swap request was rejected.",
    { type: "SWAP_REVIEW" },
  );

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
  getMySwapRequests,
  getDepartmentSwapRequests,
  getColleagueShifts,
};
