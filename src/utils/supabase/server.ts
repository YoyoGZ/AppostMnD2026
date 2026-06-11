import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ CRITICAL: Supabase environment variables are missing!");
    throw new Error("Supabase configuration missing");
  }

  return createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              const adjustedOptions = { ...options };
              if (process.env.NODE_ENV === 'development') {
                adjustedOptions.secure = false;
                adjustedOptions.sameSite = 'lax';
              }
              cookieStore.set(name, value, adjustedOptions);
            });
          } catch {
            // Ignore if called from Server Component
          }
        },
      },
    }
  )
}
