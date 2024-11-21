"use server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";

export const fetchUsers = async () => {
  try {
    const clerkUser = await currentUser();

    // Jika tidak ada pengguna yang login, kembalikan null atau error yang sesuai
    if (!clerkUser) {
      return {
        error: "No user is currently logged in",
        data: null,
      };
    }

    let mongoUser = null;
    mongoUser = await prisma.user.findUnique({
      where: {
        clerkUserId: clerkUser.id,
      },
    });

    if (!mongoUser) {
      let username = clerkUser.username;
      if (!username) {
        username = `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim();
      }

      const newUser = {
        clerkUserId: clerkUser.id,
        username,
        email: clerkUser.emailAddresses[0]?.emailAddress || "",
        profilePic: clerkUser.imageUrl || "",
      };

      mongoUser = await prisma.user.create({
        data: newUser,
      });
    }

    const quizResults = await prisma.quizResult.findMany({
      where: {
        userId: mongoUser.id,
      },
    });

    return {
      data: {
        user: mongoUser,
        quizResults,
      },
      error: null,
    };
  } catch (error) {
    // Tangani error dengan lebih baik
    console.error("Error in fetchUsers:", error);
    return {
      error: error instanceof Error ? error.message : "An unknown error occurred",
      data: null,
    };
  }
};
