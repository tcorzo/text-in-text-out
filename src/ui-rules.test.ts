import { describe, expect, test } from 'bun:test';
import { Glob } from 'bun';
import { join } from 'node:path';
import { checkUi } from './lib/ui-rules';

const TODAY = new Date().toISOString().slice(0, 10);
const ROOT = join(import.meta.dir, '..');

describe('UI rule: Starlight components before plugins before hand-rolled HTML', () => {
	test('repo source follows it', async () => {
		const files = [];
		for await (const path of new Glob('src/**/*.{astro,mdx}').scan(ROOT)) {
			files.push({ path, content: await Bun.file(join(ROOT, path)).text() });
		}
		expect(checkUi(files, TODAY).errors).toEqual([]);
	});

	// The real first version of src/components/LibraryItem.astro (commit aceeff5), trimmed.
	test('flags the past hand-rolled library item', () => {
		const past = [
			'<article class="library-item" id={item.id}>',
			'\t<p class="tags">',
			'\t\t{data.tags.map((t) => (',
			'\t\t\t<a href={withBase(base, `/library/tags/${t}/`)}>#{t}</a>',
			'</article>',
			'<style>',
			'\t.library-item { margin-block: 1.5rem; }',
			'</style>',
		].join('\n');
		const { errors } = checkUi([{ path: 'LibraryItem.astro', content: past }], TODAY);
		expect(errors.some((e) => e.includes('LibraryItem.astro:1') && e.includes('<Card>'))).toBe(true);
		expect(errors.some((e) => e.includes('LibraryItem.astro:6') && e.includes('<style>'))).toBe(true);
	});

	test('flags the past "← Library" text link', () => {
		const { errors } = checkUi([{ path: 't.astro', content: "<p><a href={x}>← Library</a></p>" }], TODAY);
		expect(errors).toHaveLength(1);
		expect(errors[0]).toContain('<LinkButton');
	});

	// The real line from what-is-a-model.mdx before <ChapterLink> existed.
	test('flags a chapter named in plain text or linked by hand', () => {
		const past = 'and `usage` counts every message again on every call. The chapter on tokens and the context window covers how long a conversation can get.';
		const handLink = 'See [Tokens](../tokens-and-context/) and [Evals](/text-in-text-out/part-3-building-and-judging/evals/).';
		const ok = '<ChapterLink id="part-1-primitives/tokens-and-context" /> covers it.';
		expect(checkUi([{ path: 'a.mdx', content: past }], TODAY).errors[0]).toContain('<ChapterLink');
		expect(checkUi([{ path: 'b.mdx', content: handLink }], TODAY).errors).toHaveLength(1);
		expect(checkUi([{ path: 'c.mdx', content: ok }], TODAY).errors).toEqual([]);
	});

	// The real lines from what-is-a-model.mdx when the section was "Calling it", and after its rename.
	test('flags a section linked by hand, named in prose, or linked after a rename', () => {
		const before = [
			'## Calling it',
			'<span id="the-response" />The response is JSON.',
			'Here is the loop producing the reply from [Calling it](#calling-it).',
			'This loop explains two fields from [the response](#the-response) in Calling it.',
		];
		const errors = checkUi([{ path: 'a.mdx', content: before.join('\n') }], TODAY).errors;
		expect(errors).toHaveLength(2);
		expect(errors[0]).toContain('a.mdx:3: hand-written link to section #calling-it');
		expect(errors[1]).toContain('a.mdx:4: section "Calling it" named in prose');
		const renamed = ['## Calling the model', ...before.slice(1)].join('\n');
		expect(checkUi([{ path: 'b.mdx', content: renamed }], TODAY).errors[0]).toContain('no heading or id="calling-it"');
		const ok = [
			'## Calling the model',
			'```md',
			'[Calling it](#calling-it)',
			'```',
			'From <SectionLink id="calling-the-model" />, see [the response](#the-response).',
			'<span id="the-response" />',
		];
		expect(checkUi([{ path: 'c.mdx', content: ok.join('\n') }], TODAY).errors).toEqual([]);
	});

	test('accepts a <style> with a live exception; rejects an expired one', () => {
		const ok = '<style>\n\t/* ui-exception: layout gap; expires: 2999-01-01 */\n</style>';
		const old = '<style>\n\t/* ui-exception: layout gap; expires: 2000-01-01 */\n</style>';
		expect(checkUi([{ path: 'a.astro', content: ok }], TODAY).errors).toEqual([]);
		expect(checkUi([{ path: 'b.astro', content: old }], TODAY).errors[0]).toContain('expired');
	});
});
