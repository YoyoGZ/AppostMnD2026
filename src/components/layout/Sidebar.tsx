"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Home, 
  Trophy, 
  CalendarDays, 
  Settings, 
  User,
  ChevronLeft,
  ChevronRight,
  LogOut
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/context/SidebarContext";

export function Sidebar({ leagueName }: { leagueName?: string }) {
  const { isCollapsed, setIsCollapsed } = useSidebar();
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const navItems = [
    { icon: Home, label: "Dashboard", href: "/dashboard" },
    { icon: CalendarDays, label: "Partidos", href: "/matches" },
    { icon: Trophy, label: "Clasificación", href: "/standings" },
    { icon: User, label: "Perfil", href: "/profile" },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <>
      {/* Mobile Top Header (Muestra la Liga) */}
      <header className="md:hidden fixed top-0 left-0 w-full bg-black/60 backdrop-blur-xl border-b border-white/5 z-50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          <div className="flex flex-col">
            <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Tu Arena</span>
            <span className="text-sm font-bold text-white leading-tight">{leagueName || "Copa Mundial 2026"}</span>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation (Hidden on desktop) */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-black/80 backdrop-blur-3xl border-t border-white/10 z-50 pb-safe">
        <ul className="flex justify-around items-center h-[72px] px-1 overflow-x-hidden">
          {navItems.map((item) => (
            <li key={item.label}>
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center w-full h-full p-1 transition-all duration-300",
                  isActive(item.href) ? "text-primary" : "text-muted-foreground hover:text-primary/70"
                )}
                aria-label={item.label}
              >
                <item.icon className={cn("w-5 h-5 mb-1 transition-transform", isActive(item.href) && "scale-110")} />
                <span className="text-[8px] font-bold uppercase tracking-wider">{item.label}</span>
              </Link>
            </li>
          ))}
          <li className="flex-1 flex justify-center">
            <button
              onClick={handleSignOut}
              className="flex flex-col items-center justify-center w-full h-full p-1 text-red-500/70 hover:text-red-500 transition-all duration-300"
              aria-label="Salir"
            >
              <LogOut className="w-6 h-6 mb-1" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Salir</span>
            </button>
          </li>
        </ul>
      </nav>

      {/* Desktop Sidebar */}
      <aside 
        className={cn(
          "hidden md:flex flex-col fixed left-0 top-0 h-screen border-r border-white/10 bg-sidebar/30 backdrop-blur-3xl z-40 transition-all duration-500 ease-in-out group/sidebar",
          isCollapsed ? "w-20" : "w-64"
        )}
      >
        {/* Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-20 bg-background border border-border/50 rounded-full p-1.5 shadow-xl hover:scale-110 hover:bg-secondary transition-all z-50 opacity-0 group-hover/sidebar:opacity-100"
          aria-label={isCollapsed ? "Expandir" : "Contraer"}
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        <div className={cn(
          "flex items-center h-20 border-b border-border/20 px-6 transition-all",
          isCollapsed && "px-4 justify-center"
        )}>
          <div className="bg-primary/10 p-2 rounded-xl shrink-0">
            <Trophy className="w-7 h-7 text-primary" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col ml-3 overflow-hidden">
              <span className="text-[9px] font-black uppercase tracking-widest text-primary/70">Tu Arena</span>
              <h1 className="text-base font-black tracking-tight text-white truncate">
                {leagueName || "Copa Mundial 2026"}
              </h1>
            </div>
          )}
        </div>
        
        <nav className="flex-1 px-3 py-8 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex items-center rounded-xl transition-all duration-300 group overflow-hidden",
                isCollapsed ? "justify-center p-3" : "px-4 py-3.5",
                isActive(item.href) 
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                  : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5 shrink-0 transition-transform duration-300",
                !isActive(item.href) && "group-hover:scale-110"
              )} />
              {!isCollapsed && (
                <span className="ml-4 font-semibold text-sm whitespace-nowrap">{item.label}</span>
              )}
            </Link>
          ))}
        </nav>
        
        <div className="p-4 border-t border-border/20">
          <Link
            href="/settings"
            className={cn(
              "flex items-center rounded-xl text-muted-foreground hover:bg-secondary/80 hover:text-foreground transition-all",
              isCollapsed ? "justify-center p-3" : "px-4 py-3.5"
            )}
          >
            <Settings className="w-5 h-5 shrink-0" />
            {!isCollapsed && (
              <span className="ml-4 font-semibold text-sm">Configuración</span>
            )}
          </Link>
          
          <button
            onClick={handleSignOut}
            className={cn(
              "w-full mt-2 flex items-center rounded-xl text-red-500/70 hover:bg-red-500/10 hover:text-red-500 transition-all",
              isCollapsed ? "justify-center p-3" : "px-4 py-3.5"
            )}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!isCollapsed && (
              <span className="ml-4 font-semibold text-sm drop-shadow-md">Cerrar Sesión</span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
