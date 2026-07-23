import { NextResponse } from "next/server";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { r2Client, BUCKET_RELEASES } from "@/lib/r2";

export async function GET(request: Request) {
  try {
    const endpoint = process.env.R2_ENDPOINT || "undefined";
    const maskedEndpoint = endpoint.substring(0, 15) + "..." + endpoint.substring(endpoint.length - 20);
    
    // 1. Generate Presigned URL
    const testKey = `test/test-${Date.now()}.txt`;
    const command = new PutObjectCommand({
      Bucket: BUCKET_RELEASES,
      Key: testKey,
      ContentType: "text/plain"
    });
    
    const signedUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 });
    
    // 2. Test upload directly from Server using fetch
    const uploadRes = await fetch(signedUrl, {
      method: "PUT",
      body: "Hello from R2 Test!",
      headers: {
        "Content-Type": "text/plain"
      }
    });
    
    let uploadResponseText = "";
    try {
      uploadResponseText = await uploadRes.text();
    } catch (e) {
      uploadResponseText = "Failed to parse response text";
    }

    return NextResponse.json({
      success: uploadRes.ok,
      maskedEndpoint,
      bucket: BUCKET_RELEASES,
      presignedUrl: signedUrl.substring(0, 50) + "...",
      uploadStatus: uploadRes.status,
      uploadStatusText: uploadRes.statusText,
      uploadResponseText
    });
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
}
