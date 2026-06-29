-- AlterTable
ALTER TABLE "Department" ADD COLUMN     "cycleLength" INTEGER,
ADD COLUMN     "cyclePattern" TEXT,
ADD COLUMN     "referenceDate" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "cycleStartDate" TEXT,
ADD COLUMN     "personalCycle" TEXT;
