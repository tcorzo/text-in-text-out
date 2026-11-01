// External links open in a new tab. The site builds every internal link as a path
// (withBase, ChapterLink, SectionLink), so any absolute http(s) URL leaves the site.
import type { Element, Root, RootContent } from 'hast';
import { fromHtml } from 'hast-util-from-html';
import { toHtml } from 'hast-util-to-html';

/** Attributes for a link that leaves the site, for components that take them as props. */
export const NEW_TAB = { target: '_blank', rel: 'noopener noreferrer' } as const;

export function isExternal(href: string): boolean {
	return /^https?:\/\//i.test(href);
}

/** Sets target and rel on every external <a> in an HTML fragment. */
export function openExternalInNewTab(html: string): string {
	if (!/href=["']?https?:/i.test(html)) return html;
	const tree = fromHtml(html, { fragment: true });
	const visit = (node: Root | RootContent) => {
		if (node.type === 'element') {
			const el = node as Element;
			const href = el.properties.href;
			if (el.tagName === 'a' && typeof href === 'string' && isExternal(href)) {
				el.properties.target = NEW_TAB.target;
				el.properties.rel = NEW_TAB.rel.split(' ');
			}
		}
		if ('children' in node) node.children.forEach(visit);
	};
	visit(tree);
	return toHtml(tree);
}
