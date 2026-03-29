import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
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

  const roadmapId = params.id;
  const { source, target } = await request.json();

  if (!source || !target) {
    return new NextResponse(JSON.stringify({ error: 'Missing source or target' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
  }

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

  const { data: newEdge, error } = await supabase
    .from('roadmap_edges')
    .insert({
      roadmap_id: roadmapId,
      source_node_id: source,
      target_node_id: target,
    })
    .select()
    .single();

  if (error) {
    return new NextResponse(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
  }

  return NextResponse.json(newEdge);
}
