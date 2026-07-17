"use server";

import { signIn } from "@/auth";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";

const prisma = new PrismaClient();

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Please provide both email and password" };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid credentials." };
        default:
          return { error: "Something went wrong during authentication." };
      }
    }
    
    // Check if it's a NEXT_REDIRECT error
    if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
      throw error;
    }
    
    console.error("Login error:", error);
    return { error: "Internal server error. Please try again later." };
  }
}

export async function registerAction(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const stageName = formData.get("stageName") as string;

  if (!name || !email || !password || !stageName) {
    return { error: "All fields are required" };
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { error: "Email already in use" };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "USER",
        status: "PENDING",
        artists: {
          create: {
            stageName,
          },
        },
      },
    });

    // Notify admins
    const superAdmins = await prisma.user.findMany({
      where: { role: "ADMIN" }
    });
    
    if (superAdmins.length > 0) {
      const notifications = superAdmins.map(admin => ({
        userId: admin.id,
        title: "New Artist Registration",
        message: `Artist ${stageName} (${name}) has registered and is pending approval.`,
      }));
      await prisma.notification.createMany({
        data: notifications
      });
    }

    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Failed to register user. Please try again." };
  }
}
