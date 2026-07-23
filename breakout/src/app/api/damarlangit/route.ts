import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const start = searchParams.get("start") || "0";
  const length = searchParams.get("length") || "24";
  const searchValue = searchParams.get("search") || "";

  const params = new URLSearchParams();
  params.append("draw", "1");
  params.append("start", start);
  params.append("length", length);
  
  if (searchValue) {
    params.append("search[value]", searchValue);
  }
  
  params.append("columns[0][data]", "index");
  params.append("columns[0][searchable]", "true");
  params.append("columns[1][data]", "judul_lagu");
  params.append("columns[1][searchable]", "true");
  params.append("columns[2][data]", "performer");
  params.append("columns[2][searchable]", "true");
  params.append("columns[3][data]", "composer");
  params.append("columns[3][searchable]", "true");

  try {
    const res = await fetch(`https://damarlangit.co.id/getKatalog?${params.toString()}`, {
      headers: {
        "Accept": "application/json",
        "X-Requested-With": "XMLHttpRequest"
      }
    });
    
    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch" }, { status: res.status });
    }
    
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
