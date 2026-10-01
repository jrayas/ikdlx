// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	site: 'https://jrayas.github.io',
	base: '/ikdlx/',
	integrations: [
		starlight({
			title: 'IKDLx',
			description:
				'Idea → Knowledge → Decision → Lesson — a domain-first personal knowledge system for Obsidian.',
			customCss: ['./src/styles/custom.css'],
			components: {
				Head: './src/components/Head.astro',
				TwoColumnContent: './src/components/FadeTwoColumnContent.astro',
			},
			head: [],
			social: [
				{ icon: 'github', label: 'GitHub', href: 'https://github.com/jrayas/ikdlx' },
			],
			sidebar: [
				{
					label: 'Start here',
					items: [
						{ label: 'What is IKDLx?', slug: 'index' },
						{ label: 'Why not PARA', slug: 'why-not-para' },
					],
				},
				{
					label: 'The core chain',
					items: [
						{ label: 'Idea', slug: 'core-chain/idea' },
						{ label: 'Knowledge', slug: 'core-chain/knowledge' },
						{ label: 'Decision', slug: 'core-chain/decision' },
						{ label: 'Lesson', slug: 'core-chain/lesson' },
					],
				},
				{
					label: 'Supporting structure',
					items: [
						{ label: 'The "x" types', slug: 'supporting-types' },
						{ label: 'Folder structure & Inbox', slug: 'folder-structure' },
						{ label: 'Naming convention', slug: 'naming-convention' },
						{ label: 'Frontmatter schema', slug: 'frontmatter-schema' },
						{ label: 'Templates', slug: 'templates' },
						{ label: 'Cross-domain notes', slug: 'cross-domain-notes' },
					],
				},
				{
					label: 'Reference',
					items: [{ label: 'Quick reference', slug: 'quick-reference' }],
				},
			],
		}),
	],
});
