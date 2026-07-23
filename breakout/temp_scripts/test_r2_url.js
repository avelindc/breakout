const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

async function run() {
  const r2Client = new S3Client({
    region: "auto",
    endpoint: "https://dummy.r2.cloudflarestorage.com",
    credentials: {
      accessKeyId: "dummykey",
      secretAccessKey: "dummysecret",
    },
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });

  const command = new PutObjectCommand({
    Bucket: "my-bucket",
    Key: "my-file.txt",
    ContentType: "text/plain"
  });

  const signOptions = {
    expiresIn: 3600,
    unhoistableHeaders: new Set(["x-amz-sdk-checksum-algorithm", "x-amz-checksum-crc32"]),
    signableHeaders: new Set(["host", "content-type"])
  };

  const url = await getSignedUrl(r2Client, command, signOptions);
  console.log("GENERATED URL:");
  console.log(url);
}

run().catch(console.error);
