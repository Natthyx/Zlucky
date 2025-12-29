"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase/client";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { Ticket } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface TicketGridProps {
  eventId: string;
  onTicketSelect: (ticket: Ticket) => void;
  selectedTicketId?: string;
}

export function TicketGrid({ eventId, onTicketSelect, selectedTicketId }: TicketGridProps) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "tickets"),
      where("eventId", "==", eventId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ticketsData = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Ticket[];
      
      // Sort in memory to avoid needing a composite index
      const sortedTickets = ticketsData.sort((a, b) => a.ticketNumber - b.ticketNumber);
      
      setTickets(sortedTickets);
      setLoading(false);
    }, (error) => {
      console.error("Ticket stream error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [eventId]);

  if (loading) {
    return (
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="aspect-square rounded-xl bg-slate-100 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!loading && tickets.length === 0) {
    return (
      <div className="p-12 text-center rounded-2xl border-2 border-dashed border-slate-100">
        <p className="text-slate-400 font-medium">No tickets available for this event.</p>
        <p className="text-[10px] text-slate-300 uppercase mt-2 font-bold tracking-widest">Event ID: {eventId}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
      {tickets.map((ticket) => {
        const isSelected = selectedTicketId === ticket.id;
        const isAvailable = ticket.status === "available";
        const isReserved = ticket.status === "reserved";
        const isSold = ticket.status === "sold";
        const isWinner = ticket.isWinner;

        return (
          <button
            key={ticket.id}
            disabled={!isAvailable}
            onClick={() => onTicketSelect(ticket)}
            className={cn(
              "aspect-square rounded-xl flex flex-col items-center justify-center transition-all relative overflow-hidden text-sm font-bold shadow-sm active:scale-95",
              isAvailable && "bg-white text-slate-900 border border-slate-200 hover:border-emerald-500 hover:text-emerald-600",
              isReserved && "bg-amber-400 text-white border-amber-500 cursor-not-allowed shadow-inner",
              isSold && "bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed opacity-60",
              isSelected && "ring-2 ring-indigo-500 border-indigo-500 bg-indigo-50 text-indigo-700",
              isWinner && "bg-indigo-600 text-white border-indigo-500 grayscale-0 shadow-lg shadow-indigo-200 ring-2 ring-amber-400 ring-offset-1"
            )}
          >
            {ticket.ticketNumber}
            {isWinner ? (
              <span className="absolute bottom-1 text-[8px] font-black uppercase text-amber-300">Winner</span>
            ) : isReserved ? (
              <span className="absolute bottom-1 text-[8px] font-black uppercase text-white/80">Reserved</span>
            ) : isSold ? (
              <span className="absolute bottom-1 text-[8px] font-black uppercase text-slate-400">Sold</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
