import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Minimal Vite config for React frontend development.
export default defineConfig({
  plugins: [react()],
});
