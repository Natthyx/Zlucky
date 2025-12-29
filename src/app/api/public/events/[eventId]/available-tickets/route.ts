import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;

  try {
    const ticketsSnap = await adminDb
      .collection("tickets")
      .where("eventId", "==", eventId)
      .where("status", "==", "available")
      .get();

    const tickets = ticketsSnap.docs
      .map((doc) => ({
        id: doc.id,
        ticketNumber: doc.data().ticketNumber,
      }))
      .sort((a, b) => a.ticketNumber - b.ticketNumber);

    return NextResponse.json({ success: true, data: tickets });
  } catch (error: any) {
    console.error("Public fetch tickets error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
