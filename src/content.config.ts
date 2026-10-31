import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';
import { TYPE_ORDER } from './lib/library';

const library = defineCollection({
	loader: glob({ pattern: '**/*.yaml', base: './src/content/library' }),
	schema: z.object({
		title: z.string(),
		url: z.string().url(),
		type: z.enum(TYPE_ORDER),
		creator: z.string(),
		// One factual line describing the resource, from its own page.
		summary: z.string(),
		published: z.coerce.date().optional(),
		links: z.array(z.object({ label: z.string(), url: z.string().url() })).default([]),
		tags: z
			.array(z.string().regex(/^[a-z0-9-]+$/, 'tags must be kebab-case: lowercase letters, digits and dashes'))
			.default([]),
		// The author's own "why it's worth your time". Never filled in by agents.
		note: z.string().optional(),
		chapters: z.array(reference('docs')).default([]),
		related: z.array(reference('library')).default([]),
		added: z.coerce.date(),
	}),
});

export const collections = {
	docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
	library,
};
