import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { resolve } from "path";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  
  server: {
    host: true, // Listen on all addresses (0.0.0.0) for Docker
    port: 5173,
    watch: {
      usePolling: true, // Enable polling for file changes in Docker
    },
    proxy: {
      // Proxy API requests to backend
      '/api': {
        target: 'http://hypertube-backend-app-1:3000',
        changeOrigin: true,
        secure: false,
      },
      // Proxy uploads to backend if not found locally
      '/uploads': {
        target: 'http://hypertube-backend-app-1:3000',
        changeOrigin: true,
        secure: false,
      },
      '/downloads': {
        target: 'http://hypertube-backend-app-1:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },

  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      "@components": resolve(__dirname, "./src/components"),
      "@hooks": resolve(__dirname, "./src/hooks"),
      "@api": resolve(__dirname, "./src/api"),
      "@public": resolve(__dirname, "./public"),
      "@utils": resolve(__dirname, "./src/utils"),
      "@ui": resolve(__dirname, "./src/components/ui"),
      "@config": resolve(__dirname, "./src/config"),
      "@icons": resolve(__dirname, "./src/components/icons"),
      "@types": resolve(__dirname, "./src/types"),
      "@schemas": resolve(__dirname, "./src/schemas"),
      "@stores": resolve(__dirname, "./src/stores"),
    },
  },
});
