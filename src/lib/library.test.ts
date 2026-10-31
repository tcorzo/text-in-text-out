import { describe, expect, test } from 'bun:test';
import {
	allTags,
	findBrokenRefs,
	groupByType,
	itemsForChapter,
	pruneEmptyGroups,
	publishedChapters,
	withBase,
	type Item,
} from './library';

const item = (id: string, over: Partial<Item['data']> = {}): Item => ({
	id,
	data: { title: id, type: 'tool', tags: [], chapters: [], related: [], ...over },
});

describe('withBase', () => {
	test('joins base and path with a single slash', () => {
		expect(withBase('/ai-resources', '/library/')).toBe('/ai-resources/library/');
		expect(withBase('/ai-resources/', 'library/')).toBe('/ai-resources/library/');
	});
	test('root base', () => {
		expect(withBase('/', '/library/')).toBe('/library/');
	});
});

describe('groupByType', () => {
	test('orders groups by TYPE_ORDER, sorts items by title, omits empty groups', () => {
		const groups = groupByType([
			item('B', { type: 'tool' }),
			item('Z', { type: 'article' }),
			item('A', { type: 'tool' }),
		]);
		expect(groups.map((g) => g.type)).toEqual(['article', 'tool']);
		expect(groups[1].items.map((i) => i.id)).toEqual(['A', 'B']);
	});
});

describe('allTags', () => {
	test('unique and sorted', () => {
		expect(allTags([item('a', { tags: ['evals', 'agents'] }), item('b', { tags: ['evals'] })])).toEqual([
			'agents',
			'evals',
		]);
	});
});

describe('itemsForChapter', () => {
	const evals = 'part-3-building-and-judging/evals';
	const items = [
		item('Zeta', { chapters: [{ id: evals }] }),
		item('Alpha', { chapters: [{ id: evals }, { id: 'x/y' }] }),
		item('Other', { chapters: [{ id: 'x/y' }] }),
	];
	test('returns only items citing the chapter, sorted by title', () => {
		expect(itemsForChapter(items, evals).map((i) => i.id)).toEqual(['Alpha', 'Zeta']);
	});
	test('empty when none cite it', () => {
		expect(itemsForChapter(items, 'nope/none')).toEqual([]);
	});
});

describe('publishedChapters', () => {
	test('drops refs to unpublished chapters', () => {
		expect(publishedChapters([{ id: 'a' }, { id: 'b' }], new Set(['b']))).toEqual([{ id: 'b' }]);
	});
});

describe('findBrokenRefs', () => {
	test('names the entry and field of every reference that does not exist', () => {
		const items = [
			item('good', { chapters: [{ id: 'p/c' }], related: [{ id: 'other' }] }),
			item('other', { chapters: [{ id: 'part-9/nope' }], related: [{ id: 'ghost' }] }),
		];
		expect(findBrokenRefs(items, new Set(['p/c']))).toEqual([
			'library/other: chapters → "part-9/nope" does not exist',
			'library/other: related → "ghost" does not exist',
		]);
	});
	test('empty when all refs resolve', () => {
		expect(findBrokenRefs([item('a', { chapters: [{ id: 'p/c' }] })], new Set(['p/c']))).toEqual([]);
	});
});

describe('pruneEmptyGroups', () => {
	const link = { type: 'link' as const, label: 'L' };
	test('drops groups with no links, recursively, and keeps links and non-empty groups', () => {
		const pruned = pruneEmptyGroups([
			{ type: 'group', label: 'Empty', entries: [] },
			{ type: 'group', label: 'Nested empty', entries: [{ type: 'group', label: 'Inner', entries: [] }] },
			{ type: 'group', label: 'Full', entries: [link] },
			link,
		]);
		expect(pruned.map((e) => e.label)).toEqual(['Full', 'L']);
	});
});
