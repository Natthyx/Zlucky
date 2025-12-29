"use client";

import { useEffect, useState, use } from "react";
import { db } from "@/lib/firebase/client";
import { doc, getDoc } from "firebase/firestore";
import { Event, Ticket, Winner } from "@/lib/types";
import { TicketGrid } from "@/components/public/TicketGrid";
import { ReservationDrawer } from "@/components/public/ReservationDrawer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Ticket as TicketIcon, CheckCircle2, Trophy, Sparkles, XCircle } from "lucide-react";
import { formatCurrency, maskPhoneNumber } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface PublicEventPageProps {
  params: Promise<{ eventId: string }>;
}

export default function PublicEventPage({ params }: PublicEventPageProps) {
  const { eventId } = use(params);
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [winners, setWinners] = useState<Winner[]>([]);

  useEffect(() => {
    async function fetchEvent() {
      try {
        const snap = await getDoc(doc(db, "events", eventId));
        if (snap.exists()) {
          const data = { id: snap.id, ...snap.data() } as Event;
          setEvent(data);

          if (data.status === "completed" || data.isWinnerGenerated) {
            const winnersRes = await fetch(`/api/admin/events/${eventId}/winners`);
            const winnersResult = await winnersRes.json();
            if (winnersResult.success) {
              setWinners(winnersResult.data);
            }
          }
        }
      } catch (error) {
        console.error("Fetch event error:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchEvent();
  }, [eventId]);

  const handleTicketSelect = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsDrawerOpen(true);
  };

  const handleReservation = async (data: {
    buyerName: string;
    buyerPhone: string;
    buyerEmail?: string;
  }) => {
    if (!selectedTicket || !event) return;

    try {
      const normalizedPhone = `09${data.buyerPhone.slice(-8)}`;
      
      const response = await fetch(`/api/payments/initialize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          ticketNumber: selectedTicket.ticketNumber,
          buyerName: data.buyerName,
          buyerPhone: normalizedPhone,
          buyerEmail: data.buyerEmail || "",
          amount: event.ticketPrice,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        const errorMsg = typeof result.error === 'object' 
          ? JSON.stringify(result.error) 
          : result.error || "Failed to reserve ticket";
        throw new Error(errorMsg);
      }

      if (result.checkout_url) {
        window.location.href = result.checkout_url;
      } else {
        alert(result.error || "Failed to reserve ticket. Please try again.");
      }
    } catch (error: any) {
      console.error("Reservation error:", error);
      alert(`An unexpected error occurred: ${error.message || "Please try again."}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 text-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Event Not Found</h1>
          <p className="text-slate-500">The link you followed might be broken or the event was removed.</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-20">
      {/* Premium Header */}
      <div className="bg-indigo-600 px-6 pt-12 pb-24 text-white rounded-b-[3rem] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-400/20 rounded-full -ml-10 -mb-10 blur-2xl" />
        
        <div className="max-w-xl mx-auto space-y-4 relative z-10 text-center">
          <div className="flex justify-center gap-2">
            <Badge className="bg-white/20 hover:bg-white/30 text-white border-white/10 backdrop-blur-sm px-3 py-1 font-bold tracking-wider">
              LUCKY DRAW
            </Badge>
            {event.status === "completed" && (
              <Badge className="bg-amber-400 text-slate-900 border-none px-3 py-1 font-black tracking-wider uppercase italic">
                COMPLETED
              </Badge>
            )}
          </div>
          <h1 className="text-4xl font-black tracking-tight leading-[0.9] uppercase italic">
            {event.name}
          </h1>
          <p className="text-indigo-100/90 text-sm line-clamp-2 leading-relaxed max-w-sm mx-auto">
            {event.description || "Join this exciting event for a chance to win amazing prizes!"}
          </p>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="max-w-xl mx-auto px-4 -mt-16 relative z-20">
        <Card className="border-none shadow-premium overflow-hidden">
          <CardContent className="p-6 md:p-8">
            {event.status === "completed" ? (
              <div className="space-y-8">
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trophy className="w-8 h-8 text-amber-600" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Winners Announced!</h2>
                  <p className="text-slate-500 font-medium text-sm">Congratulations to all the lucky winners.</p>
                </div>

                <div className="space-y-4">
                  {winners.map((winner) => (
                    <div key={winner.id} className="bg-slate-50 rounded-2xl p-5 border border-slate-100 flex items-center justify-between group transition-all hover:border-indigo-200 hover:bg-white shadow-sm hover:shadow-md">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-black italic">
                          #{winner.position}
                        </div>
                        <div>
                          <p className="font-black text-slate-900 uppercase tracking-tight leading-none mb-1">{winner.buyerName}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{maskPhoneNumber(winner.buyerPhone)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-tighter leading-none mb-1">Ticket</p>
                        <p className="font-black text-slate-900 italic">#{winner.ticketNumber}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4">
                  <Link href="/">
                    <Button className="w-full h-14 rounded-2xl font-black uppercase italic tracking-tight shadow-xl shadow-indigo-100 border-none bg-indigo-600 text-white">
                      Explore More Events
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                      <TicketIcon className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Price</p>
                      <p className="text-lg font-bold text-slate-900 leading-tight">
                        {formatCurrency(event.ticketPrice)}
                      </p>
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Available</p>
                      <p className="text-lg font-bold text-slate-900 leading-tight">
                        {event.availableTickets}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2 tracking-tight">
                      Select Your Lucky Ticket
                    </h3>
                  </div>

                  <TicketGrid 
                    eventId={eventId} 
                    onTicketSelect={handleTicketSelect}
                    selectedTicketId={selectedTicket?.id}
                  />

                  <div className="flex items-center justify-center gap-6 mt-8 pt-6 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Available</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-amber-500 shadow-sm shadow-amber-200" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Reserved</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-slate-300 shadow-sm shadow-slate-100" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Sold</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="mt-8 text-center space-y-6">
          <div className="inline-flex items-center gap-4 bg-white/50 backdrop-blur-sm border border-white px-6 py-2 rounded-full shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              Secure Payment via Chapa
            </p>
          </div>
        </div>
      </div>

      <ReservationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        ticket={selectedTicket}
        onSubmit={handleReservation}
      />
    </main>
  );
}
