import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    watch: {
      usePolling: true, // Importante para o Docker no Windows
    },
    host: true, // Necessário para o Docker expor a rede
    strictPort: true,
    port: 5173, 
  }
})