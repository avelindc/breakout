"use server";

import { signIn } from "@/auth";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";

import { createClient } from "@supabase/supabase-js";

const prisma = new PrismaClient();

export async function loginAction(formData: FormData) {
  // ... (keep login logic as is)
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
  const whatsapp = formData.get("whatsapp") as string;
  const ktpFile = formData.get("ktp") as File | null;

  if (!name || !email || !password || !stageName || !whatsapp || !ktpFile || ktpFile.size === 0) {
    return { error: "All fields including KTP are required" };
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { error: "Email already in use" };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Upload KTP
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    let ktpUrl = null;

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const ext = ktpFile.name.split('.').pop();
      const path = `ktp-${Date.now()}.${ext}`;
      const buffer = Buffer.from(await ktpFile.arrayBuffer());
      
      const { error: uploadError, data } = await supabase.storage
        .from('identity-documents')
        .upload(path, buffer, {
          contentType: ktpFile.type,
          upsert: false
        });
        
      if (uploadError) {
        console.error("KTP Upload error:", uploadError);
        return { error: "Failed to upload KTP document. Please try again." };
      }
      
      // Store the path so we can generate signed URLs later
      ktpUrl = data?.path || path;
    } else {
      console.warn("Supabase credentials missing, skipping KTP upload");
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        whatsapp,
        ktpUrl,
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
