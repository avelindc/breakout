"use server";

import { signIn } from "@/auth";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { sendOtpEmail } from "@/lib/email";

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

export async function sendOtpAction(email: string) {
  if (!email) return { error: "Email is required" };

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return { error: "Email already in use" };

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
    const hashedOtp = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Check rate limit (resendCount) within last 30 minutes
    const recentToken = await prisma.verificationToken.findFirst({
      where: { 
        email, 
        createdAt: { gte: new Date(Date.now() - 30 * 60 * 1000) } 
      },
      orderBy: { createdAt: 'desc' }
    });

    if (recentToken && recentToken.resendCount >= 3) {
      return { error: "Terlalu banyak permintaan. Silakan coba lagi setelah 30 menit." };
    }

    const resendCount = recentToken ? recentToken.resendCount + 1 : 0;

    await prisma.verificationToken.create({
      data: {
        email,
        otp: hashedOtp,
        expiresAt,
        resendCount
      }
    });

    const emailRes = await sendOtpEmail(email, otp);
    if (!emailRes.success) {
      return { error: "Gagal mengirim email OTP" };
    }

    return { success: true };
  } catch (error) {
    console.error("sendOtpAction error:", error);
    return { error: "Gagal mengirim OTP" };
  }
}

export async function registerAction(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const whatsapp = formData.get("whatsapp") as string;
  const ktpFile = formData.get("ktp") as File | null;
  const otp = formData.get("otp") as string;
  const youtubeUrl = formData.get("youtubeUrl") as string;
  const nik = formData.get("nik") as string;
  const address = formData.get("address") as string;
  const stageName = name; // Use Full Name as default Stage Name

  if (!name || !email || !password || !whatsapp || !ktpFile || ktpFile.size === 0 || !otp || !youtubeUrl || !nik || !address) {
    return { error: "All fields including KTP, NIK, Address, OTP, and YouTube URL are required" };
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { error: "Email already in use" };
    }

    // Verify OTP
    const tokenRecord = await prisma.verificationToken.findFirst({
      where: { email },
      orderBy: { createdAt: 'desc' }
    });

    if (!tokenRecord) {
      return { error: "Silakan minta kode OTP terlebih dahulu." };
    }

    if (tokenRecord.attempts >= 5) {
      return { error: "Terlalu banyak percobaan yang salah. Silakan minta OTP baru." };
    }

    if (tokenRecord.expiresAt < new Date()) {
      return { error: "Kode OTP telah kedaluwarsa. Silakan kirim ulang OTP." };
    }

    const isValidOtp = await bcrypt.compare(otp, tokenRecord.otp);
    if (!isValidOtp) {
      await prisma.verificationToken.update({
        where: { id: tokenRecord.id },
        data: { attempts: tokenRecord.attempts + 1 }
      });
      return { error: "Kode OTP salah." };
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
        youtubeUrl,
        ktpUrl,
        nik,
        address,
        role: "USER",
        status: "PENDING",
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

    return { success: true, userId: user.id };
  } catch (error) {
    console.error(error);
    return { error: "Failed to register user. Please try again." };
  }
}

export async function getContractUploadUrlsAction(userId: string) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    
    if (!supabaseUrl || !supabaseKey) {
      return { error: "Supabase credentials missing" };
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    const timestamp = Date.now();
    const signaturePath = `signatures/${userId}-${timestamp}.png`;
    const pdfPath = `pdfs/${userId}-${timestamp}.pdf`;
    
    const { data: sigData, error: sigError } = await supabase.storage
      .from('contracts')
      .createSignedUploadUrl(signaturePath);
      
    if (sigError || !sigData) return { error: "Failed to generate signature upload URL" };

    const { data: pdfData, error: pdfError } = await supabase.storage
      .from('contracts')
      .createSignedUploadUrl(pdfPath);
      
    if (pdfError || !pdfData) return { error: "Failed to generate PDF upload URL" };

    return { 
      success: true, 
      signature: { url: sigData.signedUrl, path: signaturePath, token: sigData.token },
      pdf: { url: pdfData.signedUrl, path: pdfPath, token: pdfData.token }
    };
  } catch (error) {
    console.error("getUploadUrls error:", error);
    return { error: "Gagal menyiapkan penyimpanan. Silakan coba lagi." };
  }
}

export async function finalizeContractAction(userId: string, signaturePath: string, pdfPath: string) {
  try {
    await prisma.contract.create({
      data: {
        userId,
        version: "1.0",
        pdfUrl: pdfPath,
        signatureUrl: signaturePath
      }
    });
    return { success: true };
  } catch (error) {
    console.error("finalizeContractAction error:", error);
    return { error: "Gagal menyimpan kontrak ke database." };
  }
}
