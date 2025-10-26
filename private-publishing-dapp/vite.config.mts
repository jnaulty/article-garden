import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Output directory
    outDir: "dist",
    // Generate sourcemaps for production debugging
    sourcemap: false,
    // Optimize chunk splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor chunks for better caching
          vendor: [
            "react",
            "react-dom",
            "react-router-dom",
          ],
          sui: [
            "@mysten/dapp-kit",
          ],
          walrus: [
            "@mysten/walrus",
            "@mysten/walrus-wasm",
          ],
          seal: [
            "@mysten/seal",
          ],
        },
        // Asset file naming for cache busting
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split(".");
          const ext = info[info.length - 1];
          // WASM files get special treatment
          if (ext === "wasm") {
            return `assets/wasm/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
        chunkFileNames: "assets/js/[name]-[hash].js",
        entryFileNames: "assets/js/[name]-[hash].js",
      },
    },
    // Increase chunk size warning limit (useful for blockchain libs)
    chunkSizeWarningLimit: 1000,
  },
  // Optimize dependency pre-bundling
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "@mysten/dapp-kit",
    ],
    // Exclude WASM packages from pre-bundling
    exclude: [
      "@mysten/walrus-wasm",
    ],
  },
  // Ensure proper WASM handling
  assetsInclude: ["**/*.wasm"],
});
