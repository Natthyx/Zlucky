"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { TicketVerificationDrawer } from "../public/TicketVerificationDrawer";

export function Navbar() {
  const pathname = usePathname();
  
  return (
    <div className="bg-slate-900 py-3 px-6 relative z-[100] border-b border-slate-800">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group transition-all">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform shadow-lg shadow-indigo-900/20">
             <span className="text-white font-black text-xl italic drop-shadow-sm">Z</span>
          </div>
          <span className="text-xl font-black text-white tracking-tighter italic uppercase drop-shadow-sm">Lucky</span>
        </Link>
        
        {/* <div className="flex items-center gap-6">
          <nav className="hidden md:flex items-center gap-6">
            <Link 
              href="/events" 
              className={cn(
                "text-[10px] font-bold uppercase tracking-widest transition-all",
                pathname === "/events" ? "text-indigo-400" : "text-slate-400 hover:text-white"
              )}
            >
              All Events
            </Link>
          </nav> */}

        <div className="flex items-center gap-4">
           {/* Verification Button */}
           <TicketVerificationDrawer />

          {/* <div className="flex items-center gap-3 border-l border-slate-700 pl-6 h-6">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none hidden sm:inline">Created By</span>
            <Link href="https://smstechnologies.com" target="_blank">
              <img src="/sms_logo.png" alt="SMS Technologies" className="h-5 brightness-110 opacity-70 hover:opacity-100 transition-all cursor-pointer" />
            </Link>
          </div> */}
        </div>
      </div>
    </div>
  );
}
