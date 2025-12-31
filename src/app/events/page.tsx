"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase/client";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Event } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowRight, PlayCircle } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function AllEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const eventsPerPage = 6;

  useEffect(() => {
    async function fetchEvents() {
      try {
        const q = query(
          collection(db, "events"),
          where("status", "in", ["active", "completed"])
        );
        const snapshot = await getDocs(q);
        const eventsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Event[];

        // Sort in memory: Active first, then by date descending
        const sortedEvents = eventsData.sort((a, b) => {
          const priority = { active: 0, completed: 1, closed: 2 };
          const statusA = priority[a.status as keyof typeof priority] ?? 99;
          const statusB = priority[b.status as keyof typeof priority] ?? 99;
          
          if (statusA !== statusB) return statusA - statusB;

          const dateA = a.createdAt?.seconds || 0;
          const dateB = b.createdAt?.seconds || 0;
          return dateB - dateA;
        });

        setEvents(sortedEvents);
      } catch (error) {
        console.error("Fetch events error:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, []);

  // Pagination Logic
  const indexOfLastEvent = currentPage * eventsPerPage;
  const indexOfFirstEvent = indexOfLastEvent - eventsPerPage;
  const currentEvents = events.slice(indexOfFirstEvent, indexOfLastEvent);
  const totalPages = Math.ceil(events.length / eventsPerPage);

  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <main className="min-h-screen bg-slate-50 pb-20">
      <Navbar />
      {/* Header */}
      <div className="bg-indigo-600 px-6 pt-12 pb-24 text-white rounded-b-[3rem] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />
        <div className="max-w-5xl mx-auto space-y-4 relative z-10 text-center">
          <Badge className="bg-white/20 hover:bg-white/30 text-white border-white/10 backdrop-blur-sm px-3 py-1 font-bold tracking-wider">
            DISCOVER LUCK
          </Badge>
          <h1 className="text-5xl font-black tracking-tight leading-[0.9] uppercase italic">
            Active Events
          </h1>
          <p className="text-indigo-100/90 text-sm max-w-sm mx-auto font-medium">
            Browse through our ongoing lucky draws and grab your winning ticket today!
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 -mt-12 relative z-20">
        {loading ? (
          <div className="flex items-center justify-center p-24">
            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
          </div>
        ) : events.length === 0 ? (
          <Card className="border-none shadow-premium p-12 text-center">
            <h2 className="text-xl font-bold text-slate-900 mb-2 font-black italic uppercase tracking-tighter">No Events Found</h2>
            <p className="text-slate-500 mb-6">There are currently no active events. Check back later!</p>
            <Link href="/">
              <Button className="rounded-xl h-12 px-8 font-bold">Return Home</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentEvents.map((event) => (
                <Card key={event.id} className="border-none shadow-premium hover:-translate-y-1 transition-all group overflow-hidden bg-white/80 backdrop-blur-sm border border-white/50">
                  <CardContent className="p-0">
                    <div className="p-6 space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <Badge className={event.status === "active" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-amber-500/10 text-amber-600 border-amber-500/20"}>
                            {event.status.toUpperCase()}
                          </Badge>
                          <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter leading-none pt-1">
                            {event.name}
                          </h3>
                        </div>
                      </div>
                      
                      <p className="text-slate-500 text-sm line-clamp-2 font-medium leading-relaxed">
                        {event.description || "Join this exciting event for a chance to win amazing prizes!"}
                      </p>

                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Ticket Price</p>
                            <p className="font-bold text-slate-900">{formatCurrency(event.ticketPrice)}</p>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Available</p>
                            <p className="font-bold text-slate-900">{event.availableTickets}</p>
                        </div>
                      </div>

                      <Link href={`/event/${event.id}`} className="block pt-2">
                        <Button className="w-full h-12 rounded-xl font-black uppercase italic tracking-tight gap-2 group-hover:bg-indigo-700 transition-all bg-indigo-600 shadow-lg shadow-indigo-100">
                          {event.status === "active" ? (
                            <>
                              Get Ticket <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </>
                          ) : (
                            <>
                              View Results <PlayCircle className="w-5 h-5" />
                            </>
                          )}
                        </Button>
                      </Link>
                    </div>
                    
                    {/* Decorative Footer */}
                    <div className="h-1.5 w-full bg-indigo-600/5 group-hover:bg-indigo-600 transition-colors" />
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="rounded-xl font-bold border-slate-200"
                >
                  Previous
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <Button
                      key={i}
                      variant={currentPage === i + 1 ? "default" : "outline"}
                      onClick={() => paginate(i + 1)}
                      className={cn(
                        "w-10 h-10 rounded-xl font-black italic transition-all",
                        currentPage === i + 1 ? "bg-indigo-600 shadow-lg shadow-indigo-100" : "border-slate-200 text-slate-500"
                      )}
                    >
                      {i + 1}
                    </Button>
                  ))}
                </div>

                <Button
                  variant="outline"
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="rounded-xl font-bold border-slate-200"
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12 text-center">
        <Link href="/">
          <Button variant="ghost" className="rounded-xl text-slate-400 font-bold hover:text-slate-900">
            Back to Home
          </Button>
        </Link>
      </div>
      <Footer />
    </main>
  );
}
