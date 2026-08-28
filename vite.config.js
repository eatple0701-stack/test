import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // 5177 because every document in this repository says 5177, and because
  // .claude/launch.json passes --port 5177 so Claude's preview lands there.
  // Without this line `npm run dev` used Vite's default 5173 instead, so a
  // person following the setup guide got a different port from the one the
  // guide, HANDOVER, and the Supabase redirect allow-list all name.
  // Not strictPort: if 5177 is taken, Vite steps to the next free port and
  // prints it, which is friendlier than refusing to start.
  server: { port: 5177 },
})
