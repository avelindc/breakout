const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

async function run() {
  const r2Client = new S3Client({
    region: "auto",
    endpoint: "https://c1aaf27f910711776d0d2b338cc1ce46.r2.cloudflarestorage.com",
    forcePathStyle: true,
    credentials: {
      accessKeyId: "3384292b6cb558565fc12f01f8faf8c8",
      secretAccessKey: "e51198681abe255eb1ba04c9bf5f2a59f4508505e09f85ebeee39ca731dd61ac",
    },
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });

  const command = new PutObjectCommand({
    Bucket: "releases",
    Key: `test/test-${Date.now()}.txt`,
    ContentType: "text/plain"
  });

  const signOptions = {
    expiresIn: 3600,
    unhoistableHeaders: new Set(["x-amz-sdk-checksum-algorithm", "x-amz-checksum-crc32"]),
    signableHeaders: new Set(["host", "content-type"])
  };

  const signedUrl = await getSignedUrl(r2Client, command, signOptions);
  console.log("URL:", signedUrl);

  const res = await fetch(signedUrl, {
    method: "PUT",
    body: "Hello world",
    headers: {
      "Content-Type": "text/plain"
    }
  });

  console.log("Status:", res.status);
  const text = await res.text();
  console.log("Body:", text);
}

run().catch(console.error);
