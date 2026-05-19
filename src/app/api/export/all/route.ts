import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { fetchExportForUser } from '@/lib/export/server';

export async function GET() {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: requester } = await supabase
    .from('profiles')
    .select('role, is_active')
    .eq('id', user.id)
    .maybeSingle();

  if (!requester || requester.role !== 'admin' || !requester.is_active) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: students } = await supabase
    .from('profiles')
    .select('id, display_name')
    .eq('role', 'student')
    .order('created_at', { ascending: true });

  const studentList = students ?? [];
  const exports = await Promise.all(
    studentList.map(s => fetchExportForUser(s.id, supabase)),
  );

  return NextResponse.json({
    exportedAt: new Date().toISOString(),
    studentCount: studentList.length,
    students: exports,
  });
}
