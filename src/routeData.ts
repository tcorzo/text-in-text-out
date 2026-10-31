// Starlight route middleware: hide sidebar parts whose chapters are all drafts.
import { defineRouteMiddleware } from '@astrojs/starlight/route-data';
import { pruneEmptyGroups } from './lib/library';

export const onRequest = defineRouteMiddleware((context) => {
	const route = context.locals.starlightRoute;
	route.sidebar = pruneEmptyGroups(route.sidebar);
});
