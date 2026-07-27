import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();
dotenv.config({ path: ".env.local" });

const r2Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT || "",
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
});

async function testR2() {
  const bucket = process.env.R2_BUCKET_RELEASES || "releases";
  const key = "test/test-upload.txt";
  const contentType = "text/plain";

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });

  const signOptions = {
    expiresIn: 3600,
    unhoistableHeaders: new Set(["x-amz-sdk-checksum-algorithm", "x-amz-checksum-crc32"]),
    signableHeaders: new Set(["host", "content-type"]),
  };

  const url = await getSignedUrl(r2Client, command, signOptions);
  console.log("Signed URL:", url);

  try {
    // Write dummy file
    fs.writeFileSync("dummy.txt", "hello world");
    const fileData = fs.readFileSync("dummy.txt");

    // Perform PUT request natively
    console.log("Sending PUT request natively from Node.js (bypasses CORS)...");
    const res = await fetch(url, {
      method: "PUT",
      body: fileData,
      headers: {
        "Content-Type": contentType,
      },
    });

    console.log("Status:", res.status);
    console.log("Status Text:", res.statusText);
    const text = await res.text();
    console.log("Response Body:", text);

    // Perform an OPTIONS request to test CORS
    console.log("\nTesting CORS (OPTIONS request)...");
    const optionsRes = await fetch(url, {
      method: "OPTIONS",
      headers: {
        "Origin": "https://www.breakoutmusic.online",
        "Access-Control-Request-Method": "PUT",
      },
    });
    
    console.log("OPTIONS Status:", optionsRes.status);
    console.log("OPTIONS Headers:");
    optionsRes.headers.forEach((v, k) => console.log(`  ${k}: ${v}`));
    const optionsBody = await optionsRes.text();
    console.log("OPTIONS Body:", optionsBody);

  } catch (error) {
    console.error("Fetch failed:", error);
  } finally {
    if (fs.existsSync("dummy.txt")) fs.unlinkSync("dummy.txt");
  }
}

testR2();
