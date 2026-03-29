import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";

function createCatalogSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export const getCachedSkillCatalog = unstable_cache(
  async () => {
    const supabase = createCatalogSupabaseClient();
    const { data, error } = await supabase
      .from("skills")
      .select("id, name, icon, category, user_id")
      .is("user_id", null)
      .order("name");

    if (error) {
      throw error;
    }

    return data ?? [];
  },
  ["skill-catalog"],
  { revalidate: 300, tags: ["skills"] }
);

export const getCachedRoadmapCatalog = unstable_cache(
  async () => {
    const supabase = createCatalogSupabaseClient();
    const { data, error } = await supabase.from("roadmaps").select("*").order("title");

    if (error) {
      throw error;
    }

    return data ?? [];
  },
  ["roadmap-catalog"],
  { revalidate: 300, tags: ["roadmaps"] }
);
