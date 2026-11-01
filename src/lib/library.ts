// Pure helpers for the library. No `astro:content` import, so `bun test` can run them.

export type Ref = { id: string };

export type Item = {
	id: string;
	data: { title: string; type: string; tags: string[]; chapters: Ref[]; related: Ref[] };
};

export const TYPE_ORDER = [
	'article',
	'docs',
	'talk',
	'interview',
	'paper',
	'model',
	'tool',
	'repo',
	'newsletter',
	'inspiration',
] as const;

export const TYPE_LABELS: Record<string, string> = {
	article: 'Articles',
	docs: 'Documentation',
	talk: 'Talks',
	interview: 'Interviews',
	paper: 'Papers',
	model: 'Models',
	tool: 'Tools',
	repo: 'Repositories',
	newsletter: 'Newsletters',
	inspiration: 'Inspiration',
};

export function withBase(base: string, path: string): string {
	return `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}

const byTitle = (a: Item, b: Item) => a.data.title.localeCompare(b.data.title);

export function groupByType<T extends Item>(items: T[]): Array<{ type: string; items: T[] }> {
	return TYPE_ORDER.map((type) => ({
		type,
		items: items.filter((i) => i.data.type === type).sort(byTitle),
	})).filter((g) => g.items.length > 0);
}

export function allTags(items: Item[]): string[] {
	return [...new Set(items.flatMap((i) => i.data.tags))].sort();
}

export function itemsForChapter<T extends Item>(items: T[], chapterId: string): T[] {
	return items.filter((i) => i.data.chapters.some((c) => c.id === chapterId)).sort(byTitle);
}

export function publishedChapters(refs: Ref[], published: Set<string>): Ref[] {
	return refs.filter((r) => published.has(r.id));
}

/** Astro only logs broken references; this lets the build fail on them. */
export function findBrokenRefs(items: Item[], docIds: Set<string>): string[] {
	const libIds = new Set(items.map((i) => i.id));
	return items.flatMap((i) => [
		...i.data.chapters
			.filter((c) => !docIds.has(c.id))
			.map((c) => `library/${i.id}: chapters → "${c.id}" does not exist`),
		...i.data.related
			.filter((r) => !libIds.has(r.id))
			.map((r) => `library/${i.id}: related → "${r.id}" does not exist`),
	]);
}

type SidebarLike = { type: 'link' | 'group'; label: string; entries?: SidebarLike[] };

/** Removes sidebar groups that end up with no links (e.g. a part whose chapters are all drafts). */
export function pruneEmptyGroups<T extends SidebarLike>(entries: T[]): T[] {
	return entries.flatMap((e) => {
		if (e.type !== 'group') return [e];
		const inner = pruneEmptyGroups((e.entries ?? []) as T[]);
		return inner.length > 0 ? [{ ...e, entries: inner }] : [];
	});
}

/** Removes a top-level sidebar link by its href (e.g. the glossary while no term is published). */
export function dropLink<T extends SidebarLike & { href?: string }>(entries: T[], href: string): T[] {
	return entries.filter((e) => !(e.type === 'link' && e.href === href));
}

/** Starlight built-in icon per library type. */
export const TYPE_ICONS: Record<string, string> = {
	article: 'document',
	docs: 'information',
	talk: 'comment-alt',
	interview: 'comment',
	paper: 'open-book',
	model: 'puzzle',
	tool: 'setting',
	repo: 'github',
	newsletter: 'email',
	inspiration: 'star',
};

/**
 * Where an in-text chapter link points. Published chapters link by their own title.
 * Draft chapters render as plain text in production (they aren't built), and as links in dev.
 * An unknown id throws, so a renamed or mistyped chapter fails the build.
 */
export function resolveChapterLink(
	id: string,
	chapter: { data: { title: string; draft?: boolean } } | undefined,
	env: { prod: boolean; base: string },
): { title: string; href: string | null } {
	if (!chapter) throw new Error(`ChapterLink: no chapter with id "${id}" in src/content/docs/`);
	const hidden = env.prod && chapter.data.draft === true;
	return { title: chapter.data.title, href: hidden ? null : withBase(env.base, `/${id}/`) };
}

/** The current text of the heading `id` on page `page`. Unknown ids fail the build. */
export function resolveSectionLink(id: string, headings: Array<{ slug: string; text: string }>, page: string): string {
	const heading = headings.find((h) => h.slug === id);
	if (!heading) {
		const known = headings.map((h) => h.slug).join(', ') || 'none';
		throw new Error(`SectionLink: no heading with id "${id}" in ${page} (headings: ${known})`);
	}
	return heading.text;
}
