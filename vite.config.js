import { defineConfig } from 'vite';

export default defineConfig({
    base: '/vowelchart/',
    build: {
        rollupOptions: {
            external: ['d3'],
            output: {
                // Provide global variables to use in the UMD build
                // for externalized deps
                globals: {
                    d3: 'd3',
                },
            },
        }
    }
});