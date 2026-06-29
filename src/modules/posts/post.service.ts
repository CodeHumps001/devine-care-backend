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
) => {
  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) throw new AppError("Post not found", 404);
  if (post.authorId !== authorId)
    throw new AppError("You can only edit your own posts", 403);

  return await prisma.post.update({
    where: { id },
    data: { title, content },
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
      title: true,
      content: true,
      coverImage: true,
    },
  });
  if (!data) {
    throw new AppError("Post not foun ", 404);
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

export { createPost, getPost, getPosts, deletePost, updatePost, publishPost };
