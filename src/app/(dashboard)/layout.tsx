import { SidebarProvider } from "@/context/SidebarContext";
import { Shell } from "@/components/layout/Shell";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

/**
 * Layout exclusivo para rutas protegidas del dashboard.
 * Envuelve el contenido en SidebarProvider + Shell (Sidebar + bg-stadium).
 * Si el usuario no tiene liga, es interceptado y enviado a Onboarding.
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

  // Interceptor: ¿Pertenece a alguna liga?
  const { data: membership } = await supabase
    .from('league_members')
    .select('id, leagues(name)')
    .eq('user_id', user.id)
    .single();

  if (!membership) {
    // Lobo Solitario -> Funda tu Arena
    redirect("/onboarding");
  }
  
  const leagueData: any = membership.leagues;
  const leagueName = Array.isArray(leagueData) ? leagueData[0]?.name : leagueData?.name;

  return (
    <SidebarProvider>
      <Shell leagueName={leagueName}>{children}</Shell>
    </SidebarProvider>
  );
}
