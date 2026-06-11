import { createBrowserClient } from '@supabase/ssr'

let client: ReturnType<typeof createBrowserClient> | undefined;

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Supabase environment variables are missing!");
  }

  // En el servidor (SSR pre-rendering), generamos una nueva instancia en cada llamada
  if (typeof window === 'undefined') {
    return createBrowserClient(
      supabaseUrl!,
      supabaseKey!
    )
  }

  // En el cliente (navegador), garantizamos una única instancia global (Singleton)
  if (!client) {
    const cookieOptions: any = {};
    if (process.env.NODE_ENV === 'development') {
      cookieOptions.secure = false;
      cookieOptions.sameSite = 'lax';
    }

    client = createBrowserClient(
      supabaseUrl!,
      supabaseKey!,
      {
        cookieOptions
      }
    );
  }

  return client;
}


