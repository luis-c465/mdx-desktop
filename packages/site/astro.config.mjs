// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

import tailwindcss from '@tailwindcss/vite';

import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  site: 'https://luis-c465.github.io',
  base: '/mdx-desktop',
  integrations: [starlight({
      title: 'MDX Desktop',
      description: 'A native desktop markdown editor built for performance',
      customCss: ['./src/styles/global.css'],
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
          { label: 'Editor Plugins', slug: 'features/plugins' },
          { label: 'Working with Images', slug: 'features/images' },
          { label: 'File Management', slug: 'features/file-management' },
      ],
  },
  {
      label: 'Guides',
      items: [
          { label: 'Basic Usage', slug: 'guides/basic-usage' },
      ],
  },
  // TODO: Uncomment this section when Stage 6 is implemented
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
  }), react()],

  vite: {
    plugins: [tailwindcss()],
  },
});
