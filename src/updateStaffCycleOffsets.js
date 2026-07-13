// scripts/updateStaffCycleOffsets.js
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// ─── Copy these from your shiftAlgorithm.ts ─────────────
const DEPARTMENT_CYCLES = {
  records: {
    cycle: [
      "F",
      "O",
      "F",
      "F",
      "F",
      "O",
      "F",
      "O",
      "N",
      "N",
      "N",
      "N",
      "N",
      "O",
      "O",
    ],
    cycleLength: 15,
    referenceDate: "2026-06-01",
  },
  // add more departments as you get their timetables
  // 'opd': { cycle: [...], cycleLength: X, referenceDate: '2026-06-01' }
};

const calculateDaysSinceReference = (referenceDate, year, month, day) => {
  const ref = new Date(referenceDate);
  const target = new Date(year, month - 1, day);
  return Math.floor((target.getTime() - ref.getTime()) / (1000 * 60 * 60 * 24));
};
// ──────────────────────────────────────────────────────────

async function updateAllStaffCycleOffsets() {
  console.log("🔄 Updating cycle offsets for all staff...");

  const users = await prisma.user.findMany({
    include: { department: true },
    orderBy: { createdAt: "asc" },
  });

  console.log(`📊 Found ${users.length} staff members to update`);

  let updated = 0;
  let skipped = 0;

  // Group users by department
  const deptGroups = {};
  users.forEach((user) => {
    if (user.department) {
      const key = user.departmentId;
      if (!deptGroups[key]) deptGroups[key] = [];
      deptGroups[key].push(user);
    }
  });

  // Process each department
  for (const [deptId, deptUsers] of Object.entries(deptGroups)) {
    const department = deptUsers[0].department;
    console.log(
      `\n📂 Department: ${department.name} (${deptUsers.length} staff)`,
    );

    let cycleLength = 7;
    let cycle = ["M", "M", "M", "M", "M", "O", "O"];
    let referenceDate = "2026-06-01";

    // Get department cycle if it exists
    const deptCycle = DEPARTMENT_CYCLES[department.name.toLowerCase()];
    if (deptCycle) {
      cycleLength = deptCycle.cycleLength;
      cycle = deptCycle.cycle;
      referenceDate = deptCycle.referenceDate;
      console.log(`   📋 Using department cycle (length: ${cycleLength})`);
    } else {
      console.log(`   📋 Using default cycle (length: ${cycleLength})`);
    }

    // Calculate offsets evenly distributed
    const staffCount = deptUsers.length;
    const spacing = cycleLength / staffCount;

    // Get existing offsets to avoid duplicates
    const usedOffsets = new Set();

    // Process each user in the department
    for (let index = 0; index < deptUsers.length; index++) {
      const user = deptUsers[index];

      // Calculate offset with even distribution
      let offset = Math.round(index * spacing) % cycleLength;

      // If offset is already used, find the next available
      let attempts = 0;
      while (usedOffsets.has(offset) && attempts < cycleLength) {
        offset = (offset + 1) % cycleLength;
        attempts++;
      }
      usedOffsets.add(offset);

      // Use their createdAt date as start date, or today if not available
      const startDate = user.createdAt
        ? user.createdAt.toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0];

      console.log(
        `   📌 ${user.firstName} ${user.lastName} → offset: ${offset} (${index + 1}/${staffCount})`,
      );

      try {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            cycleOffset: offset,
            personalCycle: JSON.stringify(cycle.map((s) => s.toString())),
            cycleStartDate: startDate,
          },
        });
        updated++;
      } catch (error) {
        console.error(
          `   ❌ Failed to update ${user.firstName} ${user.lastName}:`,
          error.message,
        );
      }
    }
  }

  console.log(`\n📊 Summary: ${updated} updated, ${skipped} skipped`);
}

updateAllStaffCycleOffsets()
  .catch((error) => {
    console.error("❌ Script failed:", error.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
