/**
 * Setup CORS on Cloudflare R2 Bucket
 * Run: node setup-r2-cors.js
 */

const { S3Client, PutBucketCorsCommand, GetBucketCorsCommand } = require("@aws-sdk/client-s3");
require("dotenv").config({ path: ".env" });

const r2Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const CORS_CONFIG = {
  CORSRules: [
    {
      AllowedOrigins: [
        "http://localhost:3000",
        "https://www.breakoutmusic.online",
        "https://breakoutmusic.online"
      ],
      AllowedMethods: ["GET", "PUT", "POST", "DELETE", "HEAD"],
      AllowedHeaders: ["*"],
      ExposeHeaders: ["ETag", "Content-Length"],
      MaxAgeSeconds: 3600
    }
  ]
};

async function setupCORS() {
  const buckets = [
    process.env.R2_BUCKET_RELEASES,
    process.env.R2_BUCKET_PROFILES,
    process.env.R2_BUCKET_ASSETS
  ];

  console.log("🚀 Setting up CORS for R2 buckets...\n");
  console.log("Endpoint:", process.env.R2_ENDPOINT);
  console.log("Access Key:", process.env.R2_ACCESS_KEY_ID?.substring(0, 10) + "...");
  console.log("\nBuckets:", buckets.join(", "));
  console.log("\nAllowed Origins:");
  CORS_CONFIG.CORSRules[0].AllowedOrigins.forEach(origin => console.log("  -", origin));
  console.log("\n" + "=".repeat(60) + "\n");

  for (const bucket of buckets) {
    try {
      console.log(`📦 Configuring bucket: ${bucket}`);
      
      // Set CORS
      const putCommand = new PutBucketCorsCommand({
        Bucket: bucket,
        CORSConfiguration: CORS_CONFIG
      });
      
      await r2Client.send(putCommand);
      console.log(`✅ CORS configured successfully for ${bucket}`);
      
      // Verify CORS
      const getCommand = new GetBucketCorsCommand({ Bucket: bucket });
      const result = await r2Client.send(getCommand);
      console.log(`✓ Verified: ${result.CORSRules?.length} CORS rule(s) active`);
      console.log();
      
    } catch (error) {
      console.error(`❌ Error configuring ${bucket}:`, error.message);
      if (error.Code) console.error("   Error code:", error.Code);
      console.log();
    }
  }
  
  console.log("=".repeat(60));
  console.log("✨ CORS setup complete!");
  console.log("\nNext steps:");
  console.log("1. Wait 1-2 minutes for CORS to propagate");
  console.log("2. Restart your Next.js dev server");
  console.log("3. Hard refresh browser (Ctrl+Shift+R)");
  console.log("4. Try uploading again");
}

setupCORS().catch(error => {
  console.error("\n❌ Fatal error:", error);
  process.exit(1);
});
