import { LeaveStatus, LeaveType } from "@prisma/client";
import prisma from "../../config/prisma";
import { AppError } from "../../middlewares/error.middleware";

const createLeave = async (
  userId: string,
  leaveType: LeaveType,
  startDate: string,
  endDate: string,
  reason: string,
) => {
  // step 1 — calculate number of days requested
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffMs = end.getTime() - start.getTime();
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (days <= 0) {
    throw new AppError("End date must be after start date", 400);
  }

  // step 2 — get current year leave balance for this leave type
  const currentYear = new Date().getFullYear();
  const balance = await prisma.leaveBalance.findUnique({
    where: {
      userId_leaveType_year: {
        userId,
        leaveType,
        year: currentYear,
      },
    },
  });

  if (!balance) {
    throw new AppError("No leave balance found for this leave type", 404);
  }

  // step 3 — check if user has enough remaining days
  const remainingDays = balance.totalDays - balance.usedDays;
  if (days > remainingDays) {
    throw new AppError(
      `Insufficient leave balance. You have ${remainingDays} days remaining`,
      400,
    );
  }

  // step 4 — check for overlapping leave applications
  const overlapping = await prisma.leaveApplication.findFirst({
    where: {
      userId,
      status: { not: "REJECTED" },
      OR: [
        {
          startDate: { lte: end },
          endDate: { gte: start },
        },
      ],
    },
  });

  if (overlapping) {
    throw new AppError(
      "You already have a leave application for this period",
      400,
    );
  }

  // step 5 — create the leave application
  const leave = await prisma.leaveApplication.create({
    data: {
      userId,
      leaveType,
      startDate: start,
      endDate: end,
      reason,
    },
  });

  return leave;
};

const getMyLeave = async (userId: string) => {
  // return all leave applications for this user with balance info
  const leaves = await prisma.leaveApplication.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return leaves;
};

const getDepartmentLeave = async (departmentId: string) => {
  // get all leave applications for users in this department
  const leaves = await prisma.leaveApplication.findMany({
    where: {
      user: {
        departmentId,
      },
    },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          position: true,
          department: {
            select: { name: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return leaves;
};

const reviewLeave = async (
  id: string,
  status: LeaveStatus,
  reviewedBy: string,
  reviewNote?: string,
) => {
  // step 1 — find the leave application
  const leave = await prisma.leaveApplication.findUnique({
    where: { id },
  });

  if (!leave) {
    throw new AppError("Leave application not found", 404);
  }

  // step 2 — block reviewing an already reviewed application
  if (leave.status !== "PENDING") {
    throw new AppError(
      `Leave application already ${leave.status.toLowerCase()}`,
      400,
    );
  }

  if (status === "APPROVED") {
    // step 3 — calculate days to deduct from balance
    const diffMs = leave.endDate.getTime() - leave.startDate.getTime();
    const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const currentYear = new Date().getFullYear();

    // step 4 — run transaction: update application + deduct leave balance
    await prisma.$transaction([
      prisma.leaveApplication.update({
        where: { id },
        data: {
          status: "APPROVED",
          reviewedBy,
          reviewNote,
        },
      }),
      prisma.leaveBalance.update({
        where: {
          userId_leaveType_year: {
            userId: leave.userId,
            leaveType: leave.leaveType,
            year: currentYear,
          },
        },
        data: {
          usedDays: { increment: days },
        },
      }),
    ]);
  } else {
    // step 5 — just update status if rejected
    await prisma.leaveApplication.update({
      where: { id },
      data: {
        status: "REJECTED",
        reviewedBy,
        reviewNote,
      },
    });
  }

  return { message: `Leave application ${status.toLowerCase()}` };
};

export { createLeave, getMyLeave, getDepartmentLeave, reviewLeave };
