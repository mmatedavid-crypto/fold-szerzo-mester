import * as React from "react";
import { render } from "@react-email/components";
import { TEMPLATES } from "@/lib/email-templates/registry";

const SITE_NAME = "Dr Föld";
const SENDER_DOMAIN = "notify.drfold.hu";
const FROM_DOMAIN = "drfold.hu";

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export type EnqueueResult =
  | { status: "queued"; messageId: string }
  | { status: "suppressed"; reason: string }
  | { status: "error"; error: string };

/**
 * Server-side helper: render a registered template and enqueue it into the
 * Lovable transactional email queue. Bypasses HTTP auth — only call from
 * trusted server code (cron hooks, server functions).
 */
export async function enqueueTransactionalEmail(input: {
  templateName: string;
  recipientEmail: string;
  templateData?: Record<string, any>;
  idempotencyKey?: string;
  fromLabel?: string;
}): Promise<EnqueueResult> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const template = TEMPLATES[input.templateName];
  if (!template) return { status: "error", error: `Unknown template: ${input.templateName}` };

  const recipientEmail = template.to ?? input.recipientEmail;
  const normalized = recipientEmail.trim().toLowerCase();
  if (!normalized) return { status: "error", error: "Missing recipient" };

  const messageId = crypto.randomUUID();
  const idempotencyKey = input.idempotencyKey ?? messageId;

  // Suppression check
  const { data: suppressed } = await supabaseAdmin
    .from("suppressed_emails")
    .select("email")
    .eq("email", normalized)
    .maybeSingle();
  if (suppressed) {
    await supabaseAdmin.from("email_send_log").insert({
      message_id: messageId,
      template_name: input.templateName,
      recipient_email: normalized,
      status: "suppressed",
      error_message: "Recipient on suppression list",
    });
    return { status: "suppressed", reason: "on_suppression_list" };
  }

  // Unsubscribe token (create if missing)
  let unsubscribeToken: string | null = null;
  const { data: existingToken } = await supabaseAdmin
    .from("email_unsubscribe_tokens")
    .select("token, used_at")
    .eq("email", normalized)
    .maybeSingle();

  if (existingToken && !existingToken.used_at) {
    unsubscribeToken = existingToken.token;
  } else if (!existingToken) {
    const newToken = generateToken();
    const { error: upErr } = await supabaseAdmin
      .from("email_unsubscribe_tokens")
      .upsert({ email: normalized, token: newToken }, { onConflict: "email" });
    if (upErr) {
      return { status: "error", error: `unsubscribe_token_failed: ${upErr.message}` };
    }
    const { data: stored } = await supabaseAdmin
      .from("email_unsubscribe_tokens")
      .select("token")
      .eq("email", normalized)
      .maybeSingle();
    unsubscribeToken = stored?.token ?? newToken;
  }

  const data = input.templateData ?? {};
  const element = React.createElement(template.component, data);
  const html = await render(element);
  const text = await render(element, { plainText: true });
  const subject =
    typeof template.subject === "function" ? template.subject(data) : template.subject;

  await supabaseAdmin.from("email_send_log").insert({
    message_id: messageId,
    template_name: input.templateName,
    recipient_email: normalized,
    status: "pending",
  });

  const { error: enqErr } = await supabaseAdmin.rpc("enqueue_email", {
    queue_name: "transactional_emails",
    payload: {
      message_id: messageId,
      to: normalized,
      from: `${input.fromLabel ?? SITE_NAME} <noreply@${FROM_DOMAIN}>`,
      sender_domain: SENDER_DOMAIN,
      subject,
      html,
      text,
      purpose: "transactional",
      label: input.templateName,
      idempotency_key: idempotencyKey,
      unsubscribe_token: unsubscribeToken,
      queued_at: new Date().toISOString(),
    },
  });

  if (enqErr) {
    await supabaseAdmin.from("email_send_log").insert({
      message_id: messageId,
      template_name: input.templateName,
      recipient_email: normalized,
      status: "failed",
      error_message: `enqueue_failed: ${enqErr.message}`,
    });
    return { status: "error", error: enqErr.message };
  }

  return { status: "queued", messageId };
}