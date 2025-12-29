import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyChapaSignature } from "@/lib/chapa/webhook";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-chapa-signature") || "";
    const secretKey = process.env.CHAPA_WEBHOOK_SECRET || process.env.CHAPA_SECRET_KEY!;

    // 1. Verify Signature
    if (!verifyChapaSignature(rawBody, signature, secretKey)) {
      console.error("Invalid Chapa webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const { tx_ref, status, trx_id } = payload;

    if (status !== "success") {
      // Handle failure case if needed, but usually we just wait for expiration
      // unless Chapa sends an explicit 'failed' event
      return NextResponse.json({ success: true, message: "Ignored non-success event" });
    }

    // 2. Atomic Update for Payment and Ticket
    await adminDb.runTransaction(async (transaction) => {
      const paymentRef = adminDb.collection("payments").doc(tx_ref);
      const paymentSnap = await transaction.get(paymentRef);

      if (!paymentSnap.exists) {
        console.error(`Payment not found: ${tx_ref}`);
        return; // Idempotent success or log error
      }

      const paymentData = paymentSnap.data();
      if (paymentData?.status === "completed") {
        return; // Already processed
      }

      const eventId = paymentData?.eventId;
      const now = Timestamp.now();

      // Update Payment
      transaction.update(paymentRef, {
        status: "completed",
        chapaTransactionId: trx_id,
        webhookReceived: true,
        webhookData: payload,
        verifiedAt: now,
        completedAt: now,
        updatedAt: now,
      });

      // Find and Update Ticket
      const ticketQuery = adminDb
        .collection("tickets")
        .where("paymentId", "==", tx_ref)
        .limit(1);

      const ticketSnap = await transaction.get(ticketQuery);
      if (!ticketSnap.empty) {
        const ticketRef = ticketSnap.docs[0].ref;
        transaction.update(ticketRef, {
          status: "sold",
          soldAt: now,
          updatedAt: now,
        });

        // Update Event Counters
        const eventRef = adminDb.collection("events").doc(eventId);
        transaction.update(eventRef, {
          reservedTickets: FieldValue.increment(-1),
          soldTickets: FieldValue.increment(1),
          updatedAt: now,
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
