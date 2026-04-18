import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Product } from "@/data/products";

export interface DbProduct {
  id: string;
  farmer_id: string;
  name: string;
  description: string | null;
  category: string;
  image_url: string | null;
  price: number;
  unit: string;
  stock_quantity: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ProductWithFarmer extends DbProduct {
  farmer_name: string | null;
  farmer_location: string | null;
}

function toProduct(p: ProductWithFarmer): Product {
  return {
    id: p.id,
    name: p.name,
    category: (p.category || "other") as Product["category"],
    price: p.price,
    unit: p.unit,
    quantity: p.stock_quantity,
    description: p.description || "",
    images: [p.image_url || "https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=600"],
    farmerId: p.farmer_id,
    farmerName: p.farmer_name || "Farmer",
    location: p.farmer_location || "",
    state: "",
    rating: 0,
    reviews: 0,
    organic: false,
  };
}

export function useDbProducts(category?: string) {
  return useQuery({
    queryKey: ["db-products", category],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (category) query = query.eq("category", category);

      const { data: products, error } = await query;
      if (error) throw error;
      if (!products?.length) return [] as Product[];

      const farmerIds = [...new Set(products.map(p => p.farmer_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, address")
        .in("user_id", farmerIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return products.map(p => {
        const profile = profileMap.get(p.farmer_id);
        return toProduct({
          ...p,
          farmer_name: profile?.display_name || null,
          farmer_location: profile?.address || null,
        });
      });
    },
  });
}

export function useFarmerProducts(farmerId: string | undefined) {
  return useQuery({
    queryKey: ["farmer-products", farmerId],
    queryFn: async () => {
      if (!farmerId) return [];
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("farmer_id", farmerId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as DbProduct[];
    },
    enabled: !!farmerId,
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (product: {
      farmer_id: string;
      name: string;
      description?: string;
      category: string;
      image_url?: string;
      price: number;
      unit: string;
      stock_quantity: number;
    }) => {
      const { data, error } = await supabase
        .from("products")
        .insert(product)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["farmer-products"] });
      qc.invalidateQueries({ queryKey: ["db-products"] });
    },
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DbProduct> & { id: string }) => {
      const { data, error } = await supabase
        .from("products")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["farmer-products"] });
      qc.invalidateQueries({ queryKey: ["db-products"] });
    },
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["farmer-products"] });
      qc.invalidateQueries({ queryKey: ["db-products"] });
    },
  });
}
