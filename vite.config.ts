import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(async () => {
  const plugins = [react(), tailwindcss()];
  try {
    // @ts-expect-error optional helper module
    const m = await import('./.vite-source-tags.js');
    plugins.push(m.sourceTags());
  } catch {
    /* ignore missing optional module */
  }
  return { plugins };
})

