import { defineConfig } from 'vite';

export default defineConfig({
    base: '/vowelchart/',
    build: {
        rollupOptions: {
            external: ['d3']
        }
    }
});