import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { RECEIPT_CATEGORIES, RECEIPT_PROMPT, validateReceiptData, type ReceiptData } from "./receipt-data";

export const parseReceipt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { image: string }) => {
    if (typeof input?.image !== "string" || !input.image.startsWith("data:image/")) throw new Error("Please upload an image");
    if (input.image.length > 9_000_000) throw new Error("Image is too large");
    return input;
  })
  .handler(async ({ data }): Promise<ReceiptData> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("Receipt scanning is not configured");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "fetch" },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        stream: true,
        store: false,
        reasoning: { effort: "low", summary: "auto" },
        include: ["reasoning.encrypted_content"],
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text:
                  RECEIPT_PROMPT,
              },
              { type: "input_image", image_url: data.image },
            ],
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "receipt",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              required: ["vendor", "date", "total", "category", "purpose", "currency"],
              properties: {
                vendor: { type: ["string", "null"] },
                date: { type: ["string", "null"] },
                total: { type: ["number", "null"] },
                category: { type: "string", enum: RECEIPT_CATEGORIES },
                purpose: { type: ["string", "null"] },
                currency: { type: ["string", "null"] },
              },
            },
          },
        },
      }),
    });

    if (!res.ok || !res.body) {
      const failure = await res.json().catch(() => null) as { message?: string; error?: { message?: string } } | null;
      const msg =
        failure?.message || failure?.error?.message || (res.status === 429
          ? "Too many scans right now — please try again in a minute."
          : res.status === 402
            ? "AI credits are used up. Add credits in workspace settings to keep scanning."
            : `Couldn't read the receipt (${res.status}).`);
      throw new Error(msg);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    let text = "";
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        let ev;
        try { ev = JSON.parse(payload); } catch { continue; }
          if (ev.type === "response.output_text.delta") text += ev.delta ?? "";
          if (ev.type === "response.refusal.delta" || ev.type === "response.refusal.done") throw new Error(ev.refusal || ev.delta || "The receipt could not be processed.");
          if (ev.type === "response.failed" || ev.type === "error") throw new Error(ev.response?.error?.message || ev.error?.message || ev.message || "Couldn't read the receipt.");
      }
    }
    try {
      return validateReceiptData(JSON.parse(text));
    } catch {
      throw new Error("Couldn't read the receipt — please fill it in manually.");
    }
  });
