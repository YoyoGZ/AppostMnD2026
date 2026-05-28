import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";
import { createLeagueAction } from "@/app/actions/leagues";

// Este endpoint recibe al usuario cuando Mercado Pago lo redirige de vuelta con éxito (back_urls.success)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const leagueName = searchParams.get('league');

  if (!leagueName) {
    return NextResponse.redirect(new URL('/dashboard?error=noleague', request.url));
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    console.log("💳 [MP CALLBACK] Pago aprobado recibido para la liga:", leagueName);
    
    // 1. Instanciar cliente Admin para saltar el RLS y ascenderlo
    const supabaseAdmin = createAdminClient();

    // Obtener max_leagues actual para incrementarlo
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('max_leagues')
      .eq('id', user.id)
      .single();

    const currentMax = profile?.max_leagues || 0;

    const { error: roleError } = await supabaseAdmin
      .from('profiles')
      .update({ 
        role: 'founder',
        max_leagues: currentMax + 1
      })
      .eq('id', user.id);

    if (roleError) throw roleError;

    // 2. Crear la Liga Oficialmente usando la Server Action existente
    const fd = new FormData();
    fd.append('name', leagueName);
    
    const res = await createLeagueAction(fd);
    
    // createLeagueAction lanza un redirect() interno si tiene éxito. 
    // Si no lo hizo, es porque devolvió un error:
    if (res?.error) {
      console.error("Error creando liga post-pago:", res.error);
      return NextResponse.redirect(new URL(`/dashboard?error=${encodeURIComponent(res.error)}`, request.url));
    }

  } catch (error) {
    // Si la excepción es un Redirect de Next.js, lo dejamos pasar porque es el éxito de createLeagueAction
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error;
    }
    console.error("❌ Error en callback MP:", error);
    return NextResponse.redirect(new URL('/dashboard?error=callbackfailed', request.url));
  }

  // Fallback de seguridad
  redirect('/dashboard');
}
