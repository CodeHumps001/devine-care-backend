import { Role } from "@prisma/client";
import prisma from "../../config/prisma";
import { AppError } from "../../middlewares/error.middleware";

const user = async (id: string) => {
  const data = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      position: true,
      departmentId: true,
      isActive: true,
      createdAt: true,
      profile: true,
      department: {
        select: { id: true, name: true },
      },
    },
  });

  if (!data) {
    throw new AppError("User not found", 404);
  }

  return data;
};

const users = async () => {
  const data = await prisma.user.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      position: true,
      departmentId: true,
      isActive: true,
      createdAt: true,
      profile: true,
      department: {
        select: { id: true, name: true },
      },
    },

    where: {
      isActive: true,
    },
  });
  return data;
};
const updateProfile = async (
  userId: string,
  data: { phone?: string; photoUrl?: string; bio?: string },
) => {
  const profile = await prisma.staffProfile.upsert({
    where: { userId },
    update: {
      phone: data.phone,
      photoUrl: data.photoUrl,
      bio: data.bio,
    },
    create: {
      userId,
      phone: data.phone,
      photoUrl: data.photoUrl,
      bio: data.bio,
    },
  });
  return profile;
};
const deactivateUser = async (id: string) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new AppError("User not found", 404);
  }
  const updateUser = await prisma.user.update({
    where: { id },
    data: { isActive: false },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      isActive: true,
    },
  });
  return updateUser;
};
const userDelete = async (id: string) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new AppError("User not found", 404);
  }

  await prisma.$transaction([
    prisma.staffProfile.deleteMany({ where: { userId: id } }),
    prisma.leaveBalance.deleteMany({ where: { userId: id } }),
    prisma.user.delete({ where: { id } }),
  ]);
};

export { user, users, userDelete, deactivateUser, updateProfile };
