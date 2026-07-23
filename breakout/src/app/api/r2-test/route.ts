import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2Client, BUCKET_RELEASES } from "@/lib/r2";

export async function GET() {
  try {
    const testKey = `test/test-${Date.now()}.txt`;
    const command = new PutObjectCommand({
      Bucket: BUCKET_RELEASES,
      Key: testKey,
      ContentType: "text/plain"
    });
    
    const signOptions = {
      expiresIn: 3600,
      unhoistableHeaders: new Set(["x-amz-sdk-checksum-algorithm", "x-amz-checksum-crc32"]),
      signableHeaders: new Set(["host", "content-type"])
    };
    const signedUrl = await getSignedUrl(r2Client, command, signOptions);
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>R2 Client Test</title>
      </head>
      <body style="font-family: sans-serif; padding: 20px;">
        <h2>Client-Side Upload Test</h2>
        <button id="btn" style="padding: 15px; font-size: 16px; background: #9333ea; color: white; border: none; border-radius: 8px;">Run Test</button>
        <pre id="log" style="background: #f4f4f4; padding: 10px; margin-top: 20px; white-space: pre-wrap; word-wrap: break-word;"></pre>
        <script>
          document.getElementById("btn").onclick = async () => {
            const log = document.getElementById("log");
            log.innerText = "Starting...\\n";
            try {
              const url = "${signedUrl}";
              log.innerText += "Sending PUT request to R2...\\n";
              
              const res = await fetch(url, {
                method: "PUT",
                body: "Hello from Phone Browser!",
                headers: {
                  "Content-Type": "text/plain"
                }
              });
              
              log.innerText += "Status: " + res.status + "\\n";
              const text = await res.text();
              log.innerText += "Response: " + text + "\\n";
              
              if (res.ok) {
                log.innerText += "✅ SUCCESS!";
              } else {
                log.innerText += "❌ SERVER REJECTED IT";
              }
            } catch (err) {
              log.innerText += "❌ NETWORK ERROR: " + err.message + "\\n" + err.stack;
            }
          };
        </script>
      </body>
      </html>
    `;
    return new NextResponse(html, { headers: { "Content-Type": "text/html" } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message });
  }
}
