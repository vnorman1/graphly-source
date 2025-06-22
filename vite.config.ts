import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  // Vite config Tailwind-hoz: a tailwindcss PostCSS pluginnal működik, külön plugin nem kell.
  // Az alias beállítás marad.
  return {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    plugins: [
      // Itt adhatod meg a Vite plugineket, pl. react(), svgr(), stb.
      tailwindcss()
    ]
  };
});
