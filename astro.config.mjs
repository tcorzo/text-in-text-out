// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import react from '@astrojs/react';
import mermaid from 'astro-mermaid';
import starlightLinksValidator from 'starlight-links-validator';
import starlightThemeRapide from 'starlight-theme-rapide';

// Site address. Change both lines together if the site moves
// (e.g. to a custom domain: set `site` to it and `base` to '/').
const site = 'https://tcorzo.github.io';
const base = '/ai-resources';

export default defineConfig({
	site,
	base,
	integrations: [
		// Must come before Starlight.
		mermaid({ autoTheme: true }),
		starlight({
			title: 'Text In, Text Out',
			plugins: [
				starlightThemeRapide(),
				// Hero actions don't get the base prefix, so the home page links to the library relatively.
				starlightLinksValidator({ exclude: ['./library/', './part-1-primitives/what-is-a-model/'] }),
			],
			routeMiddleware: './src/routeData.ts',
			components: { MarkdownContent: './src/components/MarkdownContent.astro' },
			sidebar: [
				{ label: 'Part I: Primitives', items: [{ autogenerate: { directory: 'part-1-primitives' } }] },
				{ label: 'Part II: From model to agent', items: [{ autogenerate: { directory: 'part-2-model-to-agent' } }] },
				{ label: 'Part III: Building and judging agents', items: [{ autogenerate: { directory: 'part-3-building-and-judging' } }] },
				{ label: 'Part IV: In practice', items: [{ autogenerate: { directory: 'part-4-in-practice' } }] },
				{ label: 'Library', link: '/library/' },
				{ label: 'Glossary', link: '/glossary/' },
			],
		}),
		react(),
	],
});
