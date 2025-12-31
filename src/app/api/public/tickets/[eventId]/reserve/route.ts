import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { chapa } from "@/lib/chapa/client";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { isValidEmail, isValidEthiopianPhone, normalizeEthiopianPhone } from "@/lib/utils";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;

  try {
    const { ticketNumber, buyerName, buyerPhone, buyerEmail } = await req.json();

    // 1. Validation & Normalization
    if (!ticketNumber || !buyerName || !buyerPhone || !buyerEmail) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Robust Normalization for Ethiopian numbers
    const normalizedPhone = normalizeEthiopianPhone(buyerPhone);
    if (!normalizedPhone) {
      return NextResponse.json({ error: "Invalid Ethiopian phone number format" }, { status: 400 });
    }

    if (!isValidEmail(buyerEmail)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    if (!isValidEthiopianPhone(normalizedPhone)) {
      console.log("Phone validation failed for:", normalizedPhone);
      return NextResponse.json({ error: "Invalid Ethiopian phone number" }, { status: 400 });
    }

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

      // Create Payment Placeholder record
      const paymentRef = adminDb.collection("payments").doc();
      const paymentId = paymentRef.id;

      // Update Ticket
      transaction.update(ticketRef, {
        status: "reserved",
        buyerName,
        buyerPhone: normalizedPhone,
        buyerEmail,
        reservedAt: now,
        reservationExpiresAt: expiresAt,
        paymentId,
        updatedAt: now,
      });

      // Update Event Counters
      transaction.update(eventRef, {
        availableTickets: eventData.availableTickets - 1,
        reservedTickets: eventData.reservedTickets + 1,
        updatedAt: now,
      });

      return {
        paymentId,
        paymentRef,
        ticketId: ticketDoc.id,
        ticketPrice: eventData.ticketPrice,
        eventName: eventData.name,
        expiresAt,
      };
    });

    // 3. Initialize Chapa Payment (Outside transaction to avoid slow locks)
    try {
      const chapaResponse = await chapa.initialize({
        amount: result.ticketPrice,
        currency: "ETB",
        email: buyerEmail,
        first_name: buyerName,
        phone_number: normalizedPhone,
        tx_ref: result.paymentId,
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/chapa`,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?tx_ref=${result.paymentId}`,
        customization: {
          title: result.eventName,
          description: `Ticket ${ticketNumber} for ${buyerName}`.replace(/[^a-zA-Z0-9\s._-]/g, ""),
        },
      });

      if (chapaResponse.status !== "success") {
        console.error("Chapa initialization failed:", JSON.stringify(chapaResponse, null, 2));
        const errorMessage = typeof chapaResponse.message === 'string' 
          ? chapaResponse.message 
          : JSON.stringify(chapaResponse.message || chapaResponse.errors || chapaResponse) || "Failed to initialize payment";
        throw new Error(errorMessage);
      }

      // 4. Finalize Payment Record
      await result.paymentRef.set({
        id: result.paymentId,
        eventId,
        ticketId: result.ticketId, // Correctly link to ticket
        chapaReference: result.paymentId,
        chapaCheckoutUrl: chapaResponse.data.checkout_url,
        amount: result.ticketPrice,
        currency: "ETB",
        buyerName,
        buyerPhone: normalizedPhone,
        buyerEmail,
        status: "pending",
        webhookReceived: false,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        expiresAt: result.expiresAt,
      });

      return NextResponse.json({
        success: true,
        data: {
          ticketId: result.ticketId,
          paymentId: result.paymentId,
          chapaCheckoutUrl: chapaResponse.data.checkout_url,
          expiresAt: result.expiresAt.toDate().toISOString(),
        },
      });
    } catch (paymentError: any) {
      console.error("Chapa Initialization Error:", paymentError);
      // REVERT RESERVATION if Chapa fails
      await adminDb.runTransaction(async (transaction) => {
        const ticketQuery = adminDb.collection("tickets").where("paymentId", "==", result.paymentId).limit(1);
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

      throw paymentError;
    }
  } catch (error: any) {
    console.error("Reservation error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: error.message.includes("not found") ? 404 : 400 }
    );
  }
}
