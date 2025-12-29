"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  PlusCircle, 
  LogOut, 
  Settings,
  Menu,
  X
} from "lucide-react";
import { auth } from "@/lib/firebase/client";
import { signOut } from "firebase/auth";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/admin/auth/login");
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/admin/auth/login");
  };

  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/admin/events" },
    { label: "Create Event", icon: PlusCircle, href: "/admin/events/new" },
  ];

  if (loading) return null; // Or a better loading state

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-72 flex-col bg-white border-r border-slate-200">
        <div className="p-8">
          <Link href="/admin/events" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-xl italic">Z</span>
            </div>
            <span className="font-black text-2xl tracking-tighter text-slate-900 italic uppercase">
              Lucky
            </span>
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <button
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
                  pathname === item.href
                    ? "bg-indigo-50 text-indigo-600 shadow-sm shadow-indigo-100"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-rose-500 hover:bg-rose-50 transition-all"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Top Nav */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-slate-200 z-50 px-6 py-4 flex items-center justify-between">
        <span className="font-black text-xl italic uppercase tracking-tighter text-slate-900">Zlucky</span>
        <div className="flex items-center gap-4">
          <button 
            onClick={handleLogout}
            className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-600">
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-white z-40 pt-20 px-6">
          <nav className="space-y-4">
             {navItems.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)}>
                <button className="w-full flex items-center gap-4 py-4 text-lg font-bold text-slate-900 border-b border-slate-50">
                  <item.icon className="w-6 h-6" />
                  {item.label}
                </button>
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-4 py-4 text-lg font-bold text-rose-500"
            >
              <LogOut className="w-6 h-6" />
              Logout
            </button>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 pt-20 md:pt-0 overflow-y-auto">
        <div className="max-w-5xl mx-auto p-6 md:p-12">
          {children}
        </div>
      </main>
    </div>
  );
}
