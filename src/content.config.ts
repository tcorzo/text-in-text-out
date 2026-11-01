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

// One file per term. The chapter that introduces a term is wherever its <Define> sits, never here.
const glossary = defineCollection({
	loader: glob({ pattern: '**/*.yaml', base: './src/content/glossary' }),
	schema: z.object({
		term: z.string(),
		// Other ways the term appears in prose ("tokens" for "token").
		forms: z.array(z.string()).default([]),
		// One short sentence: the hover text and the glossary entry.
		definition: z.string(),
		// The image or comparison the chapter used ("a black box").
		image: z.string().optional(),
		// Phrases where a form means something else ("error message").
		skip: z.array(z.string()).default([]),
		// False for terms too central to underline on every page ("model").
		markMentions: z.boolean().default(true),
	}),
});

export const collections = {
	docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
	library,
	glossary,
};
