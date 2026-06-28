// Lark webhook notifications.

async function postLark(url: string, text: string): Promise<void> {
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ msg_type: "text", content: { text } }),
    });
  } catch (err) {
    console.error("[lark] send failed", err);
  }
}

// Coaching channel — reuses the CAIO Coach incoming webhook
// (LARK_COACHING_WEBHOOK_URL). No-ops silently when unset.
export async function sendLarkMessage(text: string): Promise<void> {
  const url = process.env.LARK_COACHING_WEBHOOK_URL;
  if (!url) {
    console.warn("[lark] LARK_COACHING_WEBHOOK_URL not set; skipping");
    return;
  }
  await postLark(url, text);
}

// Operations channel — every site form submission pings here
// (LARK_OPS_WEBHOOK_URL). No-ops silently when unset.
export async function notifyOps(text: string): Promise<void> {
  const url = process.env.LARK_OPS_WEBHOOK_URL;
  if (!url) {
    console.warn("[lark] LARK_OPS_WEBHOOK_URL not set; skipping ops notice");
    return;
  }
  await postLark(url, text);
}
