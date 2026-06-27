-- AlterTable
ALTER TABLE "Department" ADD COLUMN     "minStaffPerShift" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "ShiftType" ADD COLUMN     "isDayOff" BOOLEAN NOT NULL DEFAULT false;
