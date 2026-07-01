import prisma from "../../config/prisma";
import { AppError } from "../../middlewares/error.middleware";

const createAnnouncement = async (
  title: string,
  content: string,
  authorId: string,
  departmentId?: string,
) => {
  const createAn = await prisma.announcement.create({
    data: {
      title,
      content,
      authorId,
      departmentId,
    },
  });

  return createAn;
};
const getAnnouncements = async () => {
  const data = await prisma.announcement.findMany({
    select: {
      id: true,
      title: true,
      content: true,
      departmentId: true,
      createdAt: true,
      author: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });
  return data;
};
const updateAnnouncement = async (
  id: string,
  title: string,
  content: string,
) => {
  const announcement = await prisma.announcement.findUnique({ where: { id } });
  if (!announcement) throw new AppError("Announcement not found", 404);

  return await prisma.announcement.update({
    where: { id },
    data: { title, content },
  });
};

const deleteAnnouncement = async (id: string) => {
  const announcement = await prisma.announcement.findUnique({ where: { id } });
  if (!announcement) throw new AppError("Announcement not found", 404);

  return await prisma.announcement.delete({ where: { id } });
};
const getAnnouncement = async (id: string) => {
  const data = await prisma.announcement.findFirst({
    where: { id },
    select: {
      id: true,
      title: true,
      content: true,
      departmentId: true,
      createdAt: true,
      author: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  if (!data) {
    throw new AppError("Announcement is not available", 404);
  }

  return data;
};

export {
  createAnnouncement,
  getAnnouncement,
  getAnnouncements,
  deleteAnnouncement,
  updateAnnouncement,
};
