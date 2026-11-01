import { expect, test } from 'bun:test';
import { draftHeadingSlugs, headingsOf } from './sections';

const body = [
	'## Who _are_ you?',
	'```md',
	'## Not a heading',
	'```',
	'<Draft>',
	'## What can the model do?',
	'### Details',
	'</Draft>',
	'## The same call',
	'## Details',
].join('\n');

test('headingsOf slugs headings like Astro, skips code fences, and numbers repeats', () => {
	expect(headingsOf(body).map((h) => h.slug)).toEqual([
		'who-are-you',
		'what-can-the-model-do',
		'details',
		'the-same-call',
		'details-1',
	]);
});

test('draftHeadingSlugs returns only the headings inside <Draft> blocks', () => {
	expect([...draftHeadingSlugs(body)]).toEqual(['what-can-the-model-do', 'details']);
	expect([...draftHeadingSlugs('<Draft>\n## Unclosed')]).toEqual(['unclosed']);
	expect(draftHeadingSlugs('## No drafts').size).toBe(0);
});
