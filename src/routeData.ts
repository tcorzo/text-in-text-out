// Starlight route middleware: hide sidebar parts whose chapters are all drafts,
// and the glossary link while no term is published.
import { defineRouteMiddleware } from '@astrojs/starlight/route-data';
import { loadGlossary } from './lib/data';
import { groupByChapter } from './lib/glossary';
import { dropLink, pruneEmptyGroups, withBase } from './lib/library';

export const onRequest = defineRouteMiddleware(async (context) => {
	const route = context.locals.starlightRoute;
	route.sidebar = pruneEmptyGroups(route.sidebar);

	const { terms, sites, order, published } = await loadGlossary();
	if (groupByChapter(terms, sites, order, published).length === 0) {
		const glossary = withBase(import.meta.env.BASE_URL, '/glossary/');
		route.sidebar = dropLink(route.sidebar, glossary);
		// Starlight builds prev/next from the full sidebar, before this middleware runs.
		if (route.pagination.next?.href === glossary) route.pagination.next = undefined;
		if (route.pagination.prev?.href === glossary) route.pagination.prev = undefined;
	}
});
