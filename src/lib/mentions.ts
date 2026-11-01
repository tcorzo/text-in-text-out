// Marks the first mention of each glossary term in a chapter's rendered HTML.
// Pure: takes HTML and terms, returns HTML. MarkdownContent.astro decides which terms apply.
import type { Element, ElementContent, Root, RootContent, Text } from 'hast';
import { fromHtml } from 'hast-util-from-html';
import { toHtml } from 'hast-util-to-html';
import type { Mentionable } from './glossary';

/** Elements whose text is never a mention: links, headings, code, definitions, islands. */
const SKIP = new Set(['a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'code', 'pre', 'kbd', 'dfn', 'script', 'style', 'svg', 'button', 'astro-island']);

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function markMentions(
	html: string,
	terms: Mentionable[],
	hrefFor: (id: string) => string,
): { html: string; marked: string[] } {
	if (terms.length === 0) return { html, marked: [] };

	const termOf = new Map<string, Mentionable>();
	for (const t of terms) for (const f of t.forms) termOf.set(f.toLowerCase(), t);
	const forms = [...termOf.keys()].sort((a, b) => b.length - a.length).map(escape);
	const pattern = new RegExp(`(?<![\\p{L}\\p{N}])(?:${forms.join('|')})(?![\\p{L}\\p{N}])`, 'giu');
	const marked: string[] = [];

	/** Character ranges in `text` covered by any of the term's skip phrases. */
	const skipped = (text: string, term: Mentionable) =>
		term.skip.flatMap((phrase) =>
			[...text.matchAll(new RegExp(escape(phrase), 'giu'))].map((m) => [m.index, m.index + m[0].length] as const),
		);

	const split = (node: Text): ElementContent[] => {
		const out: ElementContent[] = [];
		let from = 0;
		for (const m of node.value.matchAll(pattern)) {
			const term = termOf.get(m[0].toLowerCase());
			if (!term || marked.includes(term.id)) continue;
			const [start, end] = [m.index, m.index + m[0].length];
			if (skipped(node.value, term).some(([s, e]) => start < e && end > s)) continue;
			marked.push(term.id);
			if (start > from) out.push({ type: 'text', value: node.value.slice(from, start) });
			out.push({
				type: 'element',
				tagName: 'a',
				properties: { className: ['glossary-mention'], href: hrefFor(term.id), dataTerm: term.id },
				children: [{ type: 'text', value: m[0] }],
			});
			from = end;
		}
		if (from === 0) return [node];
		if (from < node.value.length) out.push({ type: 'text', value: node.value.slice(from) });
		return out;
	};

	const walk = (parent: Root | Element) => {
		parent.children = parent.children.flatMap((child): RootContent[] => {
			if (child.type === 'text') return split(child);
			if (child.type === 'element' && !SKIP.has(child.tagName)) walk(child);
			return [child];
		}) as typeof parent.children;
	};

	const tree = fromHtml(html, { fragment: true });
	walk(tree);
	return { html: toHtml(tree, { characterReferences: { useNamedReferences: true } }), marked };
}
