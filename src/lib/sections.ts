// Headings and <Draft> blocks in a chapter's raw MDX body. Pure, so `bun test` covers it.
import GithubSlugger from 'github-slugger';

export type Heading = { slug: string; text: string; offset: number };

const FENCE = /^\s*(```|~~~)/;

/** h2 to h6 outside code fences, with the slug Astro gives each (github-slugger, in page order). */
export function headingsOf(body: string): Heading[] {
	const slugger = new GithubSlugger();
	const headings: Heading[] = [];
	let fenced = false;
	let offset = 0;
	for (const line of body.split('\n')) {
		if (FENCE.test(line)) fenced = !fenced;
		const h = fenced ? null : /^#{2,6}\s+(.+?)\s*$/.exec(line);
		if (h) {
			const text = h[1].replace(/[_*`]/g, '');
			headings.push({ slug: slugger.slug(text), text, offset });
		}
		offset += line.length + 1;
	}
	return headings;
}

/** [start, end) character ranges of each <Draft>…</Draft> block. An unclosed block runs to the end. */
export function draftRanges(body: string): Array<[number, number]> {
	return [...body.matchAll(/<Draft\s*>/g)].map((m) => {
		const close = body.indexOf('</Draft>', m.index);
		return [m.index, close === -1 ? body.length : close];
	});
}

export function inDraft(ranges: Array<[number, number]>, offset: number): boolean {
	return ranges.some(([start, end]) => offset >= start && offset < end);
}

/** Slugs of the headings inside <Draft> blocks: kept out of the published page's outline. */
export function draftHeadingSlugs(body: string): Set<string> {
	const ranges = draftRanges(body);
	return new Set(headingsOf(body).filter((h) => inDraft(ranges, h.offset)).map((h) => h.slug));
}
