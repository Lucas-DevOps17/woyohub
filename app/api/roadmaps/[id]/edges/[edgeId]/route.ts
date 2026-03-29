import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string, edgeId: string } }
) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { id: roadmapId, edgeId } = params;

  // Check if user is owner of the roadmap
  const { data: roadmap, error: roadmapError } = await supabase
    .from('roadmaps')
    .select('user_id')
    .eq('id', roadmapId)
    .single();

  if (roadmapError || !roadmap) {
    return new NextResponse(JSON.stringify({ error: 'Roadmap not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
  }

  if (roadmap.user_id !== user.id) {
    return new NextResponse(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
  }

  const { error } = await supabase
    .from('roadmap_edges')
    .delete()
    .eq('id', edgeId);

  if (error) {
    return new NextResponse(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
  }

  return new NextResponse(null, { status: 204 });
}
