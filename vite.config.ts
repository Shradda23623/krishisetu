import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
  build: {
    // Warn if any chunk exceeds 600kb
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React runtime — cached separately for long-term
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          // Data fetching — rarely changes
          "vendor-query": ["@tanstack/react-query", "@tanstack/query-core"],
          // Supabase client
          "vendor-supabase": ["@supabase/supabase-js"],
          // Stripe — large but only loaded on checkout
          "vendor-stripe": ["@stripe/react-stripe-js", "@stripe/stripe-js"],
        },
      },
    },
  },
}));
