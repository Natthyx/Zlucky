import { NextRequest, NextResponse } from "next/server";
import { cleanupExpiredReservations } from "@/lib/reservations";

export async function POST(req: NextRequest) {
  try {
    // 2. Cleanup Logic
    const result = await cleanupExpiredReservations();

    // 3. Structured Response
    return NextResponse.json({
      success: true,
      message: "Cleanup process completed successfully",
      meta: {
        timestamp: new Date().toISOString(),
        ...result 
      }
    });

  } catch (error: any) {
    console.error("[Cleanup API] Failure:", error);
    
    // Distinguish between known logic errors vs unexpected crashes
    const status = error.message?.includes("index") ? 400 : 500;
    
    return NextResponse.json(
      { 
        success: false,
        error: "Internal cleanup failure", 
        details: process.env.NODE_ENV === "development" ? error.message : undefined 
      },
      { status }
    );
  }
}
