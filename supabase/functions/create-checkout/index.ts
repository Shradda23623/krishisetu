import { createClient } from "npm:@supabase/supabase-js@2";
import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { orderIds, returnUrl, environment, deliveryFee } = await req.json();
    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return new Response(JSON.stringify({ error: "Missing orderIds" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch all orders belonging to this customer
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("*")
      .in("id", orderIds)
      .eq("customer_id", user.id);

    if (ordersError || !orders || orders.length === 0) {
      return new Response(JSON.stringify({ error: "Orders not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch all order items
    const { data: items } = await supabase
      .from("order_items")
      .select("*")
      .in("order_id", orderIds);

    // Fetch product names
    const productIds = [...new Set((items || []).map((i: any) => i.product_id))];
    const { data: products } = productIds.length
      ? await supabase.from("products").select("id, name").in("id", productIds)
      : { data: [] };

    const productMap = new Map((products || []).map((p: any) => [p.id, p.name]));

    const env = (environment || "sandbox") as StripeEnv;
    const stripe = createStripeClient(env);

    const origin = returnUrl
      ? new URL(returnUrl).origin
      : req.headers.get("origin") || "http://localhost:8080";

    // Build line items from order items
    const lineItems = (items || []).map((item: any) => ({
      price_data: {
        currency: "inr",
        product_data: {
          name: productMap.get(item.product_id) || "Product",
        },
        unit_amount: Math.round(item.unit_price * 100),
      },
      quantity: item.quantity,
    }));

    // Add delivery fee as a line item if present
    const fee = typeof deliveryFee === "number" && deliveryFee > 0 ? deliveryFee : 0;
    if (fee > 0) {
      lineItems.push({
        price_data: {
          currency: "inr",
          product_data: { name: "Delivery Fee" },
          unit_amount: Math.round(fee * 100),
        },
        quantity: 1,
      });
    }

    // Create embedded checkout session with all line items combined
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      ui_mode: "embedded",
      line_items: lineItems,
      metadata: {
        order_ids: JSON.stringify(orderIds),
        customer_id: user.id,
      },
      return_url: returnUrl || `${origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
      ...(user.email && { customer_email: user.email }),
    });

    return new Response(
      JSON.stringify({ clientSecret: session.client_secret }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Checkout error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
