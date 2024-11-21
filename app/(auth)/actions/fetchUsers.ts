"use server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";

export const fetchUsers = async () => {
  try {
    // Mendapatkan data user dari Clerk
    const clerkUser = await currentUser();
    if (!clerkUser) {
      throw new Error("User tidak ditemukan di Clerk.");
    }

    // Cari user di PostgreSQL berdasarkan clerkUserId
    let postgresUser = await prisma.user.findUnique({
      where: {
        clerkUserId: clerkUser.id,
      },
    });

    // Jika user belum ada, buat user baru di database
    if (!postgresUser) {
      let username =
        clerkUser.username || `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim();
      if (!username) {
        throw new Error("Username tidak dapat diambil dari Clerk.");
      }

      const newUser = {
        clerkUserId: clerkUser.id,
        username,
        email: clerkUser.emailAddresses?.[0]?.emailAddress || "",
        profilePic: clerkUser.imageUrl || "",
      };

      // Validasi jika ada data penting yang kosong
      if (!newUser.email) {
        throw new Error("Email tidak ditemukan untuk user Clerk.");
      }

      postgresUser = await prisma.user.create({
        data: newUser,
      });
    }

    // Ambil hasil quiz untuk user tersebut
    const quizResults = await prisma.quizResult.findMany({
      where: {
        userId: postgresUser.id,
      },
    });

    // Kembalikan data user dan hasil quiz
    return {
      data: {
        user: postgresUser,
        quizResults,
      },
    };
  } catch (error) {
    console.error("Terjadi kesalahan:");
  }
};
