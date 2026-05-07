import { SidebarProvider } from "@/context/SidebarContext";
import { Shell } from "@/components/layout/Shell";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { getMyLeagues } from "@/app/actions/leagues";

/**
 * Layout exclusivo para rutas protegidas del dashboard.
 * Envuelve el contenido en SidebarProvider + Shell (Sidebar + bg-stadium).
 */

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  // 1. Obtener todas las ligas a las que pertenece el usuario
  const myLeagues = await getMyLeagues();
  const isSuperAdmin = user.user_metadata?.role === 'super_admin';

  if (myLeagues.length === 0 && !isSuperAdmin) {
    // Si no tiene ligas y NO es super admin, lo mandamos al onboarding.
    redirect("/onboarding");
  }

  // 2. Identificar la liga activa desde los metadatos
  let activeLeagueId = user.user_metadata?.active_league_id;
  let activeLeague = myLeagues.find(l => l.id === activeLeagueId);

  // 3. Si no hay liga activa válida y tiene ligas, establecer una por defecto
  if (!activeLeague && myLeagues.length > 0) {
    // Prioridad: la que fundó (isCaptain), sino la primera de la lista
    activeLeague = myLeagues.find(l => l.isCaptain) || myLeagues[0];
    activeLeagueId = activeLeague.id;

    // Actualizar metadatos de forma asíncrona (no bloqueamos el render)
    await supabase.auth.updateUser({
      data: { active_league_id: activeLeagueId }
    });
  }

  return (
    <SidebarProvider>
      <Shell 
        activeLeague={activeLeague} 
        allLeagues={myLeagues}
      >
        {children}
      </Shell>
    </SidebarProvider>
  );
}
