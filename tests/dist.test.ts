// Checks the production build in dist/. Run via `bun run test:dist` (builds first).
// Expectations are derived from the content, so they hold however many chapters are published.
import { describe, expect, test } from 'bun:test';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = join(import.meta.dir, '..');
const DIST = join(ROOT, 'dist');
const DOCS = join(ROOT, 'src/content/docs');
const LIBRARY = join(ROOT, 'src/content/library');

function walk(dir: string, ext: string): string[] {
	return readdirSync(dir).flatMap((name) => {
		const p = join(dir, name);
		return statSync(p).isDirectory() ? walk(p, ext) : p.endsWith(ext) ? [p] : [];
	});
}

const pages = walk(DIST, '.html').map((f) => ({ path: relative(DIST, f), html: readFileSync(f, 'utf8') }));

// Chapters: id like "part-3-building-and-judging/evals", from src/content/docs/part-*/*.mdx
const chapters = walk(DOCS, '.mdx')
	.map((f) => relative(DOCS, f).replace(/\.mdx$/, ''))
	.filter((id) => id.startsWith('part-'))
	.map((id) => ({ id, draft: /^draft:\s*true\s*$/m.test(readFileSync(join(DOCS, `${id}.mdx`), 'utf8')) }));
const drafts = chapters.filter((c) => c.draft).map((c) => c.id);
const publishedIds = chapters.filter((c) => !c.draft).map((c) => c.id);

const entries = walk(LIBRARY, '.yaml').map((f) => Bun.YAML.parse(readFileSync(f, 'utf8')) as {
	title: string;
	chapters?: string[];
});
const cited = new Set(entries.flatMap((e) => e.chapters ?? []));

const PART_LABELS: Record<string, string> = {
	'part-1-primitives': 'Part I: Primitives',
	'part-2-model-to-agent': 'Part II: From model to agent',
	'part-3-building-and-judging': 'Part III: Building and judging agents',
	'part-4-in-practice': 'Part IV: In practice',
};

describe('production build', () => {
	test('every root-relative link on every page carries the /ai-resources base', () => {
		const offenders = pages.flatMap(({ path, html }) =>
			[...html.matchAll(/href="(\/[^"]*)"/g)]
				.map((m) => m[1])
				.filter((href) => !href.startsWith('/ai-resources/'))
				.map((href) => `${path}: ${href}`),
		);
		expect(offenders).toEqual([]);
	});

	test('library index lists every entry', () => {
		const html = readFileSync(join(DIST, 'library/index.html'), 'utf8');
		expect(entries.map((e) => e.title).filter((t) => !html.includes(`>${t}<`))).toEqual([]);
	});

	test('draft chapters are not built and nothing links to them', () => {
		expect(drafts.filter((id) => pages.some((p) => p.path === `${id}/index.html`))).toEqual([]);
		const offenders = pages.flatMap(({ path, html }) =>
			drafts.filter((id) => html.includes(`href="/ai-resources/${id}/"`)).map((id) => `${path} → ${id}`),
		);
		expect(offenders).toEqual([]);
	});

	test('Further reading appears exactly on published chapters that library entries cite', () => {
		const withBlock = pages.filter((p) => p.html.includes('id="further-reading"')).map((p) => p.path).sort();
		const expected = publishedIds.filter((id) => cited.has(id)).map((id) => `${id}/index.html`).sort();
		expect(withBlock).toEqual(expected);
	});

	test('sidebar shows a part only when it has a published chapter', () => {
		const html = readFileSync(join(DIST, 'library/index.html'), 'utf8');
		for (const [dir, label] of Object.entries(PART_LABELS)) {
			const hasPublished = publishedIds.some((id) => id.startsWith(`${dir}/`));
			expect({ label, shown: html.includes(label) }).toEqual({ label, shown: hasPublished });
		}
	});
});
