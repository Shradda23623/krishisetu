import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ReviewRow {
  id: string;
  customer_id: string;
  farmer_id: string;
  product_id: string | null;
  order_id: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
  customer_name?: string;
}

export function useProductReviews(productId: string | undefined) {
  return useQuery({
    queryKey: ["reviews", "product", productId],
    queryFn: async () => {
      if (!productId) return [];
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("product_id", productId)
        .order("created_at", { ascending: false });
      if (error) throw error;

      const customerIds = [...new Set(data.map(r => r.customer_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", customerIds);
      const nameMap = new Map(profiles?.map(p => [p.user_id, p.display_name]) || []);

      return data.map(r => ({
        ...r,
        customer_name: nameMap.get(r.customer_id) || "Customer",
      })) as ReviewRow[];
    },
    enabled: !!productId,
  });
}

export function useFarmerReviews(farmerId: string | undefined) {
  return useQuery({
    queryKey: ["reviews", "farmer", farmerId],
    queryFn: async () => {
      if (!farmerId) return [];
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("farmer_id", farmerId)
        .order("created_at", { ascending: false });
      if (error) throw error;

      const customerIds = [...new Set(data.map(r => r.customer_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", customerIds);
      const nameMap = new Map(profiles?.map(p => [p.user_id, p.display_name]) || []);

      return data.map(r => ({
        ...r,
        customer_name: nameMap.get(r.customer_id) || "Customer",
      })) as ReviewRow[];
    },
    enabled: !!farmerId,
  });
}

export function useCreateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (review: {
      customer_id: string;
      farmer_id: string;
      product_id?: string;
      order_id?: string;
      rating: number;
      comment?: string;
    }) => {
      const { data, error } = await supabase
        .from("reviews")
        .insert(review)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reviews"] });
    },
  });
}

export function useDeleteReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reviews").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reviews"] });
    },
  });
}
