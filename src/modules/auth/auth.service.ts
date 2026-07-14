import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../../config/prisma";
import { Role, Position, LeaveType } from "@prisma/client";
import { AppError } from "../../middlewares/error.middleware";
import { sendEmail } from "../../config/mailer";
import {
  PERSONAL_CYCLES,
  DEPARTMENT_CYCLES,
  calculateDaysSinceReference,
  SlotKey,
} from "../../utils/shiftAlgorithm";

// ─── Helper: Calculate cycle offset for a staff member ──
const calculateCycleOffsetForUser = (
  position: Position,
  departmentName: string,
  referenceDate: string = "2026-06-01",
): { offset: number; cycle: SlotKey[]; cycleLength: number } => {
  // Check if there's a personal cycle defined for this staff member
  // You can match by email or name pattern, or use position/department logic
  const personalCycleKey = `${departmentName.toLowerCase()}_${position.toLowerCase()}`;

  // For Pharmacy staff with specific cycles
  if (departmentName.toLowerCase() === "pharmacy") {
    if (position === "PHARMACIST") {
      const cycle = ["M", "M", "M", "M", "M", "O", "O"] as SlotKey[];
      return {
        offset: 0,
        cycle,
        cycleLength: cycle.length,
      };
    } else if (position === "LAB_TECHNICIAN" || position === "NURSE") {
      const cycle = ["N", "N", "N", "N", "O", "O", "O", "O"] as SlotKey[];
      return {
        offset: 0,
        cycle,
        cycleLength: cycle.length,
      };
    } else {
      // Rotating cycle for other pharmacy staff
      const cycle = ["M", "M", "A", "A", "N", "N", "O", "O"] as SlotKey[];
      return {
        offset: 0,
        cycle,
        cycleLength: cycle.length,
      };
    }
  }

  // For departments with shared cycles (Records, OPD, Maternity, etc.)
  const deptCycle = DEPARTMENT_CYCLES[departmentName.toLowerCase()];
  if (deptCycle) {
    // Get all staff in this department to calculate offsets
    // We'll calculate offset based on when they joined
    const today = new Date();
    const dayIndex = calculateDaysSinceReference(
      deptCycle.referenceDate,
      today.getFullYear(),
      today.getMonth() + 1,
      today.getDate(),
    );

    // Calculate offset based on join date (using today as default)
    const offset = dayIndex % deptCycle.cycleLength;

    return {
      offset,
      cycle: deptCycle.cycle,
      cycleLength: deptCycle.cycleLength,
    };
  }

  // Default cycle for departments without defined cycles
  const defaultCycle = ["M", "M", "M", "M", "M", "O", "O"] as SlotKey[];
  return {
    offset: 0,
    cycle: defaultCycle,
    cycleLength: defaultCycle.length,
  };
};

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

  // ─── Calculate cycle data ─────────────────────────────
  let cycleOffset = 0;
  let personalCycle: string[] | null = null;
  let cycleStartDate: string | null = null;

  if (departmentId) {
    try {
      // Get department name
      const department = await prisma.department.findUnique({
        where: { id: departmentId },
        select: { name: true },
      });

      if (department) {
        const cycleData = calculateCycleOffsetForUser(
          position,
          department.name,
        );

        cycleOffset = cycleData.offset;
        personalCycle = cycleData.cycle.map((s) => s.toString());
        cycleStartDate = new Date().toISOString().split("T")[0];
      }
    } catch (error) {
      console.error("Failed to calculate cycle offset:", error);
      // Fallback to default
      cycleOffset = 0;
      personalCycle = ["M", "M", "M", "M", "M", "O", "O"];
      cycleStartDate = new Date().toISOString().split("T")[0];
    }
  }

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
        cycleOffset,
        personalCycle: personalCycle ? JSON.stringify(personalCycle) : null,
        cycleStartDate,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        position: true,
        departmentId: true,
        cycleOffset: true,
        personalCycle: true,
        cycleStartDate: true,
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

  // notify the new staff member with their login credentials
  try {
    await sendEmail(
      email,
      "Welcome to Divine Netcare Hospital — Your Account Details",
      `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #1a1a1a; }
            .container { max-width: 500px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #0ea5e9; }
            .logo { font-size: 24px; font-weight: bold; color: #0ea5e9; }
            .content { padding: 30px 0; }
            .credentials { background: #f8fafc; border-radius: 6px; padding: 16px; margin: 16px 0; }
            .credentials p { margin: 4px 0; }
            .footer { text-align: center; padding-top: 20px; border-top: 1px solid #e5e5e5; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">Divine Netcare Hospital</div>
            </div>
            <div class="content">
              <h2>Welcome, ${firstName}!</h2>
              <p>An administrator has created your staff account for the LifeCare HMS app.</p>
              <div class="credentials">
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Temporary password:</strong> ${password}</p>
              </div>
              <p>Please log in and change your password as soon as possible.</p>
            </div>
            <div class="footer">
              <p>Divine Netcare Hospital · Quality Healthcare For All</p>
            </div>
          </div>
        </body>
        </html>
      `,
    );
  } catch (emailErr) {
    console.error("Failed to send welcome email:", emailErr);
  }

  return user;
};

// ─── LOGIN (unchanged) ──────────────────────────────────

// ─── LOGIN (now includes department + profile) ──────────
export const loginUser = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      department: { select: { id: true, name: true } },
      profile: true,
    },
  });

  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  if (!user.isActive) {
    throw new AppError("This account has been deactivated", 401);
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
      cycleOffset: user.cycleOffset,
      department: user.department,
      profile: user.profile,
    },
  };
};

// ─── CHANGE PASSWORD (now sends a confirmation email) ──────
export const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string,
) => {
  // step 1 — get the user's current hashed password + info needed for the email
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, password: true, email: true, firstName: true },
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  // step 2 — verify the current password is correct
  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    throw new AppError("Current password is incorrect", 400);
  }

  // step 3 — block reusing the same password
  const isSame = await bcrypt.compare(newPassword, user.password);
  if (isSame) {
    throw new AppError(
      "New password must be different from the current password",
      400,
    );
  }

  // step 4 — basic strength check
  if (newPassword.length < 8) {
    throw new AppError("Password must be at least 8 characters", 400);
  }

  // step 5 — hash and update
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  // step 6 — notify the user their password was changed
  try {
    await sendEmail(
      user.email,
      "Divine Netcare Hospital — Your Password Was Changed",
      `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #1a1a1a; }
            .container { max-width: 500px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #0ea5e9; }
            .logo { font-size: 24px; font-weight: bold; color: #0ea5e9; }
            .content { padding: 30px 0; }
            .alert-box { background: #f0fdf4; border-left: 4px solid #16a34a; border-radius: 6px; padding: 16px; margin: 16px 0; }
            .warning-box { background: #fef2f2; border-left: 4px solid #dc2626; border-radius: 6px; padding: 16px; margin: 16px 0; }
            .footer { text-align: center; padding-top: 20px; border-top: 1px solid #e5e5e5; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">Divine Netcare Hospital</div>
            </div>
            <div class="content">
              <h2>Hi ${user.firstName},</h2>
              <div class="alert-box">
                <p>Your account password was changed successfully on ${new Date().toLocaleString(
                  "en-US",
                  { dateStyle: "medium", timeStyle: "short" },
                )}.</p>
              </div>
              <div class="warning-box">
                <p><strong>Wasn't you?</strong> If you did not make this change, please contact your administrator immediately to secure your account.</p>
              </div>
            </div>
            <div class="footer">
              <p>Divine Netcare Hospital · Quality Healthcare For All</p>
            </div>
          </div>
        </body>
        </html>
      `,
    );
  } catch (emailErr) {
    console.error(
      "Failed to send password-change confirmation email:",
      emailErr,
    );
    // don't fail the whole request just because the email failed
  }

  return { message: "Password changed successfully" };
};
