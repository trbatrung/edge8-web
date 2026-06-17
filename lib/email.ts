import { Resend } from "resend";

// Resend wrapper. Silently no-ops if RESEND_API_KEY is absent. Preview
// environments and local dev should never hard-fail on email send.

const resendApiKey = process.env.RESEND_API_KEY;
const emailFrom = process.env.EMAIL_FROM || "Edge8 <notifications@edge8.ai>";

const resend = resendApiKey ? new Resend(resendApiKey) : null;

export async function sendTransactionalEmail(opts: {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<void> {
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set, skipping send to", opts.to);
    return;
  }

  const { error } = await resend.emails.send({
    from: emailFrom,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    ...(opts.replyTo ? { replyTo: opts.replyTo } : {}),
  });

  if (error) {
    console.error("[email] send failed:", error);
  }
}

// Customer-facing email when they reserve a Saigon seat with the
// offline_vn (bank transfer) flow. Mirrors aio-website's
// sendRetreatReservedEmail copy and includes the Edge8 AI bank details.
export async function sendOfflineReservedEmail(opts: {
  to: string;
  name: string | null;
  eventTitle: string;
  city: string;
  dateLabel: string;
  tierName: string;
  priceLabel: string;
  priceSub: string;
}): Promise<void> {
  const greetingName =
    opts.name && opts.name.trim().length > 0 ? opts.name.split(" ")[0] : "there";
  const transferRef = `Infinite Leverage ${opts.dateLabel}`;
  const html = `
    <p>Hi ${greetingName},</p>
    <p>Thanks for reserving your seat at the <strong>${opts.eventTitle}</strong> in ${opts.city}, ${opts.dateLabel}, 2026. You picked the <strong>${opts.tierName}</strong> tier (${opts.priceLabel} ${opts.priceSub}).</p>
    <p>Use the bank details below to make your transfer. Our accountant will be in touch to arrange the official red invoice (hóa đơn đỏ) once your transfer arrives.</p>

    <table cellpadding="0" cellspacing="0" border="0" style="margin-top:16px;border:1px solid #e2e8f0;border-radius:12px;width:100%;max-width:520px;">
      <tr><td style="padding:14px 18px;border-bottom:1px solid #f1f5f9;"><div style="font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#64748b;">Bank</div><div style="font-size:15px;font-weight:600;color:#04102D;margin-top:2px;">Techcombank</div></td></tr>
      <tr><td style="padding:14px 18px;border-bottom:1px solid #f1f5f9;"><div style="font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#64748b;">Account name</div><div style="font-size:15px;font-weight:600;color:#04102D;margin-top:2px;font-family:monospace;">VND-TGTT-CONG TY TNHH EDGE8 AI</div></td></tr>
      <tr><td style="padding:14px 18px;border-bottom:1px solid #f1f5f9;"><div style="font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#64748b;">Account number</div><div style="font-size:15px;font-weight:600;color:#04102D;margin-top:2px;font-family:monospace;">19039972294017</div></td></tr>
      <tr><td style="padding:14px 18px;"><div style="font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#64748b;">Transfer reference</div><div style="font-size:15px;font-weight:600;color:#04102D;margin-top:2px;">${transferRef}</div></td></tr>
    </table>

    <p style="margin-top:20px;">If you use a Vietnamese banking app, scan this QR to pre-fill the transfer:</p>
    <p><img src="https://img.vietqr.io/image/TCB-19039972294017-compact2.png?accountName=CONG+TY+TNHH+EDGE8+AI&addInfo=${encodeURIComponent(transferRef)}" alt="Techcombank VietQR" width="240" style="border-radius:8px;background:#f8fafc;padding:8px;"></p>

    <p style="margin-top:20px;"><strong>Important:</strong> your seat is held for 7 days. If payment isn&rsquo;t received by then, we release it to other applicants.</p>

    <h3 style="margin-top:24px;font-size:16px;">A few things to set up</h3>
    <ol style="padding-left:20px;line-height:1.6;">
      <li><strong>Book travel.</strong> Fly into Tan Son Nhat (SGN), the international airport for Saigon. If you&rsquo;re coming from outside Vietnam, apply for a Vietnam eVisa online (allow about 3 business days).</li>
      <li style="margin-top:10px;"><strong>Add Dave on WhatsApp</strong> for direct logistics: <a href="https://wa.me/84909958581">+84 90 995 8581</a>.</li>
    </ol>
    <p style="margin-top:24px;">Reply to this email any time, or write to quan@edge8.ai.</p>
    <p>Dave and the AI Officer team</p>
  `.trim();

  await sendTransactionalEmail({
    to: opts.to,
    subject: `Seat reserved: ${opts.eventTitle}`,
    html,
    replyTo: "quan@edge8.ai",
  });
}
