import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase/admin";
import { Timestamp } from "firebase-admin/firestore";

// GET /api/admin/events/[eventId]
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

    const eventSnapshot = await adminDb.collection("events").doc(eventId).get();

    if (!eventSnapshot.exists) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const eventData = eventSnapshot.data();
    if (eventData?.adminId !== adminId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ 
      success: true, 
      data: { id: eventSnapshot.id, ...eventData } 
    });
  } catch (error: any) {
    console.error("Fetch event error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/admin/events/[eventId]
export async function DELETE(
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

    const eventRef = adminDb.collection("events").doc(eventId);
    const eventSnap = await eventRef.get();

    if (!eventSnap.exists) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (eventSnap.data()?.adminId !== adminId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete tickets associated with this event
    const ticketsQuery = adminDb.collection("tickets").where("eventId", "==", eventId);
    const ticketsSnap = await ticketsQuery.get();
    
    // Batch delete tickets (limit to 500 for safety in small projects, but let's do simple loop for now)
    const batch = adminDb.batch();
    ticketsSnap.docs.forEach((doc) => batch.delete(doc.ref));
    
    // Delete event
    batch.delete(eventRef);
    
    await batch.commit();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete event error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/admin/events/[eventId] (for status update)
export async function PATCH(
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

    const { status } = await req.json();
    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 });
    }

    const eventRef = adminDb.collection("events").doc(eventId);
    const eventSnap = await eventRef.get();

    if (!eventSnap.exists) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (eventSnap.data()?.adminId !== adminId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await eventRef.update({
      status,
      updatedAt: Timestamp.now(),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Update event status error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
