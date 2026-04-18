import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type OrderStatus = Database["public"]["Enums"]["order_status"];

export interface OrderRow {
  id: string;
  customer_id: string;
  farmer_id: string;
  status: OrderStatus;
  total_amount: number;
  delivery_address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItemRow {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
}

export interface OrderWithItems extends OrderRow {
  order_items: (OrderItemRow & { product_name?: string })[];
  customer_name?: string;
  farmer_name?: string;
}

export function useCustomerOrders(customerId: string | undefined) {
  return useQuery({
    queryKey: ["customer-orders", customerId],
    queryFn: async () => {
      if (!customerId) return [];
      const { data: orders, error } = await supabase
        .from("orders")
        .select("*")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false });
      if (error) throw error;

      const orderIds = orders.map(o => o.id);
      if (!orderIds.length) return [];

      const { data: items } = await supabase
        .from("order_items")
        .select("*")
        .in("order_id", orderIds);

      const productIds = [...new Set(items?.map(i => i.product_id) || [])];
      const { data: products } = productIds.length
        ? await supabase.from("products").select("id, name").in("id", productIds)
        : { data: [] };

      const productMap = new Map<string, string>(products?.map(p => [p.id, p.name] as [string, string]) || []);

      const farmerIds = [...new Set(orders.map(o => o.farmer_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", farmerIds);
      const farmerMap = new Map<string, string | null>(profiles?.map(p => [p.user_id, p.display_name] as [string, string | null]) || []);

      return orders.map(o => ({
        ...o,
        order_items: (items || [])
          .filter(i => i.order_id === o.id)
          .map(i => ({ ...i, product_name: productMap.get(i.product_id) || "Product" })),
        farmer_name: farmerMap.get(o.farmer_id) || "Farmer",
      })) as OrderWithItems[];
    },
    enabled: !!customerId,
  });
}

export function useFarmerOrders(farmerId: string | undefined) {
  return useQuery({
    queryKey: ["farmer-orders", farmerId],
    queryFn: async () => {
      if (!farmerId) return [];
      const { data: orders, error } = await supabase
        .from("orders")
        .select("*")
        .eq("farmer_id", farmerId)
        .order("created_at", { ascending: false });
      if (error) throw error;

      const orderIds = orders.map(o => o.id);
      if (!orderIds.length) return [];

      const { data: items } = await supabase
        .from("order_items")
        .select("*")
        .in("order_id", orderIds);

      const productIds = [...new Set(items?.map(i => i.product_id) || [])];
      const { data: products } = productIds.length
        ? await supabase.from("products").select("id, name").in("id", productIds)
        : { data: [] };
      const productMap = new Map<string, string>(products?.map(p => [p.id, p.name] as [string, string]) || []);

      const customerIds = [...new Set(orders.map(o => o.customer_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", customerIds);
      const customerMap = new Map<string, string | null>(profiles?.map(p => [p.user_id, p.display_name] as [string, string | null]) || []);

      return orders.map(o => ({
        ...o,
        order_items: (items || [])
          .filter(i => i.order_id === o.id)
          .map(i => ({ ...i, product_name: productMap.get(i.product_id) || "Product" })),
        customer_name: customerMap.get(o.customer_id) || "Customer",
      })) as OrderWithItems[];
    },
    enabled: !!farmerId,
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      customer_id: string;
      farmer_id: string;
      total_amount: number;
      delivery_address?: string;
      delivery_lat?: number;
      delivery_lng?: number;
      notes?: string;
      items: { product_id: string; quantity: number; unit_price: number }[];
    }) => {
      const { items, ...orderData } = params;
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert(orderData)
        .select()
        .single();
      if (orderError) throw orderError;

      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);
      if (itemsError) throw itemsError;

      return order;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customer-orders"] });
      qc.invalidateQueries({ queryKey: ["farmer-orders"] });
    },
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: OrderStatus }) => {
      const { data, error } = await supabase
        .from("orders")
        .update({ status })
        .eq("id", orderId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["farmer-orders"] });
      qc.invalidateQueries({ queryKey: ["customer-orders"] });
    },
  });
}
