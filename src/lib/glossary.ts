// Pure helpers for the glossary. No `astro:content` import, so `bun test` can run them.
// A term's home is the chapter where its <Define term="..."> sits; nothing else records it.

export type TermData = {
	term: string;
	forms: string[];
	definition: string;
	image?: string;
	skip: string[];
	markMentions: boolean;
};
export type Term = { id: string; data: TermData };
/** One <Define term="..."> in a chapter body. `index` is its character offset in the body. */
export type DefineSite = { term: string; chapter: string; index: number };
export type Mentionable = { id: string; forms: string[]; skip: string[] };
export type GlossaryGroup = { chapter: string; terms: Array<{ term: Term; site: DefineSite }> };

const DEFINE = /<Define\s+term="([^"]+)"/g;

export function findDefines(chapters: Array<{ id: string; body: string }>): DefineSite[] {
	return chapters.flatMap(({ id, body }) =>
		[...body.matchAll(DEFINE)].map((m) => ({ term: m[1], chapter: id, index: m.index ?? 0 })),
	);
}

/** Every way the glossary and the chapters disagree, one message per problem. */
export function checkGlossary(termIds: string[], sites: DefineSite[]): string[] {
	const known = new Set(termIds);
	const byTerm = Map.groupBy(sites, (s) => s.term);
	return [
		...sites
			.filter((s) => !known.has(s.term))
			.map((s) => `glossary: <Define term="${s.term}"> in ${s.chapter} has no glossary file in src/content/glossary/`),
		...[...byTerm]
			.filter(([t, list]) => known.has(t) && list.length > 1)
			.map(([t, list]) => `glossary: "${t}" is defined more than once (${list.map((s) => s.chapter).join(', ')})`),
		...termIds
			.filter((t) => !byTerm.has(t))
			.map((t) => `glossary: "${t}" has a glossary file but is never defined with <Define> in any chapter`),
	];
}

/** Chapter ids in reading order: part folder, then sidebar.order (missing sorts last), then id. */
export function readingOrder(chapters: Array<{ id: string; data: { sidebar?: { order?: number } } }>): string[] {
	const part = (id: string) => id.split('/')[0];
	const rank = (c: (typeof chapters)[number]) => c.data.sidebar?.order ?? Number.POSITIVE_INFINITY;
	return chapters
		.filter((c) => c.id.startsWith('part-'))
		.sort((a, b) => part(a.id).localeCompare(part(b.id)) || rank(a) - rank(b) || a.id.localeCompare(b.id))
		.map((c) => c.id);
}

/** Terms on the glossary page: grouped by defining chapter in reading order, then by position in it. */
export function groupByChapter(terms: Term[], sites: DefineSite[], order: string[], published: Set<string>): GlossaryGroup[] {
	const siteOf = new Map(sites.map((s) => [s.term, s]));
	return order
		.filter((chapter) => published.has(chapter))
		.map((chapter) => ({
			chapter,
			terms: terms
				.flatMap((term) => {
					const site = siteOf.get(term.id);
					return site?.chapter === chapter ? [{ term, site }] : [];
				})
				.sort((a, b) => a.site.index - b.site.index),
		}))
		.filter((g) => g.terms.length > 0);
}

/** Terms whose first mention gets marked in `chapter`: defined in an earlier, published chapter. */
export function mentionableIn(
	chapter: string,
	terms: Term[],
	sites: DefineSite[],
	order: string[],
	published: Set<string>,
): Mentionable[] {
	const here = order.indexOf(chapter);
	const siteOf = new Map(sites.map((s) => [s.term, s]));
	return terms
		.filter((t) => {
			const site = siteOf.get(t.id);
			return (
				t.data.markMentions &&
				site !== undefined &&
				published.has(site.chapter) &&
				order.indexOf(site.chapter) < here &&
				order.indexOf(site.chapter) !== -1
			);
		})
		.map((t) => ({ id: t.id, forms: [t.data.term, ...t.data.forms], skip: t.data.skip }));
}
