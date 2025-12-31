"use client";

import { useEffect, useState, use } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useAuth } from "@/components/auth/AuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  QrCode, 
  Download, 
  Users, 
  Ticket as TicketIcon, 
  ExternalLink,
  ChevronLeft,
  Loader2,
  TrendingUp,
  CreditCard
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Event, Ticket, Winner } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { WinnerGenerator } from "@/components/admin/WinnerGenerator";

interface EventDetailPageProps {
  params: Promise<{ eventId: string }>;
}

export default function EventDetailPage({ params }: EventDetailPageProps) {
  const { eventId } = use(params);
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  const [winners, setWinners] = useState<Winner[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      try {
        const idToken = await user.getIdToken();
        
        // Fetch Event
        const eventRes = await fetch(`/api/admin/events/${eventId}`, {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        const eventResult = await eventRes.json();
        if (eventResult.success) {
          setEvent(eventResult.data);
          
          // If winners are generated, fetch them
          if (eventResult.data.isWinnerGenerated) {
            const winnersRes = await fetch(`/api/admin/events/${eventId}/winners`, {
              headers: { Authorization: `Bearer ${idToken}` },
            });
            const winnersResult = await winnersRes.json();
            if (winnersResult.success) {
              setWinners(winnersResult.data);
            }
          }
        }
        
        // Fetch Tickets
        const ticketsRes = await fetch(`/api/admin/events/${eventId}/tickets`, {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        const ticketsResult = await ticketsRes.json();
        if (ticketsResult.success) {
          setTickets(ticketsResult.data);
        }
      } catch (error) {
        console.error("Fetch error:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user, eventId]);

  /* 
    Refactored Actions to use Toasts and Dialogs. 
    Note: The actual Dialog UI is rendered below in the JSX.
  */
  const deleteEvent = async () => {
    setActionLoading(true);
    try {
      if (!user) return;
      const idToken = await user.getIdToken();
      const res = await fetch(`/api/admin/events/${eventId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (res.ok) {
        toast.success("Event deleted successfully");
        window.location.href = "/admin/events";
      } else {
        toast.error("Failed to delete event");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error deleting event");
    } finally {
      setActionLoading(false);
    }
  };

  const completeEvent = async () => {
    setActionLoading(true);
    try {
      if (!user) return;
      const idToken = await user.getIdToken();
      const res = await fetch(`/api/admin/events/${eventId}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}` 
        },
        body: JSON.stringify({ status: "completed" }),
      });
      if (res.ok) {
        setEvent(prev => prev ? { ...prev, status: "completed" } : null);
        toast.success("Event marked as completed");
      } else {
        toast.error("Failed to complete event");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error completing event");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (!event) return null;

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    if (typeof date.toDate === 'function') return date.toDate().toLocaleDateString();
    if (date.seconds) return new Date(date.seconds * 1000).toLocaleDateString();
    return new Date(date).toLocaleDateString();
  };

  const soldTickets = tickets.filter(t => t.status === "sold");

  return (
    <AdminLayout>
      <Link href="/admin/events" className="inline-flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-colors mb-8 font-bold text-sm uppercase tracking-widest">
        <ChevronLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-12">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase">{event.name}</h1>
            <Badge variant={event.status === "active" ? "available" : "secondary"}>{event.status.toUpperCase()}</Badge>
          </div>
          <p className="text-slate-500 font-medium max-w-xl leading-relaxed">{event.description}</p>
        </div>
        
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          {event.status !== "completed" && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="text-amber-600 border-amber-200 hover:bg-amber-50 rounded-xl font-bold tracking-tight h-12"
                  disabled={actionLoading}
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Complete Event"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will mark the event as completed and stop all ticket sales immediately. This action cannot be easily undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={completeEvent} className="bg-amber-600 hover:bg-amber-700">
                    Mark as Completed
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="outline" 
                className="text-rose-600 border-rose-100 hover:bg-rose-50 rounded-xl font-bold tracking-tight h-12"
                disabled={actionLoading}
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete Event"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the event and all associated tickets from the database.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={deleteEvent} className="bg-rose-600 hover:bg-rose-700">
                  Delete Event
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Link href={event.publicEventUrl} target="_blank" className="flex-1 md:flex-none">
            <Button variant="outline" className="w-full rounded-xl gap-2 font-bold tracking-tight h-12">
              <ExternalLink className="w-4 h-4" /> View Public
            </Button>
          </Link>
          <a href={event.qrCodeUrl} download={`QR_${event.name}.png`} className="flex-1 md:flex-none">
            <Button className="w-full rounded-xl gap-2 font-bold tracking-tight h-12 shadow-indigo-100 shadow-xl">
              <Download className="w-4 h-4" /> Download QR
            </Button>
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Card className="border-none shadow-premium">
              <CardContent className="p-6 space-y-4 text-center">
                <div className="mx-auto w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Revenue</p>
                  <p className="text-2xl font-black text-slate-900 leading-none">{formatCurrency(event.soldTickets * event.ticketPrice)}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-premium">
              <CardContent className="p-6 space-y-4 text-center">
                <div className="mx-auto w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <Users className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Participants</p>
                  <p className="text-2xl font-black text-slate-900 leading-none">{event.soldTickets}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-premium">
              <CardContent className="p-6 space-y-4 text-center">
                <div className="mx-auto w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Fill Rate</p>
                  <p className="text-2xl font-black text-slate-900 leading-none">{Math.round((event.soldTickets / event.totalTickets) * 100)}%</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sold Tickets Table */}
          <Card className="border-none shadow-premium overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-8 py-6">
              <CardTitle className="text-lg font-black uppercase tracking-tight italic flex items-center gap-2">
                <Users className="w-5 h-5 text-slate-400" /> Recent Buyers
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {soldTickets.length === 0 ? (
                <div className="p-20 text-center text-slate-400 font-medium">No sales recorded yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50/30 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-50">
                        <th className="px-8 py-4">Ticket</th>
                        <th className="px-8 py-4">Buyer</th>
                        <th className="px-8 py-4">Phone</th>
                        <th className="px-8 py-4">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {soldTickets.map((ticket) => (
                        <tr key={ticket.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-8 py-4 font-black text-indigo-600 italic">#{ticket.ticketNumber}</td>
                          <td className="px-8 py-4 font-bold text-slate-700">{ticket.buyerName}</td>
                          <td className="px-8 py-4 text-slate-500 font-medium text-sm">{ticket.buyerPhone}</td>
                          <td className="px-8 py-4 text-slate-400 text-xs font-bold uppercase transition-colors tracking-widest">
                            {formatDate(ticket.soldAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          {/* QR Preview Section */}
          <Card className="border-none shadow-premium overflow-hidden">
             <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-8 py-6">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-500">Event QR Code</CardTitle>
            </CardHeader>
            <CardContent className="p-8 flex flex-col items-center">
              <div className="bg-white p-4 rounded-3xl shadow-premium border border-slate-100 mb-6">
                <img src={event.qrCodeUrl} alt="QR Code" className="w-48 h-48" />
              </div>
              <p className="text-xs text-center text-slate-400 font-medium leading-relaxed mb-6">
                Users can scan this to access the <br /> 
                <span className="font-bold text-slate-900 underline">{event.name}</span> public page.
              </p>
            </CardContent>
          </Card>

          {/* Winner Generation Module */}
          <WinnerGenerator 
            eventId={eventId} 
            isGenerated={event.isWinnerGenerated} 
            soldCount={event.soldTickets}
            onSuccess={() => {
              // Refreshing local state would be better, but we can just reload for now
              window.location.reload();
            }}
          />
        </div>
      </div>
    </AdminLayout>
  );
}
