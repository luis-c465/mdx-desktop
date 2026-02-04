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
			label: 'Getting Started',
			items: [
				{ label: 'Installation', slug: 'getting-started/installation' },
				{ label: 'Quick Start', slug: 'getting-started/quick-start' },
			],
		},
		{
			label: 'Features',
			items: [
				{ label: 'Markdown Editor', slug: 'features/editor' },
				{ label: 'File Management', slug: 'features/file-management' },
			],
		},
		// TODO: Uncomment these sections as they are implemented in later stages
			// {
			// 	label: 'Guides',
			// 	items: [
			// 		{ label: 'Basic Usage', slug: 'guides/basic-usage' },
			// 		{ label: 'Keyboard Shortcuts', slug: 'guides/keyboard-shortcuts' },
			// 	],
			// },
			// {
			// 	label: 'Reference',
			// 	items: [
			// 		{ label: 'FAQ', slug: 'reference/faq' },
			// 		{ label: 'Architecture', slug: 'reference/architecture' },
			// 	],
			// },
		],
			components: {
				Footer: './src/components/CustomFooter.astro',
			},
		}),
	],
});
