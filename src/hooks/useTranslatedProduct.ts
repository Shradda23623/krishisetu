import { useMemo } from "react";
import { useI18n } from "@/context/I18nContext";
import { Product } from "@/data/products";
import { getTranslatedProduct } from "@/i18n/productTranslations";

export interface TranslatedProduct extends Product {
  translatedName: string;
  translatedDescription: string;
  translatedFarmerName: string;
  translatedLocation: string;
}

export function useTranslatedProduct(product: Product | undefined): TranslatedProduct | null {
  const { language } = useI18n();
  return useMemo(() => {
    if (!product) return null;
    const t = getTranslatedProduct(product.id, language);
    if (!t) return { ...product, translatedName: product.name, translatedDescription: product.description, translatedFarmerName: product.farmerName, translatedLocation: product.location };
    return {
      ...product,
      translatedName: t.name,
      translatedDescription: t.description,
      translatedFarmerName: t.farmerName,
      translatedLocation: t.location,
    };
  }, [product, language]);
}

export function useTranslatedProducts(products: Product[]): TranslatedProduct[] {
  const { language } = useI18n();
  return useMemo(() => {
    return products.map(product => {
      const t = getTranslatedProduct(product.id, language);
      if (!t) return { ...product, translatedName: product.name, translatedDescription: product.description, translatedFarmerName: product.farmerName, translatedLocation: product.location };
      return {
        ...product,
        translatedName: t.name,
        translatedDescription: t.description,
        translatedFarmerName: t.farmerName,
        translatedLocation: t.location,
      };
    });
  }, [products, language]);
}
