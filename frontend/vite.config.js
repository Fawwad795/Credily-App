import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on mode
  const env = loadEnv(mode, ".");

  // Default port if not specified in environment
  const apiPort = env.VITE_API_PORT || "5000";

  return {
    plugins: [react()],
    server: {
      open: true, // This will open the browser automatically
      proxy: {
        "/api": {
          target: `http://localhost:${apiPort}`,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
