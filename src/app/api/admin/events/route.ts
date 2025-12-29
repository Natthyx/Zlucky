import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase/admin";
import { generateAndUploadQR } from "@/lib/qr/generator";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

export async function POST(req: NextRequest) {
  try {
    // 1. Authentication Check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const adminId = decodedToken.uid;

    // 2. Parse and Validate Request
    const { name, description, ticketPrice, totalTickets } = await req.json();

    if (!name || !ticketPrice || !totalTickets) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (totalTickets > 500) {
      return NextResponse.json({ error: "Maximum 500 tickets allowed per event" }, { status: 400 });
    }

    // 3. Create Event Document (Initial)
    const eventRef = adminDb.collection("events").doc();
    const eventId = eventRef.id;
    const publicEventUrl = `${process.env.NEXT_PUBLIC_APP_URL}/event/${eventId}`;

    // 4. Generate QR Code
    const { qrCodeUrl, storagePath } = await generateAndUploadQR(eventId, publicEventUrl);

    // 5. Batch Create Tickets
    const batchSize = 100; // Firestore limit is 500, but we'll do batches for safety
    const totalBatches = Math.ceil(totalTickets / batchSize);

    for (let i = 0; i < totalBatches; i++) {
      const batch = adminDb.batch();
      const start = i * batchSize + 1;
      const end = Math.min((i + 1) * batchSize, totalTickets);

      for (let ticketNum = start; ticketNum <= end; ticketNum++) {
        const ticketRef = adminDb.collection("tickets").doc();
        batch.set(ticketRef, {
          eventId,
          ticketNumber: ticketNum,
          status: "available",
          isWinner: false,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
      }
      await batch.commit();
    }

    // 6. Finalize Event Document
    const eventData = {
      adminId,
      name,
      description: description || "",
      ticketPrice: Number(ticketPrice),
      totalTickets: Number(totalTickets),
      qrCodeUrl,
      qrCodeStoragePath: storagePath,
      publicEventUrl,
      status: "active",
      isWinnerGenerated: false,
      availableTickets: Number(totalTickets),
      reservedTickets: 0,
      soldTickets: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    await eventRef.set(eventData);

    return NextResponse.json({
      success: true,
      data: {
        eventId,
        qrCodeUrl,
        publicEventUrl,
        totalTickets,
      },
    });
  } catch (error: any) {
    console.error("Event creation error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const adminId = decodedToken.uid;

    const snapshot = await adminDb
      .collection("events")
      .where("adminId", "==", adminId)
      .get();

    const events = snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .sort((a: any, b: any) => {
        const dateA = a.createdAt?.seconds || 0;
        const dateB = b.createdAt?.seconds || 0;
        return dateB - dateA; // Descending
      });

    return NextResponse.json({ success: true, data: events });
  } catch (error: any) {
    console.error("Fetch events error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
