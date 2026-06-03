import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

export const runtime = 'nodejs'

const FROM = 'Edge8 Careers <contact@edge8.ai>'
const DEFAULT_RECIPIENTS = ['mai@edge8.ai']
const MAX_RESUME_BYTES = 10 * 1024 * 1024

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80)
}

function isEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()

    const website = String(form.get('website') ?? '')
    if (website) return NextResponse.json({ ok: true }) // honeypot

    const job_id = String(form.get('job_id') ?? '')
    const job_title = String(form.get('job_title') ?? '')
    const job_slug = String(form.get('job_slug') ?? '')
    const full_name = String(form.get('full_name') ?? '').trim()
    const email = String(form.get('email') ?? '').trim()
    const phone = String(form.get('phone') ?? '').trim() || null
    const linkedin = String(form.get('linkedin') ?? '').trim() || null
    const resume = form.get('resume')

    if (!job_id || !full_name || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    if (!isEmail(email)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }
    if (!(resume instanceof File) || resume.size === 0) {
      return NextResponse.json({ error: 'Resume file is required' }, { status: 400 })
    }
    if (resume.size > MAX_RESUME_BYTES) {
      return NextResponse.json({ error: 'Resume is too large (max 10 MB)' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!,
    )

    // 1) Upload resume to private storage bucket
    const filename = sanitizeFilename(resume.name || 'resume.pdf')
    const storagePath = `${job_id}/${randomUUID()}-${filename}`
    const buffer = Buffer.from(await resume.arrayBuffer())
    const { error: uploadErr } = await supabase.storage
      .from('resumes')
      .upload(storagePath, buffer, {
        contentType: resume.type || 'application/octet-stream',
        upsert: false,
      })
    if (uploadErr) {
      console.error('Resume upload error:', uploadErr)
      return NextResponse.json({ error: 'Failed to upload resume' }, { status: 500 })
    }

    // 2) Insert applicant
    const { data: applicant, error: applicantErr } = await supabase
      .from('job_applicants')
      .insert({
        full_name,
        email,
        phone,
        linkedin,
        source: 'edge8.ai/careers',
        resume: storagePath,
      })
      .select('id')
      .single()
    if (applicantErr || !applicant) {
      console.error('Applicant insert error:', applicantErr)
      return NextResponse.json({ error: 'Failed to save applicant' }, { status: 500 })
    }

    // 3) Link application to job
    const { error: applicationErr } = await supabase.from('job_applications').insert({
      job_id,
      applicant_id: applicant.id,
    })
    if (applicationErr) {
      console.error('Application insert error:', applicationErr)
      // Applicant row exists; treat as soft failure but inform the user
      return NextResponse.json({ error: 'Failed to link application' }, { status: 500 })
    }

    // 4) Signed URL for recruiter convenience (7 days)
    const { data: signed } = await supabase.storage
      .from('resumes')
      .createSignedUrl(storagePath, 60 * 60 * 24 * 7)

    // 5) Notify recruiters via Resend (best-effort)
    const adminEmails = (process.env.ADMIN_EMAILS ?? '')
      .split(',')
      .map((e) => e.trim())
      .filter(Boolean)
    const recipients = Array.from(new Set([...DEFAULT_RECIPIENTS, ...adminEmails]))
    const apiKey = process.env.RESEND_API_KEY
    if (apiKey) {
      try {
        const resend = new Resend(apiKey)
        await resend.emails.send({
          from: FROM,
          to: recipients,
          replyTo: email,
          subject: `New application: ${job_title || 'role'} — ${full_name}`,
          html: `
            <h2>New job application</h2>
            <table style="border-collapse:collapse;font-family:sans-serif;font-size:15px">
              <tr><td style="padding:6px 16px 6px 0;color:#666">Role</td><td><strong>${job_title}</strong> (${job_slug})</td></tr>
              <tr><td style="padding:6px 16px 6px 0;color:#666">Applicant</td><td>${full_name}</td></tr>
              <tr><td style="padding:6px 16px 6px 0;color:#666">Email</td><td><a href="mailto:${email}">${email}</a></td></tr>
              <tr><td style="padding:6px 16px 6px 0;color:#666">Phone</td><td>${phone ?? '—'}</td></tr>
              <tr><td style="padding:6px 16px 6px 0;color:#666">LinkedIn</td><td>${linkedin ? `<a href="${linkedin}">${linkedin}</a>` : '—'}</td></tr>
              <tr><td style="padding:6px 16px 6px 0;color:#666">Resume</td><td>${signed?.signedUrl ? `<a href="${signed.signedUrl}">Download (7-day link)</a>` : storagePath}</td></tr>
              <tr><td style="padding:6px 16px 6px 0;color:#666">Applicant ID</td><td><code>${applicant.id}</code></td></tr>
            </table>
          `,
        })
      } catch (mailErr) {
        console.error('Resend error:', mailErr)
      }
    }

    return NextResponse.json({ ok: true, applicant_id: applicant.id })
  } catch (err) {
    console.error('Apply route error:', err)
    return NextResponse.json({ error: 'Failed to submit' }, { status: 500 })
  }
}
