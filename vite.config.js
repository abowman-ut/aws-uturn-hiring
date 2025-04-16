import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		fs: {
			allow: ['.']
		}
	},
	optimizeDeps: {
		esbuildOptions: {
			// Node.js global to browser globalThis
			define: {
			  global: 'globalThis'
			}
		},
		exclude: [
			'chart.js',
			'@sveltejs/kit',
			'svelte',
			'svelte-runtime'
		]
	},
	resolve: {
		alias: {
		  './runtimeConfig': './runtimeConfig.browser', // Fix for AWS SDK
		}
	  },
	define: {
		'global': {}, // Fix for AWS Amplify
		'process.env': {},
		'process.env.MY_AWS_ACCESS_KEY_ID': JSON.stringify(process.env.MY_AWS_ACCESS_KEY_ID),
		'process.env.MY_AWS_SECRET_ACCESS_KEY': JSON.stringify(process.env.MY_AWS_SECRET_ACCESS_KEY),
		'process.env.MY_AWS_REGION': JSON.stringify(process.env.MY_AWS_REGION || 'us-east-1')
	}
});
