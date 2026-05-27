import { Resend } from 'resend'
import { NextRequest, NextResponse } from 'next/server'

const TO = process.env.CONTACT_EMAIL ?? 'anh.pham@edge8.ai'
const FROM = 'Edge8 Contact <contact@edge8.ai>'

export async function POST(req: NextRequest) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const body = await req.json()
    const { name, email, company, teamSize, message, website } = body

    // Honeypot check
    if (website) return NextResponse.json({ ok: true })

    if (!name || !email || !company) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    await resend.emails.send({
      from: FROM,
      to: TO,
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
