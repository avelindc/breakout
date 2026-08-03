import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // @ts-ignore
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Supabase credentials not configured" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const path = `cms/${uuidv4()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from("assets")
      .upload(path, buffer, {
        contentType: file.type || "image/jpeg",
        upsert: true,
      });

    if (uploadError) {
      console.error("Supabase CMS upload error:", uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const url = `${supabaseUrl}/storage/v1/object/public/assets/${path}`;
    console.log("CMS image uploaded:", url);
    return NextResponse.json({ success: true, url });
  } catch (err: any) {
    console.error("CMS upload API error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
