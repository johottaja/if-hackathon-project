import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
// Relative asset paths, so the build also works from a subpath such as GitHub Pages.
export default defineConfig({ base: './', plugins: [react(), tailwindcss()], server: { host: "0.0.0.0", proxy: { "/api": "http://127.0.0.1:3000" } }, build: { rollupOptions: { input: { main: 'index.html', demo: 'demo.html' } } } });
