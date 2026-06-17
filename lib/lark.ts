// Lark webhook notifications. Reuses the same incoming webhook as the
// CAIO Coach site (LARK_COACHING_WEBHOOK_URL) so all signups land in one
// channel. No-ops silently when the env var is unset.

export async function sendLarkMessage(text: string): Promise<void> {
  const url = process.env.LARK_COACHING_WEBHOOK_URL;
  if (!url) {
    console.warn("[lark] LARK_COACHING_WEBHOOK_URL not set; skipping");
    return;
  }
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        msg_type: "text",
        content: { text },
      }),
    });
  } catch (err) {
    console.error("[lark] send failed", err);
  }
}
