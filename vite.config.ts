import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // Must match the GitHub repository name EXACTLY, with leading and trailing
  // slashes. If you later deploy to a user/organization site named
  // <user>.github.io, or attach a custom domain, change this back to "/".
  base: "/five-crowns-scoreboard/"
});