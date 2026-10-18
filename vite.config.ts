import devServer from "@hono/vite-dev-server"
import path from "path"
const __dirname = import.meta.dirname
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { inspectAttr } from 'kimi-plugin-inspect-react'
import { VitePWA } from "vite-plugin-pwa"

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    devServer({ entry: "api/boot.ts", exclude: [/^\/(?!api\/).*$/] }),
    inspectAttr(), react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Monito gIA — Andamiaje cognitivo",
        short_name: "Monito gIA",
        description:
          "Micro-actividades con andamiaje socrático, ancladas al Plan de Estudios 2022 (NEM), con analítica de errores para docentes de primaria.",
        lang: "es",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "portrait",
        background_color: "#F7EDE2",
        theme_color: "#563E79",
        icons: [
          { src: "/pwa-icon.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "/pwa-icon-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        // Las llamadas tRPC siempre van a la red (datos vivos del aula)
        navigateFallbackDenylist: [/^\/api\//],
      },
    })],
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@contracts": path.resolve(__dirname, "./contracts"),
      "@db": path.resolve(__dirname, "./db"),
      "db": path.resolve(__dirname, "./db"),
    },
  },
  envDir: path.resolve(__dirname),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
  },
});
