import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

// Deletes all passport images once we are past TRIP_END_DATE + 30 days, fulfilling
// the "deleted within 30 days of the trip" promise on the form. Triggered by the
// Vercel cron defined in vercel.json. Until the cutoff passes it is a no-op.
export async function GET(req: NextRequest) {
  // Vercel cron sends `Authorization: Bearer <CRON_SECRET>` when CRON_SECRET is set.
  const secret = process.env.CRON_SECRET
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const tripEnd = process.env.TRIP_END_DATE // e.g. "2026-08-15"
  if (!tripEnd) {
    return NextResponse.json({ ok: true, skipped: 'TRIP_END_DATE not set' })
  }

  const cutoff = new Date(tripEnd)
  cutoff.setDate(cutoff.getDate() + 30)
  if (Number.isNaN(cutoff.getTime())) {
    return NextResponse.json({ error: 'Invalid TRIP_END_DATE' }, { status: 500 })
  }
  if (new Date() < cutoff) {
    return NextResponse.json({ ok: true, skipped: 'before cutoff', purgeOn: cutoff.toISOString() })
  }

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!)

  // Collect every stored passport path, delete the objects, then null the columns.
  const { data: rows, error: selErr } = await supabase
    .from('trip_members')
    .select('id, passport_path')
    .not('passport_path', 'is', null)
  if (selErr) {
    console.error('Cleanup select error:', selErr)
    return NextResponse.json({ error: 'Failed to read members' }, { status: 500 })
  }

  const paths = (rows ?? []).map((r) => r.passport_path as string)
  if (paths.length === 0) {
    return NextResponse.json({ ok: true, deleted: 0 })
  }

  const { error: rmErr } = await supabase.storage.from('passports').remove(paths)
  if (rmErr) {
    console.error('Cleanup storage remove error:', rmErr)
    return NextResponse.json({ error: 'Failed to delete passport files' }, { status: 500 })
  }

  const { error: updErr } = await supabase
    .from('trip_members')
    .update({ passport_path: null })
    .not('passport_path', 'is', null)
  if (updErr) {
    console.error('Cleanup update error:', updErr)
    return NextResponse.json({ error: 'Files deleted but failed to clear paths' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, deleted: paths.length })
}
