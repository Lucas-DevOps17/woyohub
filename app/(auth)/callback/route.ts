import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const ALLOWED_EMAILS = ["aungkomyat.lucas@gmail.com"];

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Check if the user's email is allowed
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user && !ALLOWED_EMAILS.includes(user.email || "")) {
        // Not allowed — sign them out and redirect with error
        await supabase.auth.signOut();
        return NextResponse.redirect(
          `${origin}/login?error=unauthorized`
        );
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
