"use client";

import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Ticket, Sparkles, PlusCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function NewEventPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    ticketPrice: "",
    totalTickets: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      const idToken = await user.getIdToken();
      const response = await fetch("/api/admin/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          ...formData,
          ticketPrice: Number(formData.ticketPrice),
          totalTickets: Number(formData.totalTickets),
        }),
      });

      const result = await response.json();
      if (result.success) {
        router.push(`/admin/events/${result.data.eventId}`);
      } else {
        alert(result.error || "Failed to create event");
      }
    } catch (error) {
      console.error("Create event error:", error);
      alert("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-12 space-y-2">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight italic uppercase">
            Host New Event
          </h1>
          <p className="text-slate-500 font-medium">
            Define your lucky draw parameters and we'll handle the rest.
          </p>
        </div>

        <Card className="border-none shadow-premium overflow-hidden">
          <div className="h-2 w-full bg-indigo-600" />
          <CardHeader className="pb-2">
             <div className="mx-auto w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
              <PlusCircle className="w-6 h-6 text-indigo-600" />
            </div>
            <CardTitle className="text-center font-black uppercase italic tracking-tighter text-2xl">
              Event Configuration
            </CardTitle>
          </CardHeader>
          
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Event Name</label>
                <Input
                  required
                  placeholder="e.g. Mega Holiday Raffle"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Description (Optional)</label>
                <textarea
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 min-h-[120px] shadow-sm transition-all"
                  placeholder="Share details about the prizes..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Ticket Price (ETB)</label>
                  <Input
                    required
                    type="number"
                    min="1"
                    placeholder="100"
                    value={formData.ticketPrice}
                    onChange={(e) => setFormData({ ...formData, ticketPrice: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Total Tickets</label>
                  <Input
                    required
                    type="number"
                    min="1"
                    max="500"
                    placeholder="50"
                    value={formData.totalTickets}
                    onChange={(e) => setFormData({ ...formData, totalTickets: e.target.value })}
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-slate-50">
                <Button 
                  className="w-full h-14 rounded-2xl text-lg font-black italic shadow-indigo-200 shadow-xl tracking-tight"
                  disabled={loading}
                  type="submit"
                >
                  {loading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <span className="flex items-center gap-2 uppercase">
                      Finish & Generate Tickets <Sparkles className="w-5 h-5" />
                    </span>
                  )}
                </Button>
                <p className="text-[10px] text-center text-slate-400 mt-6 uppercase tracking-widest font-black leading-relaxed">
                  Note: Tickets and QR codes are generated instantly <br /> and cannot be changed after creation.
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
