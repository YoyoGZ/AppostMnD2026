"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Home, 
  Trophy, 
  CalendarDays, 
  User,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LogOut,
  Crown,
  Swords,
  MessageSquare
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/context/SidebarContext";

import { setActiveLeagueAction } from "@/app/actions/leagues";

export function Sidebar({ 
  activeLeague, 
  allLeagues = []
}: { 
  activeLeague?: { id: string, name: string, isCaptain: boolean },
  allLeagues?: { id: string, name: string, isCaptain: boolean }[]
}) {
  const { isCollapsed, setIsCollapsed, isChatOpen, setIsChatOpen, brandTheme } = useSidebar();
  const [isChangingLeague, setIsChangingLeague] = useState(false);
  const [showSelector, setShowSelector] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (brandTheme?.name) {
      const shown = sessionStorage.getItem(`brand_welcome_shown_${brandTheme.id}`);
      if (!shown) {
        setShowToast(true);
        const timer = setTimeout(() => {
          setShowToast(false);
          sessionStorage.setItem(`brand_welcome_shown_${brandTheme.id}`, "true");
        }, 3500); // Se muestra 3.5 segundos para excelente UX
        return () => clearTimeout(timer);
      }
    }
  }, [brandTheme]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const handleSwitchLeague = async (id: string) => {
    if (id === activeLeague?.id) {
      setShowSelector(false);
      return;
    }
    
    setIsChangingLeague(true);
    const res = await setActiveLeagueAction(id);
    if (res.success) {
      router.refresh();
    }
    setIsChangingLeague(false);
    setShowSelector(false);
  };

  const navItems = [
    { icon: Home, label: "Dashboard", href: "/dashboard" },
    { icon: CalendarDays, label: "Partidos", href: "/matches" },
    { icon: Swords, label: "Eliminatorias", href: "/knockouts" },
    { icon: Trophy, label: "LA LIGA", href: "/standings" },
    { 
      icon: MessageSquare, 
      label: "Chat", 
      onClick: () => setIsChatOpen(!isChatOpen),
      active: isChatOpen
    },
    { icon: User, label: "Perfil", href: "/profile" },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <>
      {/* Toast de bienvenida corporativo para dispositivos móviles */}
      {showToast && brandTheme && (
        <div className="md:hidden fixed top-16 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-sm animate-in fade-in slide-in-from-top-4 duration-500">
          <div 
            className="flex items-center gap-3 p-3 bg-black/90 backdrop-blur-2xl border rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.6)] border-white/10"
            style={{ borderColor: `${brandTheme.accentColor}30` }}
          >
            {brandTheme.logo ? (
              <div className="shrink-0 w-9 h-9 p-1 flex items-center justify-center bg-white/5 border border-white/10 rounded-xl overflow-hidden shadow-inner">
                <img src={brandTheme.logo} alt={brandTheme.name} className="object-contain max-w-full max-h-full" />
              </div>
            ) : (
              <div className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center bg-white/5 border border-white/10">
                <Trophy className="w-5 h-5" style={{ color: brandTheme.accentColor }} />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-black uppercase tracking-wider text-white/30">Portal Corporativo</p>
              <p className="text-xs font-bold text-white leading-normal">
                ¡Bienvenido a la <span style={{ color: brandTheme.accentColor }}>Copa {brandTheme.name}</span>! ⚽
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Top Header (Muestra la Liga + Selector de Acciones) */}
      <header className="md:hidden fixed top-0 left-0 w-full bg-black/60 backdrop-blur-xl border-b border-white/5 z-50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4 w-full">
          {brandTheme?.logo ? (
            <div 
              className="shrink-0 w-16 h-16 flex items-center justify-center bg-transparent transition-all duration-300 relative rounded-xl"
              style={{
                filter: brandTheme.accentColor ? `drop-shadow(0 0 12px ${brandTheme.accentColor}70)` : 'none'
              }}
            >
              <img 
                src={brandTheme.logo} 
                alt={brandTheme.name} 
                className="object-contain object-center max-w-full max-h-full filter brightness-115 drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]" 
              />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center bg-primary/10 border border-primary/20 shadow-[0_0_10px_rgba(251,191,36,0.15)] animate-pulse">
                <Trophy className="w-5 h-5 text-primary" />
              </div>
              <span className="text-sm font-black text-white tracking-tight">
                MundiApp26
              </span>
            </div>
          )}
          
          <div className="flex flex-col gap-1 pl-1">
            <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Acciones</span>
            <div className="flex items-center">
              {allLeagues.length >= 1 && (
                <select 
                  className="bg-black/45 border border-white/10 rounded-xl px-3 py-1.5 text-[11px] font-black uppercase tracking-wider focus:outline-none transition-all cursor-pointer"
                  style={{ 
                    color: brandTheme?.accentColor || '#facc15',
                    borderColor: brandTheme?.accentColor ? `${brandTheme.accentColor}30` : 'rgba(250,204,21,0.2)'
                  }}
                  onChange={async (e) => {
                    const val = e.target.value;
                    if (val === "__create__") {
                      router.push("/paywall");
                    } else if (val === "__join__") {
                      const code = prompt("¡Te invitaron a una Liga! Copiá y pegá acá el Código de Invitación de 6 caracteres que te compartieron (ej: BSLJ4Z):");
                      if (code && code.trim()) {
                        const { joinLeagueAction } = await import("@/app/actions/leagues");
                        const res = await joinLeagueAction(code.trim());
                        if (res && res.error) {
                          alert(res.error);
                        }
                      }
                    } else {
                      handleSwitchLeague(val);
                    }
                  }}
                  value={activeLeague?.id}
                >
                  {allLeagues.map(l => (
                    <option key={l.id} value={l.id} className="bg-black text-white">{l.name}</option>
                  ))}
                  <option value="__create__" className="bg-black text-primary font-bold">➕ Fundar Liga</option>
                  <option value="__join__" className="bg-black text-white font-bold">⚔️ Unirse a Liga</option>
                </select>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation (Hidden on desktop) */}
      <nav 
        className={cn(
          "md:hidden fixed bottom-0 left-0 w-full backdrop-blur-3xl border-t z-50 pb-safe transition-all duration-500",
          brandTheme?.sidebarBg ? brandTheme.sidebarBg : "bg-black/80 border-white/10"
        )}
        style={brandTheme?.accentColor ? { borderTopColor: `${brandTheme.accentColor}30` } : undefined}
      >
        <ul className="flex justify-around items-center h-[72px] px-1 overflow-x-hidden">
          {navItems.map((item) => {
            const isMenuMobileActive = isActive(item.href || '') || item.active;
            const content = (
              <>
                <item.icon 
                  className={cn("w-5 h-5 mb-1 transition-transform duration-300", isMenuMobileActive && "scale-110")} 
                  style={isMenuMobileActive ? { filter: `drop-shadow(0 0 5px ${brandTheme?.accentColor || '#fbbf24'}80)` } : undefined}
                />
                <span className="text-[8px] font-bold uppercase tracking-wider">{item.label}</span>
              </>
            );

            const activeMobileStyle = isMenuMobileActive ? { 
              color: brandTheme?.accentColor || '#fbbf24',
              textShadow: brandTheme?.accentColor ? `0 0 10px ${brandTheme.accentColor}30` : '0 0 10px rgba(251,191,36,0.2)'
            } : undefined;

            return (
              <li key={item.label}>
                {item.href ? (
                  <Link
                    href={item.href}
                    className={cn(
                      "flex flex-col items-center justify-center w-full h-full p-1 transition-all duration-300",
                      !isMenuMobileActive && "text-muted-foreground hover:text-primary/70"
                    )}
                    style={activeMobileStyle}
                    aria-label={item.label}
                  >
                    {content}
                  </Link>
                ) : (
                  <button
                    onClick={item.onClick}
                    className={cn(
                      "flex flex-col items-center justify-center w-full h-full p-1 transition-all duration-300",
                      !isMenuMobileActive && "text-muted-foreground hover:text-primary/70"
                    )}
                    style={activeMobileStyle}
                    aria-label={item.label}
                  >
                    {content}
                  </button>
                )}
              </li>
            );
          })}
          <li className="flex-1 flex justify-center">
            <button
              onClick={handleSignOut}
              className="flex flex-col items-center justify-center w-full h-full p-1 text-red-500/70 hover:text-red-500 transition-all duration-300"
              aria-label="Salir"
            >
              <LogOut className="w-5 h-5 mb-1" />
              <span className="text-[8px] font-bold uppercase tracking-wider">Salir</span>
            </button>
          </li>
        </ul>
      </nav>

      {/* Desktop Sidebar */}
      <aside 
        className={cn(
          "hidden md:flex flex-col fixed left-0 top-0 h-screen border-r border-white/10 z-40 transition-all duration-500 ease-in-out group/sidebar",
          brandTheme?.sidebarBg ? brandTheme.sidebarBg : "bg-sidebar/30 backdrop-blur-3xl",
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
          "flex flex-col border-b border-border/20 transition-all relative",
          isCollapsed ? "px-4 py-4 items-center gap-2" : "px-6 py-5 gap-5"
        )}>
          {/* Fila del Logotipo (Arriba) */}
          <div className={cn("flex w-full", isCollapsed ? "justify-center" : "justify-center")}>
            {brandTheme?.logo ? (
              isCollapsed ? (
                /* Logo Colapsado (Formato Cuadrado con Brillo) */
                <div 
                  className="shrink-0 w-11 h-11 p-1.5 flex items-center justify-center bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.4)] transition-all duration-300"
                  style={{ 
                    borderColor: brandTheme.accentColor ? `${brandTheme.accentColor}30` : 'rgba(255,255,255,0.1)',
                    boxShadow: brandTheme.accentColor ? `0 0 15px ${brandTheme.accentColor}20` : undefined,
                    filter: brandTheme.accentColor ? `drop-shadow(0 0 6px ${brandTheme.accentColor}60)` : 'none'
                  }}
                >
                  <img src={brandTheme.logo} alt={brandTheme.name} className="object-contain max-w-full max-h-full filter brightness-110" />
                </div>
              ) : (
                /* Logo Expandido Centrado (Banner Corporativo Premium con volumen) */
                <div 
                  className="w-full h-24 flex items-center justify-center bg-transparent transition-all duration-300 relative rounded-xl"
                  style={{
                    filter: brandTheme.accentColor ? `drop-shadow(0 0 16px ${brandTheme.accentColor}75)` : 'none'
                  }}
                >
                  <img 
                    src={brandTheme.logo} 
                    alt={brandTheme.name} 
                    className="object-contain object-center max-w-full max-h-full filter brightness-115 drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]" 
                  />
                </div>
              )
            ) : (
              /* Logo por Defecto */
              isCollapsed ? (
                <div className="bg-primary/10 p-2 rounded-xl shrink-0 border border-primary/15 shadow-[0_0_12px_rgba(251,191,36,0.1)] animate-pulse">
                  <Trophy className="w-6 h-6 text-primary" />
                </div>
              ) : (
                <div className="flex items-center gap-3 w-full animate-in fade-in duration-300">
                  <div className="bg-primary/10 p-2.5 rounded-xl shrink-0 border border-primary/20 shadow-[0_0_15px_rgba(251,191,36,0.15)] animate-pulse">
                    <Trophy className="w-6 h-6 text-primary" />
                  </div>
                  <span className="text-xl font-black tracking-tight text-white leading-none">
                    MundiApp26
                  </span>
                </div>
              )
            )}
          </div>

          {/* Fila de Acciones y Nombre de la Liga (Abajo - Solo si no está colapsado) */}
          {!isCollapsed && (
            <div className="flex flex-col w-full overflow-hidden animate-in fade-in duration-300">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] mb-1.5 transition-all" style={{ color: brandTheme?.accentColor || '#fbbf24' }}>
                Acciones
              </span>
              <div 
                className={cn(
                  "flex items-center justify-between gap-2 cursor-pointer w-full mt-2 px-3 py-2.5 rounded-xl transition-all duration-300 border bg-white/[0.02] shadow-inner",
                  showSelector 
                    ? "border-primary/40 bg-primary/5 shadow-[0_0_15px_rgba(250,204,21,0.05)]" 
                    : "border-white/5 hover:border-white/20 hover:bg-white/[0.06]"
                )}
                style={showSelector && brandTheme?.accentColor ? { borderColor: `${brandTheme.accentColor}40`, backgroundColor: `${brandTheme.accentColor}08` } : undefined}
                onClick={() => setShowSelector(!showSelector)}
              >
                <h1 className="text-sm font-black tracking-tight text-white truncate flex-1 leading-tight">
                  {activeLeague?.name || "MundiApp26"}
                </h1>
                <ChevronDown 
                  className={cn(
                    "w-4 h-4 transition-all duration-500 ease-out text-primary shrink-0", 
                    showSelector ? "rotate-180 text-white" : "animate-pulse"
                  )} 
                  style={!showSelector ? { 
                    color: brandTheme?.accentColor || '#facc15',
                    filter: `drop-shadow(0 0 5px ${brandTheme?.accentColor || '#facc15'}80)` 
                  } : undefined}
                />
              </div>
            </div>
          )}
        </div>

        {/* Selector de Ligas (Desktop Dropdown) */}
        {!isCollapsed && showSelector && (
          <div className="absolute top-[165px] left-0 w-full px-4 py-2 z-50">
            <div className="bg-black/95 backdrop-blur-3xl border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
              {allLeagues.length > 0 && allLeagues.map((league) => (
                <button
                  key={league.id}
                  onClick={() => handleSwitchLeague(league.id)}
                  disabled={isChangingLeague}
                  className={cn(
                    "w-full px-4 py-3 text-left text-xs font-bold transition-all hover:bg-primary/10 flex items-center justify-between border-b border-white/[0.05]",
                    league.id === activeLeague?.id ? "text-primary" : "text-white/60 hover:text-white"
                  )}
                  style={league.id === activeLeague?.id && brandTheme?.accentColor ? { color: brandTheme.accentColor } : undefined}
                >
                  <span className="truncate">{league.name}</span>
                  {league.isCaptain && <Crown className="w-3 h-3 text-yellow-500" />}
                </button>
              ))}
                
                {/* Acciones de Liga Bento */}
                <div className="p-1.5 bg-white/[0.02] flex flex-col gap-1">
                  <Link
                    href="/paywall"
                    onClick={() => setShowSelector(false)}
                    className="w-full px-3 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/10 rounded-lg flex items-center gap-2 transition-all"
                    style={brandTheme?.accentColor ? { color: brandTheme.accentColor } : undefined}
                  >
                    <Trophy className="w-3.5 h-3.5 shrink-0" />
                    <span>Fundar nueva Liga</span>
                  </Link>
                  
                  <button
                    onClick={async () => {
                      setShowSelector(false);
                      const code = prompt("Ingresá el Código de Invitación de la Liga a la que querés unirte:");
                      if (code && code.trim()) {
                        const { joinLeagueAction } = await import("@/app/actions/leagues");
                        const res = await joinLeagueAction(code.trim());
                        if (res && res.error) {
                          alert(res.error);
                        }
                      }
                    }}
                    className="w-full px-3 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-slate-300 hover:bg-white/5 rounded-lg flex items-center gap-2 transition-all"
                  >
                    <Swords className="w-3.5 h-3.5 shrink-0" />
                    <span>Unirme a otra Liga</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        
        <nav className="flex-1 px-3 py-8 space-y-2">
          {navItems.map((item) => {
            const isItemActive = isActive(item.href || '') || item.active;
            const commonClasses = cn(
              "flex items-center rounded-xl transition-all duration-300 group overflow-hidden w-full",
              isCollapsed ? "justify-center p-3" : "px-4 py-3.5",
              !isItemActive && "text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
            );

            const content = (
              <>
                <item.icon className={cn(
                  "w-5 h-5 shrink-0 transition-transform duration-300",
                  !isItemActive && "group-hover:scale-110"
                )} />
                {!isCollapsed && (
                  <span className="ml-4 font-semibold text-sm whitespace-nowrap">{item.label}</span>
                )}
              </>
            );

            const activeStyle = isItemActive ? {
              backgroundColor: brandTheme?.accentColor || '#fbbf24',
              color: '#000000', // Alto contraste
              boxShadow: `0 10px 15px -3px ${brandTheme?.accentColor ? `${brandTheme.accentColor}30` : 'rgba(251,191,36,0.2)'}`
            } : undefined;

            return item.href ? (
              <Link key={item.label} href={item.href} className={commonClasses} style={activeStyle}>
                {content}
              </Link>
            ) : (
              <button key={item.label} onClick={item.onClick} className={commonClasses} style={activeStyle}>
                {content}
              </button>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-border/20">
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

