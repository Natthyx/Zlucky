"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useAuth } from "@/components/auth/AuthProvider";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Ticket, 
  Users, 
  Calendar, 
  ArrowRight,
  Loader2,
  TrendingUp
} from "lucide-react";
import Link from "next/link";
import { Event } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

export default function AdminEventsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvents() {
      if (!user) return;
      try {
        const idToken = await user.getIdToken();
        const response = await fetch("/api/admin/events", {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        const result = await response.json();
        if (result.success) {
          setEvents(result.data);
        }
      } catch (error) {
        console.error("Fetch events error:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, [user]);

  return (
    <AdminLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase italic">
            Dashboard
          </h1>
          <p className="text-slate-500 font-medium tracking-tight">
            Manage your lucky winner events and track performance.
          </p>
        </div>
        <Link href="/admin/events/new">
          <Button className="h-12 px-6 rounded-xl font-bold shadow-indigo-100 shadow-xl gap-2">
            <Plus className="w-5 h-5" />
            Create New Event
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        </div>
      ) : events.length === 0 ? (
        <Card className="border-dashed border-2 border-slate-200 bg-transparent py-20 text-center">
          <CardContent className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-2">
              <Ticket className="w-8 h-8 text-slate-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">No events yet</h2>
            <p className="text-slate-500 max-w-xs mx-auto">
              Ready to host your first lucky draw? Create an event to generate tickets and QR codes.
            </p>
            <Link href="/admin/events/new" className="inline-block pt-2">
              <Button variant="outline" className="rounded-xl font-bold">
                Get Started
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {events.map((event) => (
            <Link key={event.id} href={`/admin/events/${event.id}`}>
              <Card className="hover:border-indigo-200 hover:shadow-indigo-50/50 transition-all cursor-pointer group">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-100">
                    <div className="p-6 md:p-8 flex-1 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <Badge variant={event.status === "active" ? "available" : "secondary"}>
                            {event.status.toUpperCase()}
                          </Badge>
                          <h3 className="text-2xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors uppercase italic tracking-tighter">
                            {event.name}
                          </h3>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-6">
                        <div className="flex items-center gap-2 text-slate-400">
                          <Calendar className="w-4 h-4" />
                          <span className="text-xs font-bold uppercase tracking-widest">
                            {new Date(event.createdAt.seconds * 1000).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-400">
                          <TrendingUp className="w-4 h-4" />
                          <span className="text-xs font-bold uppercase tracking-widest">
                            Price: {formatCurrency(event.ticketPrice)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 md:p-8 bg-slate-50/50 flex md:flex-col justify-between gap-4 w-full md:w-64">
                      <div className="space-y-4 flex-1">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <span>Sold Progress</span>
                            <span>{Math.round((event.soldTickets / event.totalTickets) * 100)}%</span>
                          </div>
                          <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-indigo-500 rounded-full transition-all" 
                              style={{ width: `${(event.soldTickets / event.totalTickets) * 100}%` }}
                            />
                          </div>
                        </div>
                        
                        <div className="flex gap-4">
                          <div className="flex-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Sold</p>
                            <p className="text-lg font-black text-slate-900 leading-none">{event.soldTickets}</p>
                          </div>
                          <div className="flex-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Total</p>
                            <p className="text-lg font-black text-slate-900 leading-none">{event.totalTickets}</p>
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="w-6 h-6 text-slate-300 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
