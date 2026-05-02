import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: duels, error: duelsError } = await supabase.from('league_duels').select('*');
  const { data: parts, error: partsError } = await supabase.from('duel_participants').select('*');
  const { data: preds, error: predsError } = await supabase.from('predictions').select('id, match_id, user_id, points_earned');
  
  return NextResponse.json({ duels, duelsError, parts, partsError, preds, predsError });
}
