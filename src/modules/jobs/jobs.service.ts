import prisma from "../../config/prisma";
import { AppError } from "../../middlewares/error.middleware";
import { ApplicationStatus, JobType } from "@prisma/client";
import { queueJobApplicationNotification } from "./notification.jobs";

export const postJob = async (
  title: string,
  department: string,
  type: JobType,
  description: string,
) => {
  return await prisma.jobListing.create({
    data: { title, department, type, description },
  });
};

export const getJobs = async () => {
  return await prisma.jobListing.findMany({
    where: { isOpen: true },
    orderBy: { createdAt: "desc" },
  });
};

export const updateJobListings = async (
  id: string,
  data: {
    title?: string;
    department?: string;
    type?: JobType;
    description?: string;
    isOpen?: boolean;
  },
) => {
  const job = await prisma.jobListing.findUnique({ where: { id } });
  if (!job) throw new AppError("Job listing not found", 404);

  return await prisma.jobListing.update({ where: { id }, data });
};

export const deleteJobs = async (id: string) => {
  const job = await prisma.jobListing.findUnique({ where: { id } });
  if (!job) throw new AppError("Job listing not found", 404);

  return await prisma.jobListing.delete({ where: { id } });
};

export const postApplications = async (
  jobListingId: string,
  name: string,
  email: string,
  phone: string,
  cvUrl: string,
  coverLetter?: string,
) => {
  const job = await prisma.jobListing.findUnique({
    where: { id: jobListingId },
  });
  if (!job) throw new AppError("Job listing not found", 404);
  if (!job.isOpen) {
    throw new AppError(
      "This position is no longer accepting applications",
      400,
    );
  }

  const existing = await prisma.jobApplication.findFirst({
    where: { jobListingId, email },
  });
  if (existing) {
    throw new AppError("You have already applied for this position", 400);
  }

  return await prisma.jobApplication.create({
    data: { jobListingId, name, email, phone, cvUrl, coverLetter },
  });
};

export const getApplications = async () => {
  return await prisma.jobApplication.findMany({
    include: {
      jobListing: {
        select: { title: true, department: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};

export const updateApplicationStatus = async (
  id: string,
  status: ApplicationStatus,
) => {
  // step 1 — find application with job listing details
  const application = await prisma.jobApplication.findUnique({
    where: { id },
    include: {
      jobListing: {
        select: { title: true },
      },
    },
  });

  if (!application) throw new AppError("Application not found", 404);

  // step 2 — update the status
  const updated = await prisma.jobApplication.update({
    where: { id },
    data: { status },
  });

  // step 3 — notify only on meaningful status changes
  if (status === "SHORTLISTED" || status === "REJECTED") {
    await queueJobApplicationNotification({
      name: application.name,
      phone: application.phone,
      email: application.email,
      jobTitle: application.jobListing.title,
      status,
    });
  }

  return updated;
};
