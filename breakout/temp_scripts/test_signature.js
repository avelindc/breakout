const crypto = require("crypto");

function getSignatureKey(key, dateStamp, regionName, serviceName) {
  const kDate = crypto.createHmac("sha256", "AWS4" + key).update(dateStamp).digest();
  const kRegion = crypto.createHmac("sha256", kDate).update(regionName).digest();
  const kService = crypto.createHmac("sha256", kRegion).update(serviceName).digest();
  const kSigning = crypto.createHmac("sha256", kService).update("aws4_request").digest();
  return kSigning;
}

const secretKey = "e51198681abe255eb1ba04c9bf5f2a59f4508505e09f85ebeee39ca731dd61ac";
const dateStamp = "20260723";
const regionName = "auto";
const serviceName = "s3";

const stringToSign = `AWS4-HMAC-SHA256
20260723T140008Z
20260723/auto/s3/aws4_request
ac4958cc2257621a4d1ac94934e322bc435b3c03133e857956c6abe6fc3ab29e`;

const signingKey = getSignatureKey(secretKey, dateStamp, regionName, serviceName);
const signature = crypto.createHmac("sha256", signingKey).update(stringToSign).digest("hex");

console.log("Calculated Signature: " + signature);
console.log("Vercel Signature:     2af1b62c0280a020988f76dca258b6f3863dc30215ed8ec56e686fc228fc6152");
