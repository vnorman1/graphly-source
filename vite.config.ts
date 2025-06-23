import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { defineConfig } from 'vite';
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig(() => {
  // Vite config Tailwind-hoz: a tailwindcss PostCSS pluginnal működik, külön plugin nem kell.
  // Az alias beállítás marad.
  return {
    base: './',
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    plugins: [
      // Itt adhatod meg a Vite plugineket, pl. react(), svgr(), stb.
      tailwindcss(),
  basicSsl({
      /** name of certification */
      name: 'test',
      /** custom trust domains */
      domains: ['*.custom.com'],
      /** custom certification directory */
      certDir: '/Users/.../.devServer/cert',
    }),
    ]
  };
});
