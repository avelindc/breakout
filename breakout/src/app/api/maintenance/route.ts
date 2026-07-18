import { NextResponse } from "next/server";
import { isMaintenanceActive } from "@/lib/maintenance";

export const dynamic = "force-dynamic";

export async function GET() {
  const active = await isMaintenanceActive();
  return NextResponse.json({ active });
}
