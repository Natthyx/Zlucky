import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { Timestamp, FieldValue } from "firebase-admin/firestore";

export async function GET(req: NextRequest) {
  try {
    // 1. Security Check
    const authHeader = req.headers.get("Authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = Timestamp.now();

    // 2. Query expired reservations
    const expiredTickets = await adminDb
      .collection("tickets")
      .where("status", "==", "reserved")
      .where("reservationExpiresAt", "<=", now)
      .limit(100)
      .get();

    if (expiredTickets.empty) {
      return NextResponse.json({ success: true, message: "No expired reservations found" });
    }

    const batch = adminDb.batch();
    const eventUpdates: Record<string, number> = {};

    expiredTickets.docs.forEach((doc) => {
      const ticket = doc.data();
      
      // Revert ticket to available
      batch.update(doc.ref, {
        status: "available",
        buyerName: null,
        buyerPhone: null,
        buyerEmail: null,
        reservedAt: null,
        reservationExpiresAt: null,
        paymentId: null,
        updatedAt: now,
      });

      // Track event updates for counters
      eventUpdates[ticket.eventId] = (eventUpdates[ticket.eventId] || 0) + 1;
    });

    // 3. Update event counters
    for (const [eventId, count] of Object.entries(eventUpdates)) {
      const eventRef = adminDb.collection("events").doc(eventId);
      batch.update(eventRef, {
        availableTickets: FieldValue.increment(count),
        reservedTickets: FieldValue.increment(-count),
        updatedAt: now,
      });
    }

    // 4. Mark associated payments as expired
    const expiredPayments = await adminDb
      .collection("payments")
      .where("status", "==", "pending")
      .where("expiresAt", "<=", now)
      .limit(100)
      .get();

    expiredPayments.docs.forEach((doc) => {
      batch.update(doc.ref, {
        status: "expired",
        updatedAt: now,
      });
    });

    await batch.commit();

    return NextResponse.json({
      success: true,
      data: {
        expiredTickets: expiredTickets.size,
        expiredPayments: expiredPayments.size,
      },
    });
  } catch (error: any) {
    console.error("Cron expiration error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
