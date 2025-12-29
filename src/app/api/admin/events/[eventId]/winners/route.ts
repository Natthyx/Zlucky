import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase/admin";
import { Timestamp } from "firebase-admin/firestore";
import { shuffleArray } from "@/lib/utils";
import { Ticket } from "@/lib/types";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;

  try {
    // 1. Authentication & Ownership Verification
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const adminId = decodedToken.uid;

    const { numberOfWinners = 1, prizes = [] } = await req.json();

    // 2. Transaction for Winner Generation
    const winners = await adminDb.runTransaction(async (transaction) => {
      const eventRef = adminDb.collection("events").doc(eventId);
      const eventSnap = await transaction.get(eventRef);

      if (!eventSnap.exists) {
        throw new Error("Event not found");
      }

      const eventData = eventSnap.data();
      if (eventData?.adminId !== adminId) {
        throw new Error("Forbidden: You do not own this event");
      }

      if (eventData?.isWinnerGenerated) {
        throw new Error("Winners have already been generated for this event");
      }

      // Query SOLD tickets
      const soldTicketsSnap = await adminDb
        .collection("tickets")
        .where("eventId", "==", eventId)
        .where("status", "==", "sold")
        .get();

      if (soldTicketsSnap.empty) {
        throw new Error("No tickets have been sold yet");
      }

      if (soldTicketsSnap.size < numberOfWinners) {
        throw new Error(`Only ${soldTicketsSnap.size} tickets sold, but requested ${numberOfWinners} winners`);
      }

      const soldTickets = soldTicketsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Ticket[];

      // 3. Random Selection (Fisher-Yates)
      const selectedWinners = shuffleArray(soldTickets).slice(0, numberOfWinners);

      const generatedWinners = [];
      const now = Timestamp.now();

      for (let i = 0; i < selectedWinners.length; i++) {
        const ticket = selectedWinners[i];
        const winnerRef = adminDb.collection("winners").doc();
        const position = i + 1;

        const winnerData = {
          eventId,
          ticketId: ticket.id,
          position,
          prize: prizes[i] || `${position}${getOrdinal(position)} Prize`,
          ticketNumber: ticket.ticketNumber,
          buyerName: ticket.buyerName || "Unknown",
          buyerPhone: ticket.buyerPhone || "N/A",
          buyerEmail: ticket.buyerEmail || "",
          notified: false,
          claimStatus: "pending",
          createdAt: now,
          updatedAt: now,
        };

        transaction.set(winnerRef, winnerData);
        
        // Update Ticket to mark as winner
        const ticketRef = adminDb.collection("tickets").doc(ticket.id);
        transaction.update(ticketRef, {
          isWinner: true,
          winPosition: position,
          updatedAt: now,
        });

        generatedWinners.push({ id: winnerRef.id, ...winnerData });
      }

      // 4. Update Event Status
      transaction.update(eventRef, {
        isWinnerGenerated: true,
        winnersGeneratedAt: now,
        status: "completed",
        updatedAt: now,
      });

      return generatedWinners;
    });

    return NextResponse.json({ success: true, data: winners });
  } catch (error: any) {
    console.error("Winner generation error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: error.message.includes("Forbidden") ? 403 : 400 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;

  try {
    const winnersSnap = await adminDb
      .collection("winners")
      .where("eventId", "==", eventId)
      .get();

    const winners = winnersSnap.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .sort((a: any, b: any) => a.position - b.position);

    return NextResponse.json({ success: true, data: winners });
  } catch (error: any) {
    console.error("Fetch winners error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function getOrdinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}
