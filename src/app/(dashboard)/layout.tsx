import { SidebarProvider } from "@/context/SidebarContext";
import { Shell } from "@/components/layout/Shell";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { getMyLeagues } from "@/app/actions/leagues";
import { resolveBrandThemeAction } from "@/app/actions/payments";
import { WelcomeSorteoModal } from "@/components/dashboard/WelcomeSorteoModal";

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
    // Redirige al usuario al paywall/onboarding para activar su liga o crearla si ya pagó
    redirect("/paywall");
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

  // 4. Resolver el tema de marca corporativa en caliente
  const { brandTheme } = await resolveBrandThemeAction();

  // 4.5. Verificar si el usuario actual es un Founder Corporativo (auspiciado por marcas)
  let isCorporate = false;
  let corporateBrandName = null;

  if (user.email) {
    const { data: corpRelation } = await supabase
      .from('corporate_relations')
      .select('brand_id')
      .eq('email', user.email.trim().toLowerCase())
      .maybeSingle();

    if (corpRelation) {
      isCorporate = true;
      try {
        const brandThemes = require('@/data/brand-themes.json');
        corporateBrandName = brandThemes[corpRelation.brand_id]?.name || corpRelation.brand_id;
      } catch (err) {
        console.error("Error al cargar brand themes en layout:", err);
        corporateBrandName = corpRelation.brand_id;
      }
    }
  }

  // 5. Calcular de forma atómica y optimizada el número de liga global para el Sorteo
  let leagueNumber = null;
  const alreadyShown = !!user.user_metadata?.welcome_sorteo_shown;

  if (!alreadyShown) {
    const { data: firstFoundedLeague } = await supabase
      .from('leagues')
      .select('created_at')
      .eq('created_by', user.id)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (firstFoundedLeague) {
      const { count } = await supabase
        .from('leagues')
        .select('id', { count: 'exact', head: true })
        .lte('created_at', firstFoundedLeague.created_at);

      leagueNumber = count;
    }
  }

  return (
    <SidebarProvider brandTheme={brandTheme}>
      <Shell 
        activeLeague={activeLeague} 
        allLeagues={myLeagues}
      >
        {children}
      </Shell>
      <WelcomeSorteoModal 
        leagueNumber={leagueNumber} 
        alreadyShown={alreadyShown} 
        isCorporate={isCorporate}
        corporateBrandName={corporateBrandName}
      />
    </SidebarProvider>
  );
}

