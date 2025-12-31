import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { Timestamp, FieldValue } from "firebase-admin/firestore";
import { normalizeEthiopianPhone } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { eventId, ticketNumber, buyerName, amount } = body;
    let { buyerPhone } = body;
    const buyerEmail = body.buyerEmail || "guest@zlucky.com";

    // Normalize phone number
    const normalizedPhone = normalizeEthiopianPhone(buyerPhone);
    if (!normalizedPhone) {
      return NextResponse.json({ error: "Invalid phone number format" }, { status: 400 });
    }
    buyerPhone = normalizedPhone;

    if (!eventId || !ticketNumber || !buyerName || !buyerPhone || !amount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Generate UNIQUE tx_ref
    const tx_ref = `tx-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    // 2. Atomic Transaction for Reservation
    const result = await adminDb.runTransaction(async (transaction) => {
      // Get Event Details
      const eventRef = adminDb.collection("events").doc(eventId);
      const eventSnap = await transaction.get(eventRef);

      if (!eventSnap.exists) {
        throw new Error("Event not found");
      }

      const eventData = eventSnap.data();
      if (eventData?.status !== "active") {
        throw new Error("Event is not accepting reservations");
      }

      // Find Ticket
      const ticketsQuery = adminDb
        .collection("tickets")
        .where("eventId", "==", eventId)
        .where("ticketNumber", "==", Number(ticketNumber))
        .limit(1);

      const ticketsSnap = await transaction.get(ticketsQuery);

      if (ticketsSnap.empty) {
        throw new Error("Ticket not found");
      }

      const ticketDoc = ticketsSnap.docs[0];
      const ticketRef = ticketDoc.ref;
      const ticketData = ticketDoc.data();

      if (ticketData.status !== "available") {
        throw new Error("Ticket is already reserved or sold");
      }

      // Calculate expiration (10 minutes)
      const now = Timestamp.now();
      const expiresAt = new Timestamp(now.seconds + 600, now.nanoseconds);

      // Update Ticket
      transaction.update(ticketRef, {
        status: "reserved",
        buyerName,
        buyerPhone,
        buyerEmail,
        reservedAt: now,
        reservationExpiresAt: expiresAt,
        paymentId: tx_ref,
        updatedAt: now,
      });

      // Update Event Counters
      transaction.update(eventRef, {
        availableTickets: FieldValue.increment(-1),
        reservedTickets: FieldValue.increment(1),
        updatedAt: now,
      });

      // Prepare data for payment record
      return { 
        expiresAt,
        eventName: eventData.name 
      };
    });

    // 3. Store payment document in Firestore as "pending"
    const paymentRef = adminDb.collection("payments").doc(tx_ref);
    await paymentRef.set({
      tx_ref,
      eventId,
      ticketNumber: Number(ticketNumber),
      amount: Number(amount),
      buyerName,
      buyerPhone,
      buyerEmail,
      status: "pending",
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      expiresAt: result.expiresAt,
    });

    // 4. Call Chapa initialize endpoint
    const response = await fetch("https://api.chapa.co/v1/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount,
        currency: "ETB",
        email: buyerEmail,
        first_name: buyerName,
        phone_number: buyerPhone,
        tx_ref,
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/payments/callback`,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payment/success?tx_ref=${tx_ref}&eventId=${eventId}`,
        customization: {
          title: result.eventName,
          description: `Ticket ${ticketNumber} for ${buyerName}`.replace(/[^a-zA-Z0-9\s._-]/g, ""),
        },
      }),
    });

    const chapaData = await response.json();

    if (chapaData.status !== "success") {
      console.error("Chapa init failed:", chapaData);
      
      // REVERT RESERVATION if Chapa fails
      await adminDb.runTransaction(async (transaction) => {
        const ticketQuery = adminDb.collection("tickets").where("paymentId", "==", tx_ref).limit(1);
        const ticketSnap = await transaction.get(ticketQuery);
        
        if (!ticketSnap.empty) {
          const ticketRef = ticketSnap.docs[0].ref;
          transaction.update(ticketRef, {
            status: "available",
            buyerName: null,
            buyerPhone: null,
            buyerEmail: null,
            reservedAt: null,
            reservationExpiresAt: null,
            paymentId: null,
            updatedAt: Timestamp.now(),
          });

          const eventRef = adminDb.collection("events").doc(eventId);
          transaction.update(eventRef, {
            availableTickets: FieldValue.increment(1),
            reservedTickets: FieldValue.increment(-1),
            updatedAt: Timestamp.now(),
          });
        }
      });

      return NextResponse.json(
        { error: chapaData.message || "Failed to initialize payment" },
        { status: 400 }
      );
    }

    // 5. Return checkout_url to client
    return NextResponse.json({
      success: true,
      checkout_url: chapaData.data.checkout_url,
      tx_ref,
    });
  } catch (error: any) {
    console.error("Payment Initialize Error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
