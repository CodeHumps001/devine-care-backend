import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../../config/prisma";
import { Role, Position, LeaveType } from "@prisma/client";
import { AppError } from "../../middlewares/error.middleware";

// ─── REGISTER ────────────────────────────────────────────

export const registerUser = async (
  firstName: string,
  lastName: string,
  email: string,
  password: string,
  role: Role,
  position: Position,
  departmentId?: string,
) => {
  const userExists = await prisma.user.findUnique({
    where: { email },
  });

  if (userExists) {
    throw new AppError("User with this email already exists", 401);
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const currentYear = new Date().getFullYear();

  const defaultLeaveAllocations = [
    { leaveType: LeaveType.ANNUAL, totalDays: 21 },
    { leaveType: LeaveType.SICK, totalDays: 14 },
    { leaveType: LeaveType.EMERGENCY, totalDays: 3 },
    { leaveType: LeaveType.MATERNITY, totalDays: 84 },
    { leaveType: LeaveType.PATERNITY, totalDays: 5 },
  ];

  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role,
        position,
        departmentId,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        position: true,
        departmentId: true,
        createdAt: true,
      },
    });

    await tx.leaveBalance.createMany({
      data: defaultLeaveAllocations.map((allocation) => ({
        userId: newUser.id,
        leaveType: allocation.leaveType,
        year: currentYear,
        totalDays: allocation.totalDays,
        usedDays: 0,
      })),
    });

    return newUser;
  });

  return user;
};

// ─── LOGIN ───────────────────────────────────────────────

export const loginUser = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  const passwordMatch = await bcrypt.compare(password, user.password);

  if (!passwordMatch) {
    throw new AppError("Invalid email or password", 401);
  }

  const token = jwt.sign(
    {
      id: user.id,
      role: user.role,
      position: user.position,
      departmentId: user.departmentId,
    },
    process.env.JWT_SECRET as string,
    { expiresIn: "7d" },
  );

  return {
    token,
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      position: user.position,
      departmentId: user.departmentId,
    },
  };
};
