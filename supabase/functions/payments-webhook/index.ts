import { createClient } from "npm:@supabase/supabase-js@2";
import { type StripeEnv, verifyWebhook } from "../_shared/stripe.ts";

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const url = new URL(req.url);
  const env = (url.searchParams.get("env") || "sandbox") as StripeEnv;

  try {
    const event = await verifyWebhook(req, env);
    console.log("Received event:", event.type, "env:", env);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const orderIdsRaw = session.metadata?.order_ids;
        if (orderIdsRaw && session.payment_status === "paid") {
          const orderIds: string[] = JSON.parse(orderIdsRaw);
          // Confirm all orders in the batch
          for (const orderId of orderIds) {
            await supabase
              .from("orders")
              .update({
                status: "confirmed",
                stripe_payment_intent_id: (session.payment_intent as string) || null,
              })
              .eq("id", orderId);
          }
        }
        break;
      }
      case "checkout.session.expired": {
        const session = event.data.object;
        const orderIdsRaw = session.metadata?.order_ids;
        if (orderIdsRaw) {
          const orderIds: string[] = JSON.parse(orderIdsRaw);
          for (const orderId of orderIds) {
            await supabase
              .from("orders")
              .update({ status: "cancelled" })
              .eq("id", orderId);
          }
        }
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 400 });
  }
});
