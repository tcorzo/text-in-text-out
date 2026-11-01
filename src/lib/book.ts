// The book's table of contents: parts in order, each with its chapters, drafts included.
// Pure: no `astro:content` import, so `bun test` can run it. Used by the home page and the sidebar.
import { withBase } from './library';

export type Part = { dir: string; label: string; summary: string };

/** Sidebar labels must match the groups in astro.config.mjs. */
export const PARTS: Part[] = [
	{
		dir: 'part-1-primitives',
		label: 'Part I: Primitives',
		summary: 'The model as a component: its interface, its limits, and how you shape its output.',
	},
	{
		dir: 'part-2-model-to-agent',
		label: 'Part II: From model to agent',
		summary: 'Tools, a loop, and memory: the pieces that turn a model into an agent.',
	},
	{
		dir: 'part-3-building-and-judging',
		label: 'Part III: Building and judging agents',
		summary: 'The runtime around the agent, what goes into its context window, and how you test output that varies between runs.',
	},
	{
		dir: 'part-4-in-practice',
		label: 'Part IV: In practice',
		summary: 'Agents in production today, and the patterns they share.',
	},
];

export type Chapter = { id: string; title: string; order: number; draft: boolean };
export type DocLike = { id: string; data: { title: string; draft?: boolean; sidebar?: { order?: number } } };

export function chaptersOf(docs: DocLike[]): Chapter[] {
	return docs
		.filter((d) => d.id.startsWith('part-'))
		.map((d) => ({ id: d.id, title: d.data.title, order: d.data.sidebar?.order ?? 0, draft: d.data.draft ?? false }));
}

/** Every part with its chapters in reading order. */
export function tableOfContents(chapters: Chapter[]): Array<{ part: Part; chapters: Chapter[] }> {
	return PARTS.map((part) => ({
		part,
		chapters: chapters.filter((c) => c.id.startsWith(`${part.dir}/`)).sort((a, b) => a.order - b.order),
	}));
}

/** The id of a chapter's line in the home page's contents: "chapter-part-1-primitives-prompting". */
export function contentsAnchor(id: string): string {
	return `chapter-${id.replace('/', '-')}`;
}

export const DRAFT_BADGE = { text: 'Draft', variant: 'caution' } as const;
export const COMING_SOON_BADGE = { text: 'Coming soon', variant: 'note' } as const;

type Badge = { text: string; variant: string };
type SidebarEntry = {
	type: 'link' | 'group';
	label: string;
	href?: string;
	isCurrent?: boolean;
	badge?: Badge;
	attrs?: Record<string, string>;
	entries?: SidebarEntry[];
	collapsed?: boolean;
};

/**
 * Lists every chapter in its part's sidebar group, drafts included.
 * In dev a draft links to its page with a "Draft" badge. In production its page isn't built,
 * so it links to its line in the home page's contents, with a "Coming soon" badge.
 */
export function withDraftChapters<T extends SidebarEntry>(
	sidebar: T[],
	chapters: Chapter[],
	opts: { prod: boolean; base: string },
): T[] {
	const contents = tableOfContents(chapters);
	return sidebar.map((entry) => {
		const toc = entry.type === 'group' ? contents.find((c) => c.part.label === entry.label) : undefined;
		if (!toc) return entry;
		const existing = (entry.entries ?? []) as T[];
		const entries = toc.chapters.map((chapter) => {
			const built = existing.find((e) => e.type === 'link' && e.href?.endsWith(`/${chapter.id}/`));
			if (!chapter.draft) return built;
			if (!opts.prod && built) return { ...built, badge: DRAFT_BADGE };
			return {
				type: 'link',
				label: chapter.title,
				href: withBase(opts.base, `/#${contentsAnchor(chapter.id)}`),
				isCurrent: false,
				badge: COMING_SOON_BADGE,
				attrs: {},
			} as unknown as T;
		});
		return { ...entry, entries: entries.filter((e): e is T => e !== undefined) };
	});
}
