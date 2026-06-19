import { useEffect } from "react";

const BASE_TITLE = "KrishiSetu — Farm to Table Marketplace";

/**
 * Sets document.title for the current page. Resets to the base title on unmount.
 * Usage: usePageTitle("Products") → "Products — KrishiSetu"
 */
export function usePageTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} — KrishiSetu` : BASE_TITLE;
    return () => {
      document.title = BASE_TITLE;
    };
  }, [title]);
}
