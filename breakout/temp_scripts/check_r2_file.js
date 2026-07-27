const { S3Client, HeadObjectCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();
require('dotenv').config({ path: '.env.local' });

const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

async function check() {
  const key = 'covers/cmrs2zqjl0001ddt6n4otq6jq-1784482946039.png';
  try {
    const cmd = new HeadObjectCommand({ Bucket: 'releases', Key: key });
    await r2Client.send(cmd);
    console.log("File EXISTS in R2 bucket 'releases':", key);
  } catch (err) {
    console.log("File DOES NOT exist in R2 bucket 'releases':", err.message);
  }
}
check();
