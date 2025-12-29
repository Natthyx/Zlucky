import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { Timestamp, FieldValue } from "firebase-admin/firestore";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Handle both direct calls {tx_ref} and Chapa webhooks {data: {tx_ref}}
    const tx_ref = body.tx_ref || body.data?.tx_ref;

    if (body.event) {
      console.log(`[Chapa Webhook] Event: ${body.event}, Ref: ${tx_ref}`);
    }

    if (!tx_ref) {
      return NextResponse.json({ error: "Missing tx_ref" }, { status: 400 });
    }

    // 1. Call Chapa verify endpoint
    const response = await fetch(`https://api.chapa.co/v1/transaction/verify/${tx_ref}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`,
      },
    });

    const chapaData = await response.json();

    // 2. Fetch current payment document
    const paymentRef = adminDb.collection("payments").doc(tx_ref);
    const paymentSnap = await paymentRef.get();

    if (!paymentSnap.exists) {
      return NextResponse.json({ error: "Payment record not found" }, { status: 404 });
    }

    const paymentData = paymentSnap.data()!;

    // Idempotency: If already processed, return current status
    if (paymentData.status !== "pending") {
      return NextResponse.json({ 
        success: paymentData.status === "success", 
        status: paymentData.status,
        chapaDetails: paymentData.chapaDetails
      });
    }

    // 3. Check for success status from Chapa
    if (chapaData.status === "success" && chapaData.data.status === "success") {
      // Verify amount
      if (Number(chapaData.data.amount) !== Number(paymentData.amount)) {
        console.error("Payment amount mismatch!");
        await paymentRef.update({ status: "failed", error: "Amount mismatch" });
        return NextResponse.json({ error: "Amount mismatch" }, { status: 400 });
      }

      // Update payment and ticket within a transaction for atomicity
      await adminDb.runTransaction(async (transaction) => {
        // 1. PERFORM ALL READS FIRST
        const ticketsQuery = adminDb
          .collection("tickets")
          .where("eventId", "==", paymentData.eventId)
          .where("ticketNumber", "==", paymentData.ticketNumber)
          .limit(1);

        const ticketsSnap = await transaction.get(ticketsQuery);

        // 2. PERFORM ALL WRITES
        // Update Payment status
        transaction.update(paymentRef, {
          status: "success",
          updatedAt: Timestamp.now(),
          chapaDetails: chapaData.data,
        });

        if (!ticketsSnap.empty) {
          const ticketRef = ticketsSnap.docs[0].ref;
          transaction.update(ticketRef, {
            status: "sold",
            tx_ref: tx_ref,
            buyerName: paymentData.buyerName,
            buyerPhone: paymentData.buyerPhone,
            buyerEmail: paymentData.buyerEmail || "",
            soldAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          });

          // Update event counters
          const eventRef = adminDb.collection("events").doc(paymentData.eventId);
          transaction.update(eventRef, {
            soldTickets: FieldValue.increment(1),
            reservedTickets: FieldValue.increment(-1),
            updatedAt: Timestamp.now(),
          });
        }
      });

      return NextResponse.json({ 
        success: true, 
        status: "success",
        chapaDetails: chapaData.data
      });
    } else {
      // 4. Handle failure
      await paymentRef.update({
        status: "failed",
        updatedAt: Timestamp.now(),
        chapaDetails: chapaData.data || chapaData,
      });

      // Revert ticket to available
      const ticketsQuery = adminDb
        .collection("tickets")
        .where("eventId", "==", paymentData.eventId)
        .where("ticketNumber", "==", paymentData.ticketNumber)
        .limit(1);
      
      const ticketsSnap = await adminDb.collection("tickets")
        .where("eventId", "==", paymentData.eventId)
        .where("ticketNumber", "==", paymentData.ticketNumber)
        .limit(1)
        .get();

      if (!ticketsSnap.empty) {
        await ticketsSnap.docs[0].ref.update({
          status: "available",
          updatedAt: Timestamp.now(),
        });

        // Update event available count
        const eventRef = adminDb.collection("events").doc(paymentData.eventId);
        await eventRef.update({
          availableTickets: FieldValue.increment(1),
          reservedTickets: FieldValue.increment(-1),
        });
      }

      return NextResponse.json({ success: false, status: "failed" });
    }
  } catch (error: any) {
    console.error("Payment Verify Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
