import prisma from "../../config/prisma";
import { AppError } from "../../middlewares/error.middleware";

const createPost = async (
  title: string,
  content: string,
  authorId: string,
  coverImage: string,
) => {
  const data = await prisma.post.create({
    data: {
      title,
      content,
      authorId,
      coverImage,
    },
  });

  return data;
};

const getPosts = async () => {
  const data = await prisma.post.findMany({
    where: { published: true }, // only published
    select: {
      id: true,
      title: true,
      content: true,
      coverImage: true,
      createdAt: true,
      author: {
        select: { firstName: true, lastName: true },
      },
    },
  });
  return data;
};

const updatePost = async (
  id: string,
  authorId: string,
  title: string,
  content: string,
  coverImage?: string, // Added support for cover images in edit updates
) => {
  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) throw new AppError("Post not found", 404);
  if (post.authorId !== authorId)
    throw new AppError("You can only edit your own posts", 403);

  // Generate payload dynamically to preserve old image if no new file is uploaded
  const updatePayload: Record<string, any> = { title, content };
  if (coverImage !== undefined) {
    updatePayload.coverImage = coverImage;
  }

  return await prisma.post.update({
    where: { id },
    data: updatePayload,
  });
};

const deletePost = async (id: string, authorId: string) => {
  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) throw new AppError("Post not found", 404);
  if (post.authorId !== authorId)
    throw new AppError("You can only delete your own posts", 403);

  return await prisma.post.delete({ where: { id } });
};

const getPost = async (id: string) => {
  const data = await prisma.post.findFirst({
    where: { id },
    select: {
      id: true,
      title: true,
      content: true,
      coverImage: true,
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
    throw new AppError("Post not found", 404);
  }
  return data;
};

const publishPost = async (id: string, authorId: string) => {
  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) throw new AppError("Post not found", 404);
  if (post.authorId !== authorId)
    throw new AppError("You can only publish your own posts", 403);

  return await prisma.post.update({
    where: { id },
    data: { published: !post.published }, // toggle — publish or unpublish
  });
};

const getAllPosts = async () => {
  const data = await prisma.post.findMany({
    select: {
      id: true,
      title: true,
      content: true,
      coverImage: true,
      published: true, // Crucial for displaying status
      createdAt: true,
      updatedAt: true, // Crucial for displaying update times
      authorId: true, // Crucial for the frontend permission check
      author: {
        select: { firstName: true, lastName: true },
      },
    },
    orderBy: {
      updatedAt: "desc", // Show recently modified posts first
    },
  });
  return data;
};

export {
  createPost,
  getPost,
  getPosts,
  deletePost,
  updatePost,
  publishPost,
  getAllPosts,
};
