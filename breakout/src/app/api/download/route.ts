import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");
    const filename = searchParams.get("filename") || "download";

    if (!url) {
      return new NextResponse("Missing URL", { status: 400 });
    }

    // Fetch the file from the remote server
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch file: ${res.status} ${res.statusText}`);
    }

    // Pass the response body directly
    const body = res.body;
    const headers = new Headers(res.headers);
    headers.set("Content-Disposition", `attachment; filename="${filename}"`);

    // Remove headers that might interfere
    headers.delete("content-encoding");
    headers.delete("access-control-allow-origin");

    return new NextResponse(body, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    console.error("Proxy download error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
