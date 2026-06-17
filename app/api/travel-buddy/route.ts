import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const FROM = 'Edge8 <contact@edge8.ai>'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, chapter, event, dates, groupSize, notes, website } = body

    // Honeypot
    if (website) return NextResponse.json({ ok: true })

    if (!name || !email || !chapter || !event) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const to = (process.env.ADMIN_EMAILS ?? 'dave@edge8.ai')
      .split(',').map((e: string) => e.trim()).filter(Boolean)

    // Save to Supabase
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!
    )

    const { data: person, error: peopleError } = await supabase
      .from('people')
      .insert({ name, email, company: chapter, source: 'travel-buddy' })
      .select('id')
      .single()
    if (peopleError) console.error('Supabase people error:', peopleError)

    const { error: inquiryError } = await supabase
      .from('inquiries')
      .insert({
        person_id: person?.id ?? null,
        name,
        email,
        company:   chapter,
        message:   `Event: ${event}\nDates: ${dates || '—'}\nGroup size: ${groupSize || '—'}\nNotes: ${notes || '—'}`,
        source:    'travel-buddy',
      })
    if (inquiryError) console.error('Supabase inquiries error:', inquiryError)

    // Send email via Resend
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: FROM,
      to,
      replyTo: email,
      subject: `Travel Buddy Request — ${name} (${chapter})`,
      html: `
        <h2>New Travel Buddy Inquiry</h2>
        <table style="border-collapse:collapse;width:100%;font-family:sans-serif;font-size:15px">
          <tr><td style="padding:8px 16px 8px 0;color:#666;width:140px">Name</td><td style="padding:8px 0"><strong>${name}</strong></td></tr>
          <tr><td style="padding:8px 16px 8px 0;color:#666">Email</td><td style="padding:8px 0"><a href="mailto:${email}">${email}</a></td></tr>
          <tr><td style="padding:8px 16px 8px 0;color:#666">Chapter</td><td style="padding:8px 0">${chapter}</td></tr>
          <tr><td style="padding:8px 16px 8px 0;color:#666">Event</td><td style="padding:8px 0">${event}</td></tr>
          <tr><td style="padding:8px 16px 8px 0;color:#666">Travel dates</td><td style="padding:8px 0">${dates || '—'}</td></tr>
          <tr><td style="padding:8px 16px 8px 0;color:#666">Group size</td><td style="padding:8px 0">${groupSize || '—'}</td></tr>
          <tr><td style="padding:8px 16px 8px 0;color:#666;vertical-align:top">Notes</td><td style="padding:8px 0">${notes ? notes.replace(/\n/g, '<br>') : '—'}</td></tr>
        </table>
      `,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Travel Buddy form error:', err)
    return NextResponse.json({ error: 'Failed to send' }, { status: 500 })
  }
}
