import { SwapStatus } from "@prisma/client";
import prisma from "../../config/prisma";
import { AppError } from "../../middlewares/error.middleware";
import { allowedNodeEnvironmentFlags } from "node:process";

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
    const workingShifts = department.shiftTypes.filter((s) => !s.isDayOff);
    const dayOffShift = department.shiftTypes.find((s) => s.isDayOff);
    const minStaff = department.minStaffPerShift;
    const totalStaff = staff.length;

    if (!dayOffShift) {
      throw new AppError(
        "No Day Off shift type found for this department. Please create one first.",
        400,
      );
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const rotationInterval = 2; // rotate every 2 days
      const rotationCycle = Math.floor((day - 1) / rotationInterval);

      // build the slot list for this day
      // e.g. for Records with minStaff=1 and 2 working shifts:
      // slots = [Day, Night, DayOff]
      const slots: string[] = [];

      workingShifts.forEach((shiftType) => {
        for (let i = 0; i < minStaff; i++) {
          slots.push(shiftType.id);
        }
      });

      // fill remaining staff with day off
      while (slots.length < totalStaff) {
        slots.push(dayOffShift.id);
      }

      staff.forEach((member, staffIndex) => {
        const slotIndex = (staffIndex + rotationCycle) % totalStaff;
        shiftsToCreate.push({
          userId: member.id,
          departmentId,
          shiftTypeId: slots[slotIndex],
          date,
        });
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
