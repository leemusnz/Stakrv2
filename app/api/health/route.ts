import { NextResponse } from "next/server";
import { createDbConnection } from "@/lib/db";
import { healthReport } from "@/lib/health";

// Never cache: this is read by uptime monitors and by whoever is checking a deploy.
export const dynamic = "force-dynamic";

export async function GET() {
  const report = await healthReport(createDbConnection());
  return NextResponse.json(report, {
    status: report.status === "down" ? 503 : 200,
    headers: { "Cache-Control": "no-store" },
  });
}
