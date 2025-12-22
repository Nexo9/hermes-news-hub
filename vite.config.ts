import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Nécessaire pour Koyeb
    port: 8080, // Le port que tu as configuré
    allowedHosts: [
      'ambitious-corette-antik-d0c0d2a8.koyeb.app' // Ton URL Koyeb
    ]
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
