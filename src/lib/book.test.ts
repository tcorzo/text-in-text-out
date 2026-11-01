import { describe, expect, test } from 'bun:test';
import { chaptersOf, contentsAnchor, PARTS, tableOfContents, withDraftChapters } from './book';

const doc = (id: string, order: number, draft = false) => ({ id, data: { title: id.split('/')[1], draft, sidebar: { order } } });
const docs = [
	doc('index', 0),
	doc('part-1-primitives/prompting', 3, true),
	doc('part-1-primitives/what-is-a-model', 1),
	doc('part-1-primitives/context-window', 2, true),
	doc('part-2-model-to-agent/tools', 1, true),
];
const chapters = chaptersOf(docs);
const link = (id: string) => ({ type: 'link' as const, label: id, href: `/text-in-text-out/${id}/`, isCurrent: false, attrs: {} });
const group = (label: string, entries: ReturnType<typeof link>[]) => ({ type: 'group' as const, label, entries, collapsed: false });

describe('tableOfContents', () => {
	test('lists every part, with its chapters in order and drafts included', () => {
		const toc = tableOfContents(chapters);
		expect(toc.map((t) => t.part.dir)).toEqual(PARTS.map((p) => p.dir));
		expect(toc[0].chapters.map((c) => c.id)).toEqual([
			'part-1-primitives/what-is-a-model',
			'part-1-primitives/context-window',
			'part-1-primitives/prompting',
		]);
		expect(toc[3].chapters).toEqual([]);
	});
});

describe('withDraftChapters', () => {
	test('in production, drafts link to the home page contents with a "Coming soon" badge', () => {
		const sidebar = [group('Part I: Primitives', [link('part-1-primitives/what-is-a-model')]), group('Part II: From model to agent', [])];
		const out = withDraftChapters(sidebar, chapters, { prod: true, base: '/text-in-text-out' });
		expect(out[0].entries.map((e) => [e.label, e.href, e.badge?.text])).toEqual([
			['part-1-primitives/what-is-a-model', '/text-in-text-out/part-1-primitives/what-is-a-model/', undefined],
			['context-window', `/text-in-text-out/#${contentsAnchor('part-1-primitives/context-window')}`, 'Coming soon'],
			['prompting', `/text-in-text-out/#${contentsAnchor('part-1-primitives/prompting')}`, 'Coming soon'],
		]);
		expect(out[1].entries.map((e) => e.badge?.text)).toEqual(['Coming soon']);
	});
	test('in dev, drafts keep their own page and get a "Draft" badge', () => {
		const sidebar = [
			group('Part I: Primitives', [
				link('part-1-primitives/what-is-a-model'),
				link('part-1-primitives/context-window'),
				link('part-1-primitives/prompting'),
			]),
		];
		const out = withDraftChapters(sidebar, chapters, { prod: false, base: '/text-in-text-out' });
		expect(out[0].entries.map((e) => [e.href, e.badge?.text])).toEqual([
			['/text-in-text-out/part-1-primitives/what-is-a-model/', undefined],
			['/text-in-text-out/part-1-primitives/context-window/', 'Draft'],
			['/text-in-text-out/part-1-primitives/prompting/', 'Draft'],
		]);
	});
	test('leaves other entries alone', () => {
		const library = link('library');
		expect(withDraftChapters([library], chapters, { prod: true, base: '/text-in-text-out' })).toEqual([library]);
	});
});
