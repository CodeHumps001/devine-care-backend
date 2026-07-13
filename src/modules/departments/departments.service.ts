import prisma from "../../config/prisma";
import { AppError } from "../../middlewares/error.middleware";

import { createGroupConversation } from "../chat/chat.service";

export const createDep = async (name: string, minStaffPerShift?: number) => {
  const department = await prisma.department.findUnique({
    where: { name },
  });

  if (department) {
    throw new AppError("Department already saved", 400);
  }

  if (minStaffPerShift !== undefined && minStaffPerShift < 1) {
    throw new AppError("Minimum staff per shift must be at least 1", 400);
  }

  const newDep = await prisma.department.create({
    data: {
      name,
      ...(minStaffPerShift !== undefined ? { minStaffPerShift } : {}),
    },
  });

  // automatically create a group conversation for this department
  await createGroupConversation(newDep.id);

  return newDep;
};

export const viewDep = async () => {
  const allDep = await prisma.department.findMany({
    include: {
      _count: {
        select: { users: true },
      },
    },
  });

  return allDep;
};

export const viewUniqueDep = async (id: string) => {
  const department = await prisma.department.findUnique({
    where: { id },
    include: {
      shiftTypes: true,
      users: true,
    },
  });

  if (!department) {
    throw new AppError("Department not found", 404);
  }

  return department;
};

export const updateDep = async (
  id: string,
  newName: string,
  minStaffPerShift?: number,
) => {
  const department = await prisma.department.findUnique({
    where: { id },
  });

  if (!department) {
    throw new AppError("Department not found", 404);
  }

  if (minStaffPerShift !== undefined && minStaffPerShift < 1) {
    throw new AppError("Minimum staff per shift must be at least 1", 400);
  }

  const renameDep = await prisma.department.update({
    where: { id },
    data: {
      name: newName,
      ...(minStaffPerShift !== undefined ? { minStaffPerShift } : {}),
    },
  });

  return renameDep;
};
export const deleteDep = async (id: string) => {
  const department = await prisma.department.findUnique({
    where: { id },
  });

  if (!department) {
    throw new AppError("Department not found", 404);
  }

  const delDep = await prisma.department.delete({
    where: { id },
  });

  return delDep;
};
