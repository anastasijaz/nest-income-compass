import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface ReceiptData {
  vendor: string | null;
  date: string | null;
  total: number | null;
  category: string;
}

const CATEGORIES = ["repairs", "maintenance", "utilities", "insurance", "property_tax", "mortgage", "management_fees", "other"];

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
        reasoning: { effort: "low" },
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text:
                  "Extract data from this receipt or invoice for a rental property owner. Return vendor name, the purchase/invoice date as YYYY-MM-DD, and the final total amount paid in EUR as a number. Suggest the best cost category: repairs (fixing broken things, tradespeople), maintenance (regular upkeep, cleaning, gardening, supplies), utilities (electricity, water, gas, heating, internet), insurance, property_tax, mortgage (loan payments), management_fees, other. Use null for anything unreadable.",
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
              required: ["vendor", "date", "total", "category"],
              properties: {
                vendor: { type: ["string", "null"] },
                date: { type: ["string", "null"] },
                total: { type: ["number", "null"] },
                category: { type: "string", enum: CATEGORIES },
              },
            },
          },
        },
      }),
    });

    if (!res.ok || !res.body) {
      const msg =
        res.status === 429
          ? "Too many scans right now — please try again in a minute."
          : res.status === 402
            ? "AI credits are used up. Add credits in workspace settings to keep scanning."
            : `Couldn't read the receipt (${res.status}).`;
      console.error("receipt parse failed", res.status, await res.text().catch(() => ""));
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
        try {
          const ev = JSON.parse(payload);
          if (ev.type === "response.output_text.delta") text += ev.delta ?? "";
          if (ev.type === "response.failed" || ev.type === "error") throw new Error("Couldn't read the receipt.");
        } catch (e) {
          if (e instanceof Error && e.message.startsWith("Couldn't")) throw e;
        }
      }
    }
    try {
      const parsed = JSON.parse(text) as ReceiptData;
      if (parsed.date && !/^\d{4}-\d{2}-\d{2}$/.test(parsed.date)) parsed.date = null;
      if (!CATEGORIES.includes(parsed.category)) parsed.category = "other";
      return parsed;
    } catch {
      throw new Error("Couldn't read the receipt — please fill it in manually.");
    }
  });
