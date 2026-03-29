import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const supabase = createServerSupabaseClient();
  const { data: nodes, error } = await supabase.from("roadmap_nodes").select("*");
  return NextResponse.json({ nodes, error });
}
