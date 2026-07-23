"use server";

import { signIn } from "@/auth";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { sendOtpEmail, sendContractToAdminEmail } from "@/lib/email";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { r2Client, BUCKET_ASSETS, R2_PUBLIC_URL_ASSETS } from "@/lib/r2";

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
  const youtubeUrl = formData.get("youtubeUrl") as string;
  const stageName = name; // Use Full Name as default Stage Name

  if (!name || !email || !password || !whatsapp || !youtubeUrl) {
    return { error: "Semua field wajib diisi" };
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { error: "Email already in use" };
    }

    // Lower cost factor (8 instead of 10) for faster hashing on serverless
    const hashedPassword = await bcrypt.hash(password, 8);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        whatsapp,
        youtubeUrl,
        role: "USER",
        status: "PENDING",
      },
    });

    // Fire admin notifications in background - don't await (non-blocking)
    prisma.user.findMany({ where: { role: "ADMIN" } }).then(admins => {
      if (admins.length > 0) {
        prisma.notification.createMany({
          data: admins.map(admin => ({
            userId: admin.id,
            title: "New Artist Registration",
            message: `Artist ${stageName} (${name}) has registered and is pending approval.`,
          }))
        }).catch(console.error);
      }
    }).catch(console.error);

    return { success: true, userId: user.id };
  } catch (error) {
    console.error(error);
    return { error: "Failed to register user. Please try again." };
  }
}

export async function getContractUploadUrlsAction(userId: string) {
  try {
    const timestamp = Date.now();
    // Putting contracts into assets bucket since there is no specific contracts bucket
    const signaturePath = `contracts/signatures/${userId}-${timestamp}.png`;
    const pdfPath = `contracts/files/${userId}-${timestamp}.jpg`;
    
    const sigCommand = new PutObjectCommand({
      Bucket: BUCKET_ASSETS,
      Key: signaturePath,
      ContentType: "image/png"
    });
    const sigUrl = await getSignedUrl(r2Client, sigCommand, { expiresIn: 3600 });
    
    const pdfCommand = new PutObjectCommand({
      Bucket: BUCKET_ASSETS,
      Key: pdfPath,
      ContentType: "image/jpeg"
    });
    const pdfUrl = await getSignedUrl(r2Client, pdfCommand, { expiresIn: 3600 });

    return { 
      success: true, 
      signature: { url: sigUrl, path: signaturePath, token: "" },
      pdf: { url: pdfUrl, path: pdfPath, token: "" }
    };
  } catch (error) {
    console.error("getContractUploadUrls error:", error);
    return { error: "Gagal menyiapkan penyimpanan di R2. Silakan coba lagi." };
  }
}

export async function finalizeContractAction(userId: string, signaturePath: string, pdfPath: string) {
  try {
    const r2Domain = R2_PUBLIC_URL_ASSETS || "https://r2-assets.breakoutmusic.online";
    const finalSigUrl = signaturePath.startsWith("http") || signaturePath === "agreed-digitally" ? signaturePath : `${r2Domain}/${signaturePath}`;
    const finalPdfUrl = pdfPath.startsWith("http") || pdfPath === "sent-via-email" ? pdfPath : `${r2Domain}/${pdfPath}`;

    await prisma.contract.create({
      data: {
        userId,
        version: "1.0",
        pdfUrl: finalPdfUrl,
        signatureUrl: finalSigUrl
      }
    });
    return { success: true };
  } catch (error) {
    console.error("finalizeContractAction error:", error);
    return { error: "Gagal menyimpan kontrak ke database." };
  }
}

export async function processContractByEmailAction(data: {userId: string; name: string; nik: string; address: string; email: string; whatsapp: string;}) {
  try {
    const emailRes = await sendContractToAdminEmail(data);
    if (emailRes.error) {
      return { error: "Gagal mengirim kontrak ke admin." };
    }
    
    // Save to DB to maintain flow
    await finalizeContractAction(data.userId, "agreed-digitally", "sent-via-email");
    return { success: true };
  } catch (error) {
    console.error("processContractByEmailAction error:", error);
    return { error: "Gagal memproses kontrak." };
  }
}
