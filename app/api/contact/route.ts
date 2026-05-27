import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const FROM = 'Edge8 <contact@edge8.ai>'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, company, teamSize, message, website } = body

    // Honeypot
    if (website) return NextResponse.json({ ok: true })

    if (!name || !email || !company) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Recipients — split ADMIN_EMAILS CSV or fall back
    const to = (process.env.ADMIN_EMAILS ?? 'dave@edge8.ai')
      .split(',').map((e: string) => e.trim()).filter(Boolean)

    // 1️⃣ Save to Supabase — same schema as AIO (people + inquiries)
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!
    )

    const { data: person, error: peopleError } = await supabase
      .from('people')
      .insert({ name, email, company, source: 'edge8.ai' })
      .select('id')
      .single()
    if (peopleError) console.error('Supabase people error:', peopleError)

    const { error: inquiryError } = await supabase
      .from('inquiries')
      .insert({
        person_id:  person?.id ?? null,
        name,
        email,
        company,
        team_size:  teamSize || null,
        message:    message  || null,
        source:     'edge8.ai',
      })
    if (inquiryError) console.error('Supabase inquiries error:', inquiryError)

    // 2️⃣ Send email via Resend
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: FROM,
      to,
      replyTo: email,
      subject: `New AI Audit Request — ${name} at ${company}`,
      html: `
        <h2>New AI Audit Request</h2>
        <table style="border-collapse:collapse;width:100%;font-family:sans-serif;font-size:15px">
          <tr><td style="padding:8px 16px 8px 0;color:#666;width:140px">Name</td><td style="padding:8px 0"><strong>${name}</strong></td></tr>
          <tr><td style="padding:8px 16px 8px 0;color:#666">Email</td><td style="padding:8px 0"><a href="mailto:${email}">${email}</a></td></tr>
          <tr><td style="padding:8px 16px 8px 0;color:#666">Company</td><td style="padding:8px 0">${company}</td></tr>
          <tr><td style="padding:8px 16px 8px 0;color:#666">Team size</td><td style="padding:8px 0">${teamSize || '—'}</td></tr>
          <tr><td style="padding:8px 16px 8px 0;color:#666;vertical-align:top">Message</td><td style="padding:8px 0">${message ? message.replace(/\n/g, '<br>') : '—'}</td></tr>
        </table>
      `,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Contact form error:', err)
    return NextResponse.json({ error: 'Failed to send' }, { status: 500 })
  }
}
