import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Product } from "@/data/products";
import { dummyProducts } from "@/data/products";

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
  avg_rating: number;
  review_count: number;
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
    rating: p.avg_rating,
    reviews: p.review_count,
    organic: false,
  };
}

export function useDbProducts(category?: string) {
  return useQuery({
    queryKey: ["db-products", category],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      // Filter by category at DB level to reduce data transfer
      let query = supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (category) query = query.eq("category", category);

      const { data: products, error } = await query;
      if (error) throw error;
      if (!products?.length) {
        // No products in DB yet — show category-filtered dummy data so the site
        // looks populated during development / demo.
        const fallback = category
          ? dummyProducts.filter(p => p.category === category)
          : dummyProducts;
        return fallback;
      }

      const farmerIds = [...new Set(products.map(p => p.farmer_id))];
      const productIds = products.map(p => p.id);

      // Fetch profiles AND ratings in parallel — one round trip instead of two sequential
      const [profilesResult, ratingsResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("user_id, display_name, address")
          .in("user_id", farmerIds),
        supabase
          .from("reviews")
          .select("product_id, rating")
          .in("product_id", productIds),
      ]);

      const profileMap = new Map(profilesResult.data?.map(p => [p.user_id, p]) ?? []);

      // Compute avg rating and review count per product
      const ratingMap = new Map<string, { sum: number; count: number }>();
      for (const r of ratingsResult.data ?? []) {
        const prev = ratingMap.get(r.product_id) ?? { sum: 0, count: 0 };
        ratingMap.set(r.product_id, { sum: prev.sum + r.rating, count: prev.count + 1 });
      }

      return products.map(p => {
        const profile = profileMap.get(p.farmer_id);
        const ratingData = ratingMap.get(p.id);
        const avg_rating = ratingData
          ? Math.round((ratingData.sum / ratingData.count) * 10) / 10
          : 0;
        return toProduct({
          ...p,
          farmer_name: profile?.display_name ?? null,
          farmer_location: profile?.address ?? null,
          avg_rating,
          review_count: ratingData?.count ?? 0,
        });
      });
    },
  });
}

export function useProductById(id: string | undefined) {
  return useQuery({
    queryKey: ["product", id],
    staleTime: 5 * 60 * 1000,
    enabled: !!id,
    queryFn: async () => {
      const { data: p, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;

      const [profileResult, ratingsResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("user_id, display_name, address")
          .eq("user_id", p.farmer_id)
          .single(),
        supabase
          .from("reviews")
          .select("rating")
          .eq("product_id", p.id),
      ]);

      const profile = profileResult.data;
      const ratings = ratingsResult.data ?? [];
      const avg_rating = ratings.length
        ? Math.round((ratings.reduce((s, r) => s + r.rating, 0) / ratings.length) * 10) / 10
        : 0;

      return toProduct({
        ...p,
        farmer_name: profile?.display_name ?? null,
        farmer_location: profile?.address ?? null,
        avg_rating,
        review_count: ratings.length,
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
