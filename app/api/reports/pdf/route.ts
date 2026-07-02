import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const BACKEND_URL =
  process.env.BACKEND_URL || "https://cmv-control-api.onrender.com";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const week = searchParams.get("week");
  if (!week) {
    return NextResponse.json({ error: "Missing ?week=YYYY-MM-DD" }, { status: 400 });
  }

  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const resp = await fetch(`${BACKEND_URL}/reports/pdf?week=${week}`, {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
    cache: "no-store",
  });

  if (!resp.ok) {
    const text = await resp.text();
    return NextResponse.json(
      { error: `Backend error ${resp.status}: ${text.slice(0, 400)}` },
      { status: resp.status }
    );
  }

  const buf = await resp.arrayBuffer();
  const filename = `CMV_SEMANA_${week.replace(/-/g, "")}.pdf`;
  return new NextResponse(buf, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
