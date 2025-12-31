import { NextRequest, NextResponse } from "next/server";
import { cleanupExpiredReservations } from "@/lib/reservations";

export async function GET(req: NextRequest) {
  try {
    // 1. Security Check
    const authHeader = req.headers.get("Authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await cleanupExpiredReservations();

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("Cron expiration error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
