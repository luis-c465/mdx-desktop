// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	integrations: [
		starlight({
			title: 'MDX Desktop',
			description: 'A native desktop markdown editor built for performance. Edit 1000+ files with ease.',
			social: [
				{ 
					icon: 'github', 
					label: 'GitHub Repository', 
					href: 'https://github.com/luis-c465/mdx-desktop' 
				}
			],
		sidebar: [
			{
				label: 'Guides',
				items: [
					{ label: 'Example Guide', slug: 'guides/example' },
				],
			},
			{
				label: 'Reference',
				items: [
					{ label: 'Example Reference', slug: 'reference/example' },
				],
			},
		],
			components: {
				Footer: './src/components/CustomFooter.astro',
			},
		}),
	],
});
