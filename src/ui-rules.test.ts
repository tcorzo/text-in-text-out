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

	test('accepts a <style> with a live exception; rejects an expired one', () => {
		const ok = '<style>\n\t/* ui-exception: layout gap; expires: 2999-01-01 */\n</style>';
		const old = '<style>\n\t/* ui-exception: layout gap; expires: 2000-01-01 */\n</style>';
		expect(checkUi([{ path: 'a.astro', content: ok }], TODAY).errors).toEqual([]);
		expect(checkUi([{ path: 'b.astro', content: old }], TODAY).errors[0]).toContain('expired');
	});
});
