import { expect, test } from 'bun:test';
import {
	checkGlossary,
	findDefines,
	groupByChapter,
	mentionableIn,
	readingOrder,
	type DefineSite,
	type Term,
	type TermData,
} from './glossary';

const term = (id: string, extra: Partial<TermData> = {}): Term => ({
	id,
	data: { term: id, forms: [], definition: `${id} def`, skip: [], markMentions: true, ...extra },
});

test('findDefines finds every <Define term> with its chapter and offset', () => {
	const sites = findDefines([
		{ id: 'part-1-primitives/a', body: 'x <Define term="model">model</Define> y <Define  term="token">tokens</Define>' },
		{ id: 'part-1-primitives/b', body: 'no terms here, and *italics* are not terms' },
	]);
	expect(sites.map((s) => [s.term, s.chapter])).toEqual([
		['model', 'part-1-primitives/a'],
		['token', 'part-1-primitives/a'],
	]);
	expect(sites[0].index).toBeLessThan(sites[1].index);
});

test('checkGlossary reports unknown, duplicate, and undefined terms', () => {
	const errors = checkGlossary(
		['model', 'token', 'role'],
		[
			{ term: 'model', chapter: 'part-1-primitives/a', index: 0 },
			{ term: 'model', chapter: 'part-1-primitives/b', index: 0 },
			{ term: 'tool', chapter: 'part-2-model-to-agent/tools', index: 0 },
			{ term: 'token', chapter: 'part-1-primitives/a', index: 5 },
		],
	);
	expect(errors.some((e) => e.includes('"tool"') && e.includes('no glossary file'))).toBe(true);
	expect(errors.some((e) => e.includes('"model"') && e.includes('defined more than once'))).toBe(true);
	expect(errors.some((e) => e.includes('"role"') && e.includes('never defined'))).toBe(true);
	expect(errors).toHaveLength(3);
});

test('readingOrder sorts by part folder, then sidebar.order, and drops non-chapters', () => {
	expect(
		readingOrder([
			{ id: 'part-2-model-to-agent/tools', data: { sidebar: { order: 1 } } },
			{ id: 'part-1-primitives/prompting', data: { sidebar: { order: 3 } } },
			{ id: 'index', data: {} },
			{ id: 'part-1-primitives/what-is-a-model', data: { sidebar: { order: 1 } } },
		]),
	).toEqual(['part-1-primitives/what-is-a-model', 'part-1-primitives/prompting', 'part-2-model-to-agent/tools']);
});

const order = ['part-1-primitives/a', 'part-1-primitives/b', 'part-1-primitives/c'];
const sites: DefineSite[] = [
	{ term: 'token', chapter: 'part-1-primitives/b', index: 10 },
	{ term: 'model', chapter: 'part-1-primitives/b', index: 2 },
	{ term: 'tool', chapter: 'part-1-primitives/c', index: 0 },
];
const terms = [
	term('model', { markMentions: false }),
	term('token', { forms: ['tokens'], skip: ['token budget'] }),
	term('tool'),
];

test('mentionableIn returns only terms defined in earlier published chapters with marking on', () => {
	const all = new Set(order);
	expect(mentionableIn('part-1-primitives/a', terms, sites, order, all)).toEqual([]);
	expect(mentionableIn('part-1-primitives/b', terms, sites, order, all)).toEqual([]);
	expect(mentionableIn('part-1-primitives/c', terms, sites, order, all)).toEqual([
		{ id: 'token', forms: ['token', 'tokens'], skip: ['token budget'] },
	]);
	const bIsDraft = new Set(['part-1-primitives/a', 'part-1-primitives/c']);
	expect(mentionableIn('part-1-primitives/c', terms, sites, order, bIsDraft)).toEqual([]);
});

test('groupByChapter follows reading order, then position in the chapter, and drops unpublished', () => {
	const groups = groupByChapter(terms, sites, order, new Set(['part-1-primitives/b']));
	expect(groups.map((g) => [g.chapter, g.terms.map((t) => t.term.id)])).toEqual([
		['part-1-primitives/b', ['model', 'token']],
	]);
});
