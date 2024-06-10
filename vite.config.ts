import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

export default defineConfig({
	plugins: [sveltekit()],
	css: {
		preprocessorOptions: {
			scss: {
				additionalData: `@use "${dirname(fileURLToPath(import.meta.url))}/src/lib/styles/app.global.scss";`,
			},
		},
	},
});
