import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  // Usamos el cliente genérico solo para tocar la DB
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Hacemos una consulta ultra ligera (ej: contar grupos)
  const { count, error } = await supabase
    .from('groups')
    .select('*', { count: 'exact', head: true });

  if (error) {
    return NextResponse.json({ status: 'error', error: error.message }, { status: 500 });
  }

  return NextResponse.json({ status: 'alive', time: new Date().toISOString() });
}
