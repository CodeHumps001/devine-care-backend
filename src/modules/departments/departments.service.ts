import prisma from "../../config/prisma";
import { AppError } from "../../middlewares/error.middleware";

export const createDep = async (name: string) => {
  const department = await prisma.department.findUnique({
    where: { name },
  });

  if (department) {
    throw new AppError("Department already exists", 400);
  }
  const newDep = await prisma.department.create({
    data: { name },
  });
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
export const updateDep = async (id: string, newName: string) => {
  const department = await prisma.department.findUnique({
    where: { id },
  });

  if (!department) {
    throw new AppError("Department not found", 404);
  }
  const renameDep = await prisma.department.update({
    where: { id },
    data: {
      name: newName,
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
