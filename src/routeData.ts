// Starlight route middleware: list every chapter in the sidebar, drafts badged ("Draft" in dev,
// "Coming soon" in production), and hide the glossary link while no term is published and the
// outline entries of <Draft> sections.
import { defineRouteMiddleware } from '@astrojs/starlight/route-data';
import { getCollection } from 'astro:content';
import { chaptersOf, withDraftChapters } from './lib/book';
import { loadGlossary } from './lib/data';
import { groupByChapter } from './lib/glossary';
import { dropLink, pruneEmptyGroups, withBase } from './lib/library';
import { draftHeadingSlugs } from './lib/sections';

type TocItem = { slug: string; children: TocItem[] };
const dropSlugs = <T extends TocItem>(items: T[], slugs: Set<string>): T[] =>
	items.filter((i) => !slugs.has(i.slug)).map((i) => ({ ...i, children: dropSlugs(i.children, slugs) }));

export const onRequest = defineRouteMiddleware(async (context) => {
	const route = context.locals.starlightRoute;
	const chapters = chaptersOf(await getCollection('docs'));
	route.sidebar = pruneEmptyGroups(
		withDraftChapters(route.sidebar, chapters, { prod: import.meta.env.PROD, base: import.meta.env.BASE_URL }),
	);

	if (import.meta.env.PROD) {
		const drafted = draftHeadingSlugs(route.entry.body ?? '');
		if (drafted.size > 0) {
			route.headings = route.headings.filter((h) => !drafted.has(h.slug));
			if (route.toc) route.toc.items = dropSlugs(route.toc.items, drafted);
		}
	}

	const { terms, sites, order, published } = await loadGlossary();
	if (groupByChapter(terms, sites, order, published).length === 0) {
		const glossary = withBase(import.meta.env.BASE_URL, '/glossary/');
		route.sidebar = dropLink(route.sidebar, glossary);
		// Starlight builds prev/next from the full sidebar, before this middleware runs.
		if (route.pagination.next?.href === glossary) route.pagination.next = undefined;
		if (route.pagination.prev?.href === glossary) route.pagination.prev = undefined;
	}
});
