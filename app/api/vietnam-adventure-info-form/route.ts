import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

export const runtime = 'nodejs'

const FROM = 'Edge8 Adventures <contact@edge8.ai>'
const DEFAULT_NOTIFY = 'accounting@edge8.ai'
const MAX_PASSPORT_BYTES = 10 * 1024 * 1024
const SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL']
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
const EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
}

function isEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)
}

function esc(s: string): string {
  return s.replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c] as string))
}

type MemberRow = {
  full_name: string
  tshirt_size: string
  passport_path: string | null
  signedUrl: string | null
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()

    // honeypot
    if (String(form.get('website') ?? '')) return NextResponse.json({ ok: true })

    const family_name = String(form.get('family_name') ?? '').trim()
    const contact_name = String(form.get('contact_name') ?? '').trim()
    const contact_email = String(form.get('contact_email') ?? '').trim()
    const contact_phone = String(form.get('contact_phone') ?? '').trim() || null

    if (!family_name || !contact_name || !contact_email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    if (!isEmail(contact_email)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }

    const memberCount = Number(form.get('member_count') ?? 0)
    if (!Number.isInteger(memberCount) || memberCount < 1 || memberCount > 25) {
      return NextResponse.json({ error: 'Please add at least one family member' }, { status: 400 })
    }

    // Parse and validate members before any DB writes.
    type ParsedMember = { full_name: string; tshirt_size: string; passport: File | null }
    const members: ParsedMember[] = []
    for (let i = 0; i < memberCount; i++) {
      const full_name = String(form.get(`member_name_${i}`) ?? '').trim()
      const tshirt_size = String(form.get(`member_size_${i}`) ?? '').trim()
      if (!full_name || !tshirt_size) {
        return NextResponse.json({ error: 'Each member needs a name and t-shirt size' }, { status: 400 })
      }
      if (!SIZES.includes(tshirt_size)) {
        return NextResponse.json({ error: `Invalid t-shirt size: ${tshirt_size}` }, { status: 400 })
      }
      const passport = form.get(`member_passport_${i}`)
      let file: File | null = null
      if (passport instanceof File && passport.size > 0) {
        if (!ALLOWED_TYPES.includes(passport.type)) {
          return NextResponse.json({ error: 'Passport must be a JPG, PNG, WEBP or PDF' }, { status: 400 })
        }
        if (passport.size > MAX_PASSPORT_BYTES) {
          return NextResponse.json({ error: 'Passport file is too large (max 10 MB)' }, { status: 400 })
        }
        file = passport
      }
      members.push({ full_name, tshirt_size, passport: file })
    }

    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!)

    // 1) Insert family
    const { data: family, error: familyErr } = await supabase
      .from('trip_families')
      .insert({ family_name, contact_name, contact_email, contact_phone })
      .select('id')
      .single()
    if (familyErr || !family) {
      console.error('Family insert error:', familyErr)
      return NextResponse.json({ error: 'Failed to save submission' }, { status: 500 })
    }

    // 2) For each member: upload passport (if any), then insert member row.
    const rows: MemberRow[] = []
    for (const m of members) {
      const member_id = randomUUID()
      let passport_path: string | null = null
      let signedUrl: string | null = null

      if (m.passport) {
        const ext = EXT[m.passport.type] ?? 'bin'
        passport_path = `${family.id}/${member_id}.${ext}`
        const buffer = Buffer.from(await m.passport.arrayBuffer())
        const { error: upErr } = await supabase.storage
          .from('passports')
          .upload(passport_path, buffer, { contentType: m.passport.type, upsert: false })
        if (upErr) {
          console.error('Passport upload error:', upErr)
          return NextResponse.json({ error: 'Failed to upload a passport photo' }, { status: 500 })
        }
        const { data: signed } = await supabase.storage
          .from('passports')
          .createSignedUrl(passport_path, 60 * 60 * 24 * 7)
        signedUrl = signed?.signedUrl ?? null
      }

      const { error: memberErr } = await supabase.from('trip_members').insert({
        id: member_id,
        family_id: family.id,
        full_name: m.full_name,
        tshirt_size: m.tshirt_size,
        passport_path,
      })
      if (memberErr) {
        console.error('Member insert error:', memberErr)
        return NextResponse.json({ error: 'Failed to save a family member' }, { status: 500 })
      }
      rows.push({ full_name: m.full_name, tshirt_size: m.tshirt_size, passport_path, signedUrl })
    }

    const passportCount = rows.filter((r) => r.passport_path).length

    // 3) Notify accounting via Resend (best-effort)
    const notifyTo = (process.env.TRIP_NOTIFY_EMAIL ?? DEFAULT_NOTIFY)
      .split(',')
      .map((e) => e.trim())
      .filter(Boolean)
    const apiKey = process.env.RESEND_API_KEY
    if (apiKey) {
      try {
        const resend = new Resend(apiKey)
        const memberRowsHtml = rows
          .map(
            (r) =>
              `<tr><td style="padding:4px 16px 4px 0">${esc(r.full_name)}</td><td style="padding:4px 16px 4px 0">${r.tshirt_size}</td><td>${
                r.signedUrl ? `<a href="${r.signedUrl}">View passport (7-day link)</a>` : '—'
              }</td></tr>`,
          )
          .join('')
        await resend.emails.send({
          from: FROM,
          to: notifyTo,
          replyTo: contact_email,
          subject: `Vietnam Adventure form: ${family_name} (${rows.length} traveler${rows.length === 1 ? '' : 's'})`,
          html: `
            <h2>New Vietnam Adventure submission</h2>
            <table style="border-collapse:collapse;font-family:sans-serif;font-size:15px;margin-bottom:16px">
              <tr><td style="padding:6px 16px 6px 0;color:#666">Family</td><td><strong>${esc(family_name)}</strong></td></tr>
              <tr><td style="padding:6px 16px 6px 0;color:#666">Contact</td><td>${esc(contact_name)}</td></tr>
              <tr><td style="padding:6px 16px 6px 0;color:#666">Email</td><td><a href="mailto:${esc(contact_email)}">${esc(contact_email)}</a></td></tr>
              <tr><td style="padding:6px 16px 6px 0;color:#666">Phone</td><td>${contact_phone ? esc(contact_phone) : '—'}</td></tr>
              <tr><td style="padding:6px 16px 6px 0;color:#666">Passports</td><td>${passportCount} of ${rows.length}</td></tr>
            </table>
            <table style="border-collapse:collapse;font-family:sans-serif;font-size:14px">
              <tr><th align="left" style="padding:4px 16px 4px 0">Name</th><th align="left" style="padding:4px 16px 4px 0">Size</th><th align="left">Passport</th></tr>
              ${memberRowsHtml}
            </table>
            <p style="color:#999;font-size:12px;margin-top:16px">Passport links expire after 7 days. Photos are auto-deleted within 30 days of the trip.</p>
          `,
        })
      } catch (mailErr) {
        console.error('Resend error:', mailErr)
      }
    }

    // 4) Notify Lark via incoming webhook (best-effort; skipped if not configured)
    const larkUrl = process.env.LARK_WEBHOOK_URL
    if (larkUrl) {
      try {
        const text = `🌏 Vietnam Adventure form submitted\nFamily: ${family_name}\nContact: ${contact_name} <${contact_email}>\nTravelers: ${rows.length} | Passports: ${passportCount}/${rows.length}`
        await fetch(larkUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ msg_type: 'text', content: { text } }),
        })
      } catch (larkErr) {
        console.error('Lark webhook error:', larkErr)
      }
    }

    return NextResponse.json({ ok: true, family_id: family.id })
  } catch (err) {
    console.error('Vietnam Adventure form error:', err)
    return NextResponse.json({ error: 'Failed to submit' }, { status: 500 })
  }
}
