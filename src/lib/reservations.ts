import { adminDb } from "@/lib/firebase/admin";
import { Timestamp, FieldValue } from "firebase-admin/firestore";

export async function cleanupExpiredReservations() {
  try {
    const now = Timestamp.now();

    // Query expired reservations (Scanning based on time only to avoid composite index)
    const expiredTickets = await adminDb
      .collection("tickets")
      .where("reservationExpiresAt", "<=", now)
      .limit(50) 
      .get();
    
    // Note: detailed status check happens in the loop below to ensure safety

    if (expiredTickets.empty) {
      return { success: true, count: 0 };
    }

    const batch = adminDb.batch();
    const eventUpdates: Record<string, number> = {};
    let processedCount = 0;

    expiredTickets.docs.forEach((doc) => {
      const ticket = doc.data();
      
      // SAFETY CHECK: Only revert if actually reserved. 
      // This prevents issues if a sold ticket still has an expiration date.
      if (ticket.status !== "reserved") return;

      processedCount++;
      
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

    // Update event counters
    for (const [eventId, count] of Object.entries(eventUpdates)) {
      const eventRef = adminDb.collection("events").doc(eventId);
      batch.update(eventRef, {
        availableTickets: FieldValue.increment(count),
        reservedTickets: FieldValue.increment(-count),
        updatedAt: now,
      });
    }

    // Mark associated payments as expired (Scanning based on time only)
    const expiredPayments = await adminDb
      .collection("payments")
      .where("expiresAt", "<=", now)
      .limit(50)
      .get();

    expiredPayments.docs.forEach((doc) => {
      const payment = doc.data();
      
      // SAFETY CHECK: Only revert if actually pending
      if (payment.status !== "pending") return;

      batch.update(doc.ref, {
        status: "expired",
        updatedAt: now,
      });
    });

    await batch.commit();

    return { 
      success: true, 
      count: processedCount 
    };
  } catch (error) {
    console.error("Cleanup error:", error);
    throw error;
  }
}
