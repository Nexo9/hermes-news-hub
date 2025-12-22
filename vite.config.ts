import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    // Indispensable pour que Koyeb puisse accéder au serveur
    host: true, 
    // On force le port 8080 car c'est celui que tes logs affichaient
    port: 8080, 
    // On autorise toutes les adresses pour corriger l'erreur "Blocked host"
    allowedHosts: "all" 
  },
})
