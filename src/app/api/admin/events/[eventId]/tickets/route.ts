import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase/admin";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const adminId = decodedToken.uid;

    // Verify ownership
    const eventSnap = await adminDb.collection("events").doc(eventId).get();
    if (!eventSnap.exists) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (eventSnap.data()?.adminId !== adminId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const ticketsSnap = await adminDb
      .collection("tickets")
      .where("eventId", "==", eventId)
      .get();

    const tickets = ticketsSnap.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .sort((a: any, b: any) => a.ticketNumber - b.ticketNumber);

    return NextResponse.json({ success: true, data: tickets });
  } catch (error: any) {
    console.error("Fetch tickets error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
