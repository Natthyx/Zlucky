import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;

  try {
    const eventSnap = await adminDb.collection("events").doc(eventId).get();

    if (!eventSnap.exists) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const eventData = eventSnap.data();

    // Create a public version of the event data (omit adminId if sensitive)
    const publicData = {
      id: eventSnap.id,
      name: eventData?.name,
      description: eventData?.description,
      ticketPrice: eventData?.ticketPrice,
      totalTickets: eventData?.totalTickets,
      availableTickets: eventData?.availableTickets,
      soldTickets: eventData?.soldTickets,
      status: eventData?.status,
      isWinnerGenerated: eventData?.isWinnerGenerated,
      createdAt: eventData?.createdAt,
    };

    return NextResponse.json({ success: true, data: publicData });
  } catch (error: any) {
    console.error("Public fetch event error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
