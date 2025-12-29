import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Ticket, Trophy, Smartphone, ShieldCheck, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 overflow-hidden">
      {/* Premium Hero Section */}
      <section className="relative pt-20 pb-32 px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] bg-indigo-600/5 rounded-full blur-3xl pointer-events-none -mt-[500px]" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-8">
          <div className="inline-flex items-center gap-2 bg-white px-4 py-1.5 rounded-full shadow-sm border border-slate-100 mb-4 animate-bounce">
            <SparkleIcon className="w-4 h-4 text-amber-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">The Ultimate Raffle Platform</span>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-slate-900 italic uppercase leading-[0.9]">
            Instant <br />
            <span className="text-indigo-600">Luck</span> Pick
          </h1>
          
          <p className="max-w-xl mx-auto text-slate-500 font-medium text-lg leading-relaxed">
            Beautiful, transparent, and mobile-first ticket system for your lucky draws. Secure payments and instant winners.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/admin/auth/login" className="w-full sm:w-auto">
              <Button className="w-full sm:w-64 h-16 rounded-3xl text-xl font-black italic uppercase tracking-tight shadow-indigo-200 shadow-2xl gap-3">
                Create Event <ArrowRight className="w-6 h-6" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="px-6 pb-32 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: Smartphone, title: "Mobile Ready", text: "Users join your event instantly by scanning a QR code on their phone." },
            { icon: ShieldCheck, title: "Secure Payments", text: "Integrated with Chapa for safe, fast, and local payment verification." },
            { icon: Trophy, title: "Fair Winners", text: "Provably random selection from sold tickets using standard algorithms." }
          ].map((feature, i) => (
            <Card key={i} className="border-none shadow-premium hover:-translate-y-1 transition-transform">
              <CardContent className="p-8 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center">
                  <feature.icon className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="text-xl font-black uppercase italic tracking-tighter text-slate-900">{feature.title}</h3>
                <p className="text-slate-500 text-sm font-medium leading-relaxed">{feature.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-slate-100 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
           <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-xl italic">Z</span>
            </div>
            <span className="font-black text-2xl tracking-tighter text-slate-900 italic uppercase">Lucky</span>
        </div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-loose">
          Secure. Transparent. Fun. <br />
          © 2025 Zlucky Technologies.
        </p>
      </footer>
    </div>
  );
}

function SparkleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  );
}
